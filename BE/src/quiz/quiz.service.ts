import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { AuditAction } from 'src/generated/prisma/enums';
import { AjvValidationPipe } from 'src/common/pipes/ajv-validation.pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import { QuizGateway } from './quiz.gateway';
import {
  type CreateQuestionInput,
  type CreateQuizInput,
  type CreateQuizSessionInput,
  type JoinQuizSessionInput,
  type QuizSessionAnswerSubmissionResult,
  type QuizDetail,
  type QuizQuestion,
  type QuizQuestionInput,
  type QuizSessionParticipantResult,
  type QuizSearchItem,
  type QuizSessionDetail,
  type QuizSessionQuestionComparison,
  type QuizSessionResult,
  type QuestionOptionLabel,
  type SearchQuizzesInput,
  type SearchQuizzesResult,
  type SessionParticipant,
  type SubmitQuizSessionAnswerInput,
  type UpdateQuestionInput,
  type UpdateQuizInput,
} from './domain/entities';
import { quizQuestionSchema } from './domain/schemas';
import { randomBytes } from 'node:crypto';

const quizSearchArgs = {
  select: {
    id: true,
    title: true,
    topic: true,
    difficulty: true,
    description: true,
    _count: {
      select: {
        questions: true,
      },
    },
  },
} as const;

const questionArgs = {
  select: {
    id: true,
    description: true,
    type: true,
    options: {
      orderBy: {
        optionOrder: 'asc' as const,
      },
      select: {
        optionOrder: true,
        word: true,
        label: true,
      },
    },
  },
} as const;

const quizDetailArgs = {
  select: {
    id: true,
    title: true,
    topic: true,
    difficulty: true,
    description: true,
    questions: {
      orderBy: {
        createdAt: 'asc' as const,
      },
      select: questionArgs.select,
    },
  },
} as const;

const quizSessionArgs = {
  select: {
    id: true,
    quizId: true,
    mode: true,
    status: true,
    joinCode: true,
    shareLink: true,
    currentQuestion: true,
    startedAt: true,
    completedAt: true,
    expiresAt: true,
    participants: {
      orderBy: {
        joinedAt: 'asc' as const,
      },
      select: {
        id: true,
        userId: true,
        seat: true,
        joinedAt: true,
        lastAnsweredAt: true,
        lastAnswerMs: true,
      },
    },
    quiz: quizDetailArgs,
  },
} as const;

const quizSessionGameplayArgs = {
  select: {
    ...quizSessionArgs.select,
    answers: {
      orderBy: {
        answeredAt: 'asc' as const,
      },
      select: {
        id: true,
        sessionId: true,
        participantId: true,
        questionId: true,
        selectedOrder: true,
        isCorrect: true,
        scoreAwarded: true,
        answeredAt: true,
        participant: {
          select: {
            id: true,
            userId: true,
            seat: true,
            joinedAt: true,
            lastAnsweredAt: true,
            lastAnswerMs: true,
          },
        },
        question: {
          select: {
            id: true,
            description: true,
            type: true,
            options: {
              orderBy: {
                optionOrder: 'asc' as const,
              },
              select: {
                optionOrder: true,
                word: true,
                label: true,
              },
            },
          },
        },
      },
    },
  },
} as const;

type PrismaTransactionClient = Prisma.TransactionClient;
type QuizSearchRow = Prisma.QuizGetPayload<typeof quizSearchArgs>;
type QuizDetailRow = Prisma.QuizGetPayload<typeof quizDetailArgs>;
type QuizQuestionRow = Prisma.QuestionGetPayload<typeof questionArgs>;
type QuizSessionRow = Prisma.QuizSessionGetPayload<typeof quizSessionArgs>;
type QuizSessionGameplayRow = Prisma.QuizSessionGetPayload<
  typeof quizSessionGameplayArgs
>;

const QUESTION_OPTION_LABELS: QuestionOptionLabel[] = ['HIDE', 'SHOW', 'EXTRA'];

