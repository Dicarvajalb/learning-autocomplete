import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import type {
  QuizDifficulty,
  QuizSessionMode,
  QuizSessionStatus,
  QuestionType,
  QuestionOptionLabel,
  SessionParticipantSeat,
} from 'src/quiz/domain/entities';
import type { UserRole } from 'src/auth/domain/entities';

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
export const QUESTION_TYPES: QuestionType[] = ['AUTOCOMPLETE_ORDER'];
export const QUESTION_OPTION_LABELS: QuestionOptionLabel[] = ['HIDE', 'SHOW', 'EXTRA'];
export const QUIZ_SESSION_MODES: QuizSessionMode[] = ['SOLO', 'TWO_PLAYER'];
export const QUIZ_SESSION_STATUSES: QuizSessionStatus[] = [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
];
export const SESSION_PARTICIPANT_SEATS: SessionParticipantSeat[] = [
  'SOLO',
  'PLAYER_ONE',
  'PLAYER_TWO',
];

export class HealthResponseModel {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'learning-devops-api' })
  service!: string;
}

export class LoginResponseModel {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token!: string;
}

export class AuthMeResponseModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiProperty({ enum: ['ADMIN', 'USER'] })
  role!: UserRole;
}

export class QuizSearchItemModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  topic!: string;

  @ApiProperty({ enum: QUIZ_DIFFICULTIES })
  difficulty!: QuizDifficulty;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  questionCount!: number;
}

export class QuizOptionModel {
  @ApiProperty()
  word!: string;

  @ApiProperty({ enum: QUESTION_OPTION_LABELS })
  label!: QuestionOptionLabel;
}

export class QuizQuestionModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: QUESTION_TYPES })
  type!: QuestionType;

  @ApiProperty({ type: () => [QuizOptionModel] })
  options!: QuizOptionModel[];
}

export class QuizDetailModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  topic!: string;

  @ApiProperty({ enum: QUIZ_DIFFICULTIES })
  difficulty!: QuizDifficulty;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ type: () => [QuizQuestionModel] })
  questions!: QuizQuestionModel[];
}

export class SessionParticipantModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;

  @ApiProperty({ enum: SESSION_PARTICIPANT_SEATS })
  seat!: SessionParticipantSeat;

  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastAnsweredAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastAnswerMs!: number | null;
}

export class QuizSessionDetailModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  quizId!: string;

  @ApiProperty({ enum: QUIZ_SESSION_MODES })
  mode!: QuizSessionMode;

  @ApiProperty({ enum: QUIZ_SESSION_STATUSES })
  status!: QuizSessionStatus;

  @ApiPropertyOptional({ nullable: true })
  joinCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shareLink!: string | null;

  @ApiProperty()
  currentQuestion!: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expiresAt!: string | null;

  @ApiProperty({ type: () => [SessionParticipantModel] })
  participants!: SessionParticipantModel[];

  @ApiProperty({ type: () => QuizDetailModel })
  quiz!: QuizDetailModel;
}

export class SearchQuizzesResultModel {
  @ApiProperty({ type: () => [QuizSearchItemModel] })
  items!: QuizSearchItemModel[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;
}

export class QuizWriteInputModel {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  topic!: string;

  @ApiProperty({ enum: QUIZ_DIFFICULTIES })
  difficulty!: QuizDifficulty;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;
}

export class QuizQuestionInputModel {
  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: QUESTION_TYPES })
  type!: QuestionType;

  @ApiProperty({ type: () => [QuizOptionModel] })
  options!: QuizOptionModel[];
}

export class CreateQuizSessionInputModel {
  @ApiProperty({ enum: QUIZ_SESSION_MODES })
  mode!: QuizSessionMode;

  @ApiPropertyOptional({ nullable: true })
  participantUserId?: string | null;
}

export class JoinQuizSessionInputModel {
  @ApiPropertyOptional({ nullable: true })
  participantUserId?: string | null;
}

export class SubmitQuizSessionAnswerInputModel {
  @ApiProperty({ format: 'uuid' })
  participantId!: string;

  @ApiProperty({ format: 'uuid' })
  questionId!: string;

  @ApiProperty({ type: () => [String] })
  selectedOrder!: string[];
}

export class QuizSessionAnswerComparisonModel {
  @ApiProperty({ format: 'uuid' })
  answerId!: string;

  @ApiProperty({ format: 'uuid' })
  participantId!: string;

  @ApiProperty({ enum: SESSION_PARTICIPANT_SEATS })
  seat!: SessionParticipantSeat;

  @ApiProperty({ type: () => [String] })
  selectedOrder!: string[];

  @ApiProperty()
  isCorrect!: boolean;

  @ApiProperty()
  scoreAwarded!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  answeredAt!: string;

  @ApiProperty()
  answeredMs!: number;

  @ApiProperty()
  isFastest!: boolean;
}

export class QuizSessionQuestionComparisonModel {
  @ApiProperty({ format: 'uuid' })
  questionId!: string;

  @ApiProperty()
  questionIndex!: number;

  @ApiProperty({ type: () => [String] })
  canonicalOrder!: string[];

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  firstResponderParticipantId!: string | null;

  @ApiProperty({ type: () => [QuizSessionAnswerComparisonModel] })
  answers!: QuizSessionAnswerComparisonModel[];
}

export class QuizSessionParticipantResultModel {
  @ApiProperty({ format: 'uuid' })
  participantId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiProperty({ enum: SESSION_PARTICIPANT_SEATS })
  seat!: SessionParticipantSeat;

  @ApiProperty()
  totalScore!: number;

  @ApiProperty()
  answeredQuestions!: number;

  @ApiProperty()
  correctAnswers!: number;

  @ApiProperty()
  fastestAnswers!: number;
}

export class QuizSessionAnswerSubmissionResultModel {
  @ApiProperty({ type: () => QuizSessionDetailModel })
  session!: QuizSessionDetailModel;

  @ApiProperty({ type: () => QuizSessionQuestionComparisonModel })
  comparison!: QuizSessionQuestionComparisonModel;
}

export class QuizSessionResultModel {
  @ApiProperty({ type: () => QuizSessionDetailModel })
  session!: QuizSessionDetailModel;

  @ApiProperty({ type: () => [QuizSessionParticipantResultModel] })
  participants!: QuizSessionParticipantResultModel[];

  @ApiProperty({ type: () => [QuizSessionQuestionComparisonModel] })
  questions!: QuizSessionQuestionComparisonModel[];
}
