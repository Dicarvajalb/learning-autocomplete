import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export type AuthenticatedUser = {
  id: string;
  googleId: string;
  email: string;
  displayName: string;
  roles: string[];
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async upsertGoogleUser(profile: {
    googleId: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
  }) {
    return this.userModel.findOneAndUpdate(
      { googleId: profile.googleId },
      {
        $set: {
          displayName: profile.displayName,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          googleAccessToken: profile.accessToken,
          googleRefreshToken: profile.refreshToken,
          googleTokenExpiry: profile.tokenExpiry,
        },
        $setOnInsert: { roles: ['user'] },
      },
      { new: true, upsert: true },
    );
  }

  signToken(user: UserDocument) {
    const payload: AuthenticatedUser = {
      id: user._id.toString(),
      googleId: user.googleId,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles ?? ['user'],
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }
}