@Injectable()
export class QuizService {
  private readonly quizQuestionValidationPipe = new AjvValidationPipe(
    quizQuestionSchema,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly quizGateway: QuizGateway,
  ) {}

  public async searchQuizzes(
    input: SearchQuizzesInput,
  ): Promise<SearchQuizzesResult> {
    const q = input.q?.trim();
    const page = this.normalizePage(input.page);
    const limit = this.normalizeLimit(input.limit);
    const skip = (page - 1) * limit;

    const where: Prisma.QuizWhereInput | undefined = q
      ? {
          OR: [
            {
              title: {
                contains: q,
                mode: 'insensitive',
              },
            },
          ],
        }
      : undefined;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.quiz.count({ where }),
        this.prisma.quiz.findMany({
        where,
        ...quizSearchArgs,
        orderBy: [
          {
            title: 'asc',
          },
          {
            id: 'asc',
          },
        ],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: items.map((item) => this.mapQuizSearchRow(item)),
      page,
      limit,
      total,
    };
  }

  public async getQuizDetail(quizId: string): Promise<QuizDetail> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      ...quizDetailArgs,
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return this.mapQuizDetailRow(quiz);
  }

  public async createQuiz(
    input: CreateQuizInput,
    actorUserId: string | null,
  ): Promise<QuizDetail> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const quiz = await tx.quiz.create({
          data: {
            title: input.title,
            topic: input.topic,
            difficulty: input.difficulty,
            description: input.description ?? null,
          },
          ...quizDetailArgs,
        });

        await this.createAuditEvent(tx, {
          actorUserId,
          quizId: quiz.id,
          action: AuditAction.CREATE,
          targetEntity: 'Quiz',
          targetId: quiz.id,
          metadata: {
            after: {
              title: input.title,
              topic: input.topic,
              difficulty: input.difficulty,
              description: input.description ?? null,
            },
          },
        });

