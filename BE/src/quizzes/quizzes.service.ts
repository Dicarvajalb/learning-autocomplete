import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { Quiz, QuizDocument } from './schemas/quiz.schema';

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>) {}

  async create(dto: CreateQuizDto) {
    const created = new this.quizModel({
      ...dto,
      questions: dto.questions.map((question, questionIndex) => ({
        ...question,
        order: questionIndex,
        options: question.options.map((option, optionIndex) => ({
          ...option,
          order: optionIndex,
        })),
      })),
    });

    return created.save();
  }

  findAll() {
    return this.quizModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) {
      throw new NotFoundException(`Quiz with id ${id} not found`);
    }

    return quiz;
  }
}
