import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class QuestionOption {
  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  order!: number;
}

export const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);