        return this.mapQuizDetailRow(quiz);
      });
    } catch (error) {
      throw this.toBadRequestOrRethrow(error, 'Unable to create quiz');
    }
  }

  public async updateQuiz(
    quizId: string,
    input: UpdateQuizInput,
    actorUserId: string | null,
  ): Promise<QuizDetail> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const before = await tx.quiz.findUnique({
          where: { id: quizId },
          ...quizDetailArgs,
        });

        if (!before) {
          throw new NotFoundException('Quiz not found');
        }

        const updated = await tx.quiz.update({
          where: { id: quizId },
          data: {
            title: input.title,
            topic: input.topic,
            difficulty: input.difficulty,
            description: input.description ?? null,
          },
          ...quizDetailArgs,
        });

        await this.createAuditEvent(tx, {
          actorUserId,
          quizId,
          action: AuditAction.UPDATE,
          targetEntity: 'Quiz',
          targetId: quizId,
          metadata: {
            before,
            after: {
              title: input.title,
              topic: input.topic,
              difficulty: input.difficulty,
              description: input.description ?? null,
            },
          },
        });

        return this.mapQuizDetailRow(updated);
      });
    } catch (error) {
      throw this.toBadRequestOrRethrow(error, 'Unable to update quiz');
    }
  }

  public async deleteQuiz(
    quizId: string,
    actorUserId: string | null,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const before = await tx.quiz.findUnique({
          where: { id: quizId },
          ...quizDetailArgs,
        });

        if (!before) {
          throw new NotFoundException('Quiz not found');
        }

        await this.createAuditEvent(tx, {
          actorUserId,
          quizId,
          action: AuditAction.DELETE,
          targetEntity: 'Quiz',
          targetId: quizId,
          metadata: {
            before,
          },
        });

        await tx.quiz.delete({
          where: { id: quizId },
        });
      });
    } catch (error) {
      throw this.toBadRequestOrRethrow(error, 'Unable to delete quiz');
    }
  }

  public async createQuestion(
    quizId: string,
    input: CreateQuestionInput,
    actorUserId: string | null,
  ): Promise<QuizQuestion> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.ensureQuizExists(tx, quizId);

        const created = await tx.question.create({
          data: {
            quizId,
            description: input.description,
            type: input.type,
            options: {
              create: input.options.map((option, index) => ({
                optionOrder: index,
                word: option.word,
                label: option.label,
              })),
            },
          },
          ...questionArgs,
        });

        await this.createAuditEvent(tx, {
          actorUserId,
          quizId,
          action: AuditAction.CREATE,
          targetEntity: 'Question',
          targetId: created.id,
          metadata: {
            after: input as unknown as Prisma.JsonObject,
          },
        });

        return this.mapQuizQuestionRow(created);
      });
    } catch (error) {
      throw this.toBadRequestOrRethrow(error, 'Unable to create question');
    }
  }

  public async updateQuestion(
    quizId: string,
    questionId: string,
    input: UpdateQuestionInput,
    actorUserId: string | null,
  ): Promise<QuizQuestion> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.ensureQuizExists(tx, quizId);

        const before = await tx.question.findFirst({
          where: {
            id: questionId,
            quizId,
          },
          ...questionArgs,
        });

        if (!before) {
          throw new NotFoundException('Question not found');
        }

        const updated = await tx.question.update({
          where: { id: questionId },
          data: {
            description: input.description,
            type: input.type,
            options: {
              deleteMany: {},
              create: input.options.map((option, index) => ({
                optionOrder: index,
                word: option.word,
                label: option.label,
              })),
            },
          },
          ...questionArgs,
        });

        await this.createAuditEvent(tx, {
          actorUserId,
          quizId,
          action: AuditAction.UPDATE,
          targetEntity: 'Question',
          targetId: questionId,
          metadata: {
            before,
            after: input as unknown as Prisma.JsonObject,
          },
        });

        return this.mapQuizQuestionRow(updated);
      });
    } catch (error) {
      throw this.toBadRequestOrRethrow(error, 'Unable to update question');
    }
  }

  public async deleteQuestion(
    quizId: string,
    questionId: string,
    actorUserId: string | null,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.ensureQuizExists(tx, quizId);

        const before = await tx.question.findFirst({
          where: {
            id: questionId,
            quizId,
          },
          ...questionArgs,
        });

        if (!before) {
          throw new NotFoundException('Question not found');
        }

        await this.createAuditEvent(tx, {
          actorUserId,
          quizId,
          action: AuditAction.DELETE,
          targetEntity: 'Question',
          targetId: questionId,
          metadata: {
            before,
          },
        });

        await tx.question.delete({
          where: { id: questionId },
        });
      });
    } catch (error) {
      throw this.toBadRequestOrRethrow(error, 'Unable to delete question');
    }
  }

  public async createQuizSession(
    quizId: string,
    input: CreateQuizSessionInput,
  ): Promise<QuizSessionDetail> {
    await this.ensureQuizIsPlayable(quizId);

    const isSolo = input.mode === 'SOLO';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const joinCode = isSolo ? null : await this.generateJoinCode();
      const shareLink = joinCode ? `/quiz-sessions/join/${joinCode}` : null;
      const now = new Date();

      try {
        const session = await this.prisma.$transaction(async (tx) => {
          const created = await tx.quizSession.create({
            data: {
              quizId,
              mode: input.mode,
              status: isSolo ? 'ACTIVE' : 'PENDING',
              joinCode,
              shareLink,
              currentQuestion: 0,
              startedAt: isSolo ? now : null,
              participants: {
                create: {
                  userId: input.participantUserId ?? null,
                  seat: isSolo ? 'SOLO' : 'PLAYER_ONE',
                  joinedAt: now,
                },
              },
            },
            ...quizSessionArgs,
          });

          return created;
        });

        this.quizGateway.emitSessionUpdated(session.id, {
          session: this.mapQuizSessionRow(session),
        });

        return this.mapQuizSessionRow(session);
      } catch (error) {
        if (!this.isJoinCodeCollision(error) || isSolo) {
          throw this.toBadRequestOrRethrow(
            error,
            'Unable to create quiz session',
          );
        }

        if (attempt === 4) {
          throw new BadRequestException(
            'Unable to generate a unique join code',
          );
        }
      }
    }

    throw new BadRequestException('Unable to create quiz session');
  }

  public async joinQuizSession(
    joinCode: string,
    input: JoinQuizSessionInput,
  ): Promise<QuizSessionDetail> {
    const session = await this.prisma.quizSession.findUnique({
      where: { joinCode },
      ...quizSessionArgs,
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.mode !== 'TWO_PLAYER') {
      throw new BadRequestException(
        'Only two-player sessions can be joined by code',
      );
    }

    if (
      session.status === 'COMPLETED' ||
      session.status === 'CANCELLED' ||
      session.status === 'EXPIRED'
    ) {
      throw new BadRequestException('Session is no longer active');
    }

    if (session.participants.length >= 2) {
      throw new BadRequestException('Session already has two participants');
    }

    const existingSeats = new Set(
      session.participants.map((item) => item.seat),
    );
    if (existingSeats.has('PLAYER_TWO')) {
      throw new BadRequestException(
        'Player two has already joined this session',
      );
    }

    const updated = await this.prisma.quizSession.update({
      where: { id: session.id },
      data: {
        status: 'ACTIVE',
        startedAt: session.startedAt ?? new Date(),
        participants: {
          create: {
            userId: input.participantUserId ?? null,
            seat: 'PLAYER_TWO',
          },
        },
      },
      ...quizSessionArgs,
    });

    this.quizGateway.emitSessionUpdated(updated.id, {
      session: this.mapQuizSessionRow(updated),
    });

    return this.mapQuizSessionRow(updated);
  }

  public async getQuizSession(sessionId: string): Promise<QuizSessionDetail> {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      ...quizSessionArgs,
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.mapQuizSessionRow(session);
  }

  public async submitQuizSessionAnswer(
    sessionId: string,
    input: SubmitQuizSessionAnswerInput,
  ): Promise<QuizSessionAnswerSubmissionResult> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const session = await tx.quizSession.findUnique({
          where: { id: sessionId },
          ...quizSessionGameplayArgs,
        });

        if (!session) {
          throw new NotFoundException('Session not found');
        }

        if (session.status !== 'ACTIVE') {
          throw new BadRequestException('Session is not active');
        }

        const participant = session.participants.find(
          (item) => item.id === input.participantId,
        );

        if (!participant) {
          throw new BadRequestException('Participant not found in session');
        }

        const currentQuestion = session.quiz.questions[session.currentQuestion];
        if (!currentQuestion) {
          throw new BadRequestException('Session has no active question');
        }

        if (currentQuestion.id !== input.questionId) {
          throw new BadRequestException(
            'Question does not match the current session question',
          );
        }

        const existingAnswer = await tx.answer.findFirst({
          where: {
            sessionId,
            participantId: input.participantId,
            questionId: input.questionId,
          },
          select: {
            id: true,
          },
        });

        if (existingAnswer) {
          throw new BadRequestException(
            'Answer already submitted for this question',
          );
        }

        const canonicalOrder = this.getCanonicalOrder(currentQuestion);
        const selectedOrder = input.selectedOrder.map((word) => word.trim());

        this.validateSubmittedOrder(selectedOrder, canonicalOrder);

        const answeredAt = new Date();
        const scoreAwarded = this.calculateScore(selectedOrder, canonicalOrder);
        const isCorrect = this.areOrdersEqual(selectedOrder, canonicalOrder);

        await tx.answer.create({
          data: {
            sessionId,
            participantId: participant.id,
            questionId: currentQuestion.id,
            selectedOrder,
            isCorrect,
            scoreAwarded: new Prisma.Decimal(scoreAwarded.toFixed(1)),
            answeredAt,
          },
        });

        await tx.sessionParticipant.update({
          where: { id: participant.id },
          data: {
            lastAnsweredAt: answeredAt,
            lastAnswerMs: this.calculateElapsedMs(
              session.startedAt,
              answeredAt,
            ),
          },
        });

        const answersForCurrentQuestion = await tx.answer.count({
          where: {
            sessionId,
            questionId: currentQuestion.id,
          },
        });

        if (answersForCurrentQuestion >= session.participants.length) {
          const nextQuestionIndex = session.currentQuestion + 1;
          const hasMoreQuestions =
            nextQuestionIndex < session.quiz.questions.length;

          await tx.quizSession.update({
            where: { id: sessionId },
            data: {
              currentQuestion: nextQuestionIndex,
              status: hasMoreQuestions ? 'ACTIVE' : 'COMPLETED',
              completedAt: hasMoreQuestions ? null : answeredAt,
            },
          });
        }

        const refreshedSession = await tx.quizSession.findUnique({
          where: { id: sessionId },
          ...quizSessionGameplayArgs,
        });

        if (!refreshedSession) {
          throw new NotFoundException('Session not found');
        }

        return {
          session: this.mapQuizSessionRow(refreshedSession),
          comparison: this.buildQuestionComparison(
            refreshedSession,
            currentQuestion.id,
          ),
        };
      });

      this.quizGateway.emitAnswerSubmitted(sessionId, {
        session: result.session,
        comparison: result.comparison,
      });
      this.quizGateway.emitSessionUpdated(sessionId, {
        session: result.session,
      });

      if (result.session.status === 'COMPLETED') {
        const resultPayload = await this.getQuizSessionResult(sessionId);
        this.quizGateway.emitResultAvailable(sessionId, {
          result: resultPayload,
        });
      }

      return result;
    } catch (error) {
      throw this.toBadRequestOrRethrow(error, 'Unable to submit answer');
    }
  }

  public async getQuizSessionResult(
    sessionId: string,
  ): Promise<QuizSessionResult> {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      ...quizSessionGameplayArgs,
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const questions = session.quiz.questions.map((question, index) =>
      this.buildQuestionComparison(session, question.id, index),
    );

    return {
      session: this.mapQuizSessionRow(session),
      participants: this.buildParticipantResults(session, questions),
      questions,
    };
  }

  private normalizePage(page?: number): number {
    if (page === undefined) {
      return 1;
    }

    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('Page must be a positive integer');
    }

    return page;
  }

  private normalizeLimit(limit?: number): number {
    if (limit === undefined) {
      return 10;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new BadRequestException('Limit must be between 1 and 50');
    }

    return limit;
  }

  private mapQuizSearchRow(row: QuizSearchRow): QuizSearchItem {
    return {
      id: row.id,
      title: row.title,
      topic: row.topic,
      difficulty: row.difficulty,
      description: row.description,
      questionCount: row._count.questions,
    };
  }

  private mapQuizDetailRow(row: QuizDetailRow): QuizDetail {
    return {
      id: row.id,
      title: row.title,
      topic: row.topic,
      difficulty: row.difficulty,
      description: row.description,
      questions: row.questions.map((question) =>
        this.mapQuizQuestionRow(question),
      ),
    };
  }

  private mapQuizQuestionRow(row: QuizQuestionRow): QuizQuestion {
    const question = this.quizQuestionValidationPipe.transform({
      id: row.id,
      description: row.description,
      type: row.type as QuizQuestion['type'],
      options: row.options.map((option) => ({
        word: option.word,
        label: option.label,
      })),
    });

    const validationError = this.validateQuizQuestionModel(question);
    if (validationError) {
      throw new BadRequestException(validationError);
    }

    return question;
  }

  private mapQuizSessionRow(row: QuizSessionRow): QuizSessionDetail {
    return {
      id: row.id,
      quizId: row.quizId,
      mode: row.mode,
      status: row.status,
      joinCode: row.joinCode,
      shareLink: row.shareLink,
      currentQuestion: row.currentQuestion,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      expiresAt: row.expiresAt,
      participants: row.participants.map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        seat: participant.seat,
        joinedAt: participant.joinedAt,
        lastAnsweredAt: participant.lastAnsweredAt,
        lastAnswerMs: participant.lastAnswerMs,
      })),
      quiz: this.mapQuizDetailRow(row.quiz),
    };
  }

  private buildQuestionComparison(
    session: QuizSessionGameplayRow,
    questionId: string,
    questionIndex?: number,
  ): QuizSessionQuestionComparison {
    const resolvedQuestionIndex =
      questionIndex ??
      session.quiz.questions.findIndex((question) => question.id === questionId);
    const question =
      resolvedQuestionIndex >= 0 ? session.quiz.questions[resolvedQuestionIndex] : null;
    const canonicalOrder = question ? this.getCanonicalOrder(question) : [];
    const answers = session.answers
      .filter((answer) => answer.questionId === questionId)
      .sort((left, right) => {
        const leftMs = left.answeredAt.getTime();
        const rightMs = right.answeredAt.getTime();
        if (leftMs !== rightMs) {
          return leftMs - rightMs;
        }

        return left.id.localeCompare(right.id);
      });
    const firstResponderParticipantId = answers[0]?.participantId ?? null;

    return {
      questionId,
      questionIndex: resolvedQuestionIndex < 0 ? 0 : resolvedQuestionIndex,
      canonicalOrder,
      firstResponderParticipantId,
      answers: answers.map((answer, index) => ({
        answerId: answer.id,
        participantId: answer.participantId,
        seat: answer.participant.seat,
        selectedOrder: answer.selectedOrder,
        isCorrect: answer.isCorrect,
        scoreAwarded: Number(answer.scoreAwarded),
        answeredAt: answer.answeredAt,
        answeredMs: this.calculateElapsedMs(session.startedAt, answer.answeredAt),
        isFastest: index === 0,
      })),
    };
  }

  private buildParticipantResults(
    session: QuizSessionGameplayRow,
    questions: QuizSessionQuestionComparison[],
  ): QuizSessionParticipantResult[] {
    return session.participants.map((participant) => {
      const participantAnswers = session.answers.filter(
        (answer) => answer.participantId === participant.id,
      );
      const totalScore = participantAnswers.reduce(
        (sum, answer) => sum + Number(answer.scoreAwarded),
        0,
      );
      const answeredQuestions = participantAnswers.length;
      const correctAnswers = participantAnswers.filter(
        (answer) => answer.isCorrect,
      ).length;
      const fastestAnswers = questions.filter(
        (question) =>
          question.firstResponderParticipantId === participant.id,
      ).length;

      return {
        participantId: participant.id,
        userId: participant.userId,
        seat: participant.seat,
        totalScore: this.roundToOneDecimal(totalScore),
        answeredQuestions,
        correctAnswers,
        fastestAnswers,
      };
    });
  }

  private getCanonicalOrder(
    question: QuizQuestionRow | QuizQuestion,
  ): string[] {
    return question.options
      .filter((option) => option.label === 'HIDE' || option.label === 'SHOW')
      .map((option) => option.word.trim())
      .filter((word) => word.length > 0);
  }

  private validateSubmittedOrder(
    selectedOrder: string[],
    canonicalOrder: string[],
  ): void {
    if (selectedOrder.length !== canonicalOrder.length) {
      throw new BadRequestException(
        'Selected order must contain the same number of words as the correct answer',
      );
    }

    for (const word of selectedOrder) {
      if (!word) {
        throw new BadRequestException('Selected order cannot contain blanks');
      }
    }

    const expectedWords = [...canonicalOrder].sort();
    const submittedWords = [...selectedOrder].sort();
    if (
      expectedWords.length !== submittedWords.length ||
      expectedWords.some((word, index) => word !== submittedWords[index])
    ) {
      throw new BadRequestException(
        'Selected order must use the expected words',
      );
    }
  }

  private calculateScore(
    selectedOrder: string[],
    canonicalOrder: string[],
  ): number {
    if (canonicalOrder.length === 0) {
      return 0;
    }

    const matches = selectedOrder.reduce((count, word, index) => {
      return count + (word === canonicalOrder[index] ? 1 : 0);
    }, 0);

    return this.roundToOneDecimal(matches / canonicalOrder.length);
  }

  private areOrdersEqual(
    selectedOrder: string[],
    canonicalOrder: string[],
  ): boolean {
    if (selectedOrder.length !== canonicalOrder.length) {
      return false;
    }

    return selectedOrder.every((word, index) => word === canonicalOrder[index]);
  }

  private calculateElapsedMs(
    startedAt: Date | null,
    answeredAt: Date,
  ): number {
    if (!startedAt) {
      return 0;
    }

    return Math.max(0, answeredAt.getTime() - startedAt.getTime());
  }

  private roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private async ensureQuizIsPlayable(quizId: string): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      ...quizDetailArgs,
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const mappedQuiz = this.mapQuizDetailRow(quiz);
    if (mappedQuiz.questions.length === 0) {
      throw new BadRequestException('Quiz must contain at least one question');
    }
  }

  private async ensureQuizExists(
    prismaClient: PrismaTransactionClient,
    quizId: string,
  ): Promise<void> {
    const quiz = await prismaClient.quiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
  }

  private async createAuditEvent(
    prismaClient: PrismaTransactionClient,
    args: {
      actorUserId: string | null;
      quizId: string | null;
      action: AuditAction;
      targetEntity: string;
      targetId: string;
      metadata?: Prisma.JsonObject;
    },
  ): Promise<void> {
    await prismaClient.auditEvent.create({
      data: {
        actorUserId: args.actorUserId,
        quizId: args.quizId,
        action: args.action,
        targetEntity: args.targetEntity,
        targetId: args.targetId,
        metadata: args.metadata ?? undefined,
      },
    });
  }

  private async generateJoinCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.prisma.quizSession.findUnique({
        where: { joinCode: code },
        select: { id: true },
      });

      if (!existing) {
        return code;
      }
    }

    throw new BadRequestException('Unable to generate a unique join code');
  }

  private isJoinCodeCollision(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const candidate = error as {
      code?: string;
      meta?: { target?: unknown };
    };

    if (candidate.code !== 'P2002') {
      return false;
    }

    const target = candidate.meta?.target;
    if (!Array.isArray(target)) {
      return false;
    }

    return target.includes('joinCode') || target.includes('shareLink');
  }

  private validateQuizQuestionModel(question: QuizQuestion): string | null {
    if (!question.description.trim()) {
      return 'Question description cannot be empty';
    }

    if (question.options.length === 0) {
      return 'Question must have at least one option';
    }

    const words = new Set<string>();
    let hideCount = 0;
    let showCount = 0;

    for (const option of question.options) {
      if (!option.word.trim()) {
        return 'Option word cannot be empty';
      }

      if (words.has(option.word)) {
        return 'Option words must be unique within the question';
      }

      if (!QUESTION_OPTION_LABELS.includes(option.label)) {
        return 'Option labels must be HIDE, SHOW, or EXTRA';
      }

      if (option.label === 'HIDE') {
        hideCount += 1;
      }

      if (option.label === 'SHOW') {
        showCount += 1;
      }

      words.add(option.word);
    }

    if (hideCount === 0 || showCount === 0) {
      return 'Question must contain at least one HIDE option and one SHOW option';
    }

    return null;
  }

  private toBadRequestOrRethrow(error: unknown, fallback: string): never {
    if (typeof error === 'object' && error !== null) {
      const candidate = error as { code?: string };

      if (candidate.code === 'P2002') {
        throw new BadRequestException('Unique constraint violation');
      }

      if (candidate.code === 'P2003') {
        throw new BadRequestException('Related record constraint violation');
      }
    }

    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }

    throw new BadRequestException(fallback);
  }
}
