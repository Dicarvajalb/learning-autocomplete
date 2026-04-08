import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AjvValidationPipe } from 'src/common/pipes/ajv-validation.pipe';
import { Roles } from 'src/common/decorators/roles.decorator';
import { type AuthenticatedUser } from 'src/auth/domain/entities';
import {
  type CreateQuestionInput,
  type CreateQuizInput,
  type UpdateQuestionInput,
  type UpdateQuizInput,
} from './domain/entities';
import {
  createQuestionSchema,
  createQuizSchema,
  updateQuestionSchema,
  updateQuizSchema,
} from './domain/schemas';
import { QuizService } from './quiz.service';
import {
  QuizDetailModel,
  QuizQuestionInputModel,
  QuizWriteInputModel,
} from 'src/swagger/swagger.models';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@ApiTags('Admin')
@ApiCookieAuth('access_token')
@Controller('admin')
@Roles(['ADMIN'])
export class AdminQuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('quizzes')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: QuizWriteInputModel })
  @ApiCreatedResponse({ type: QuizDetailModel })
  async createQuiz(
    @Req() req: RequestWithUser,
    @Body(new AjvValidationPipe(createQuizSchema))
    body: CreateQuizInput,
  ) {
    return this.quizService.createQuiz(body, req.user?.sub ?? null);
  }

  @Patch('quizzes/:quizId')
  @ApiParam({ name: 'quizId', type: String })
  @ApiBody({ type: QuizWriteInputModel })
  @ApiOkResponse({ type: QuizDetailModel })
  async updateQuiz(
    @Req() req: RequestWithUser,
    @Param('quizId') quizId: string,
    @Body(new AjvValidationPipe(updateQuizSchema))
    body: UpdateQuizInput,
  ) {
    return this.quizService.updateQuiz(quizId, body, req.user?.sub ?? null);
  }

  @Delete('quizzes/:quizId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'quizId', type: String })
  @ApiNoContentResponse({ description: 'Quiz deleted' })
  async deleteQuiz(
    @Req() req: RequestWithUser,
    @Param('quizId') quizId: string,
  ) {
    await this.quizService.deleteQuiz(quizId, req.user?.sub ?? null);
  }

  @Post('quizzes/:quizId/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'quizId', type: String })
  @ApiBody({ type: QuizQuestionInputModel })
  @ApiCreatedResponse({ type: QuizDetailModel })
  async createQuestion(
    @Req() req: RequestWithUser,
    @Param('quizId') quizId: string,
    @Body(new AjvValidationPipe(createQuestionSchema))
    body: CreateQuestionInput,
  ) {
    return this.quizService.createQuestion(quizId, body, req.user?.sub ?? null);
  }

  @Patch('quizzes/:quizId/questions/:questionId')
  @ApiParam({ name: 'quizId', type: String })
  @ApiParam({ name: 'questionId', type: String })
  @ApiBody({ type: QuizQuestionInputModel })
  @ApiOkResponse({ type: QuizDetailModel })
  async updateQuestion(
    @Req() req: RequestWithUser,
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body(new AjvValidationPipe(updateQuestionSchema))
    body: UpdateQuestionInput,
  ) {
    return this.quizService.updateQuestion(
      quizId,
      questionId,
      body,
      req.user?.sub ?? null,
    );
  }

  @Delete('quizzes/:quizId/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'quizId', type: String })
  @ApiParam({ name: 'questionId', type: String })
  @ApiNoContentResponse({ description: 'Question deleted' })
  async deleteQuestion(
    @Req() req: RequestWithUser,
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ) {
    await this.quizService.deleteQuestion(
      quizId,
      questionId,
      req.user?.sub ?? null,
    );
  }
}
