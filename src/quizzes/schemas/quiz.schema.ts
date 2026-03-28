import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Question, QuestionSchema } from './question.schema';

export type QuizDocument = HydratedDocument<Quiz>;

@Schema({ timestamps: true })
export class Quiz {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, unique: true, index: true })
  name!: string;

  @Prop({ required: true })
  topic!: string;

  @Prop({ required: true })
  difficulty!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: [QuestionSchema], default: [] })
  questions!: Question[];
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
