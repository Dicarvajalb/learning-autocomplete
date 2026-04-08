import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AjvValidationPipe } from 'src/common/pipes/ajv-validation.pipe';
import {
  type CreateQuizSessionInput,
  type JoinQuizSessionInput,
  type SubmitQuizSessionAnswerInput,
} from './domain/entities';
import {
  createQuizSessionSchema,
  joinQuizSessionSchema,
  submitQuizSessionAnswerSchema,
} from './domain/schemas';
import { QuizService } from './quiz.service';
import {
  CreateQuizSessionInputModel,
  JoinQuizSessionInputModel,
  QuizDetailModel,
  QuizSessionAnswerSubmissionResultModel,
  QuizSessionDetailModel,
  QuizSessionResultModel,
  SubmitQuizSessionAnswerInputModel,
  SearchQuizzesResultModel,
} from 'src/swagger/swagger.models';

@ApiTags('Quizzes', 'Sessions')
@Controller()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('quizzes/search')
  @ApiOperation({ summary: 'Search public quizzes' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: SearchQuizzesResultModel })
  async searchQuizzes(
    @Query('q') q?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.quizService.searchQuizzes({
      q,
      page,
      limit,
    });
  }

  @Get('quizzes/:quizId')
  @ApiOperation({ summary: 'Get quiz details' })
  @ApiParam({ name: 'quizId', type: String })
  @ApiOkResponse({ type: QuizDetailModel })
  async getQuiz(@Param('quizId') quizId: string) {
    return this.quizService.getQuizDetail(quizId);
  }

  @Post('quizzes/:quizId/sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a quiz session' })
  @ApiParam({ name: 'quizId', type: String })
  @ApiBody({ type: CreateQuizSessionInputModel })
  @ApiCreatedResponse({ type: QuizSessionDetailModel })
  async createSession(
    @Param('quizId') quizId: string,
    @Body(new AjvValidationPipe(createQuizSessionSchema))
    body: CreateQuizSessionInput,
  ) {
    return this.quizService.createQuizSession(quizId, body);
  }

  @Get('quiz-sessions/:sessionId')
  @ApiOperation({ summary: 'Get a quiz session' })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ type: QuizSessionDetailModel })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.quizService.getQuizSession(sessionId);
  }

  @Post('quiz-sessions/:joinCode/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a two-player quiz session' })
  @ApiParam({ name: 'joinCode', type: String })
  @ApiBody({ type: JoinQuizSessionInputModel })
  @ApiOkResponse({ type: QuizSessionDetailModel })
  async joinSession(
    @Param('joinCode') joinCode: string,
    @Body(new AjvValidationPipe(joinQuizSessionSchema))
    body: JoinQuizSessionInput,
  ) {
    return this.quizService.joinQuizSession(joinCode, body ?? {});
  }

  @Post('quiz-sessions/:sessionId/answers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an answer for the current quiz session question' })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiBody({ type: SubmitQuizSessionAnswerInputModel })
  @ApiCreatedResponse({ type: QuizSessionAnswerSubmissionResultModel })
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body(new AjvValidationPipe(submitQuizSessionAnswerSchema))
    body: SubmitQuizSessionAnswerInput,
  ) {
    return this.quizService.submitQuizSessionAnswer(sessionId, body);
  }

  @Get('quiz-sessions/:sessionId/result')
  @ApiOperation({ summary: 'Get quiz session results' })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ type: QuizSessionResultModel })
  async getResult(@Param('sessionId') sessionId: string) {
    return this.quizService.getQuizSessionResult(sessionId);
  }
}
