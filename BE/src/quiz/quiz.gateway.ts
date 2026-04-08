import { BadRequestException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type {
  QuizSessionAnswerEvent,
  QuizSessionResultEvent,
  QuizSessionUpdateEvent,
} from './domain/entities';

type JoinSessionPayload = {
  sessionId?: string;
  participantId?: string | null;
};

const sessionRoom = (sessionId: string): string => `quiz-session:${sessionId}`;

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  path: '/quiz-sockets',
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  handleConnection(client: Socket): void {
    client.emit('quiz-session:connected', {
      connected: true,
      sessionId: client.handshake.query.sessionId ?? null,
      participantId: client.handshake.query.participantId ?? null,
    });
  }

  handleDisconnect(client: Socket): void {
    client.emit('quiz-session:disconnected', {
      connected: false,
    });
  }

  @SubscribeMessage('quiz-session:join')
  handleJoin(
    @MessageBody() payload: JoinSessionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload.sessionId) {
      throw new BadRequestException('sessionId is required');
    }

    client.join(sessionRoom(payload.sessionId));

    return {
      sessionId: payload.sessionId,
      participantId: payload.participantId ?? null,
      room: sessionRoom(payload.sessionId),
    };
  }

  @SubscribeMessage('quiz-session:leave')
  handleLeave(
    @MessageBody() payload: JoinSessionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload.sessionId) {
      throw new BadRequestException('sessionId is required');
    }

    client.leave(sessionRoom(payload.sessionId));

    return {
      sessionId: payload.sessionId,
      participantId: payload.participantId ?? null,
      room: sessionRoom(payload.sessionId),
    };
  }

  public emitSessionUpdated(
    sessionId: string,
    payload: QuizSessionUpdateEvent,
  ): void {
    this.server.to(sessionRoom(sessionId)).emit('quiz-session:updated', payload);
  }

  public emitAnswerSubmitted(
    sessionId: string,
    payload: QuizSessionAnswerEvent,
  ): void {
    this.server
      .to(sessionRoom(sessionId))
      .emit('quiz-session:answer-submitted', payload);
  }

  public emitResultAvailable(
    sessionId: string,
    payload: QuizSessionResultEvent,
  ): void {
    this.server
      .to(sessionRoom(sessionId))
      .emit('quiz-session:result', payload);
  }
}
