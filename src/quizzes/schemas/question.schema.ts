import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { QuestionOption, QuestionOptionSchema } from './question-option.schema';

@Schema({ _id: false })
export class Question {
  @Prop({ required: true })
  prompt!: string;

  @Prop({ type: [QuestionOptionSchema], default: [] })
  options!: QuestionOption[];

  @Prop({ required: true, default: 0 })
  order!: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
