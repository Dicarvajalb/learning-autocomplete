import { Module } from '@nestjs/common';
import { AdminQuizController } from './admin-quiz.controller';
import { QuizGateway } from './quiz.gateway';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  controllers: [QuizController, AdminQuizController],
  providers: [QuizService, QuizGateway],
  exports: [QuizService],
})
export class QuizModule {}
