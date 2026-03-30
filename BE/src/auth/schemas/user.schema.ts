import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  googleId!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: [String], default: ['user'] })
  roles!: string[];

  @Prop()
  googleAccessToken?: string;

  @Prop()
  googleRefreshToken?: string;

  @Prop()
  googleTokenExpiry?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
