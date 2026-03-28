import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizController } from './quizzes.controller';
import { QuizService } from './quizzes.service';
import { Quiz, QuizSchema } from './schemas/quiz.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }])],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizzesModule {}
