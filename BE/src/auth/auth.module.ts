import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService, OAuthGoogleService } from './auth.service';
import { OAUTH_SERVICE } from './domain/utilities';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import appConfig from 'src/config/app.config';
import authConfig from 'src/config/auth.config';
import oauthConfig from 'src/config/oauth.config';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(oauthConfig),
    ConfigModule.forFeature(authConfig),

    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(authConfig)],
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => {
        return {
          privateKey: config.jwtPrivateKey,
          publicKey: config.jwtPublicKey,
          signOptions: {
            algorithm: 'RS256',
          },
        };
      },
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OAuthGoogleService,
    JwtAuthGuard,
    {
      provide: OAUTH_SERVICE,
      useExisting: OAuthGoogleService,
    },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
