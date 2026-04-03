import {
  Body,
  Controller,
  Get,
  Inject,
  HttpCode,
  HttpStatus,
  Query,
  Patch,
  Post,
  Req,
  Res,
  UsePipes,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import { OAUTH_SERVICE, OAuthServiceI } from './domain/utilities';
import appConfig from 'src/config/app.config';
import authConfig from 'src/config/auth.config';
import { LoginResponseDTO } from './dtos/login';
import { TokenPayload } from './domain/entities';
import { Roles } from 'src/common/decorators/roles.decorator';
const ACCESS_TOKEN_COOKIE = 'access_token';
const OAUTH_STATE_COOKIE = 'oauth_state';

type RequestWithUser = Request & { user: TokenPayload };
type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
};

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(OAUTH_SERVICE)
    private readonly oauthService: OAuthServiceI,
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) {}

  private setAccessTokenCookie(
    res: Response,
    token: string,
    expiresInSeconds: number,
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: this.appConfiguration.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: expiresInSeconds * 1000,
    });
  }

  private clearAccessTokenCookie(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      secure: this.appConfiguration.isProduction,
      sameSite: 'strict',
      path: '/',
    });
  }

  private setOAuthStateCookie(
    res: Response,
    state: string,
    expiresInSeconds: number,
  ): void {
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.appConfiguration.isProduction,
      sameSite: 'lax',
      path: '/auth/google/callback',
      maxAge: expiresInSeconds * 1000,
    });
  }

  private clearOAuthStateCookie(res: Response): void {
    res.clearCookie(OAUTH_STATE_COOKIE, {
      httpOnly: true,
      secure: this.appConfiguration.isProduction,
      sameSite: 'lax',
      path: '/auth/google/callback',
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    //await this.oauthService.logout(req.user.sub);
    this.clearAccessTokenCookie(res);
  }

  @Get('google')
  async googleAuth(@Res({ passthrough: true }) res: Response): Promise<void> {
    const { url, state } = await this.oauthService.createAuthRedirectUrl();
    console.log('🚀 ~ AuthController ~ googleAuth ~ url:', url);
    this.setOAuthStateCookie(res, state, 10 * 60);
    res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ): Promise<LoginResponseDTO> {
    if (!code || !state) {
      throw new UnauthorizedException('Missing code or state');
    }

    const oauthState = req.cookies?.[OAUTH_STATE_COOKIE];
    console.log(
      '🚀 ~ AuthController ~ googleCallback ~ oauthState:',
      oauthState,
    );
    console.log('🚀 ~ AuthController ~ googleCallback ~ state:', state);

    if (!oauthState || oauthState !== state) {
      this.clearOAuthStateCookie(res);
      throw new UnauthorizedException('Invalid OAuth state');
    }

    this.clearOAuthStateCookie(res);

    const tokens = await this.oauthService.handleCallback({
      code,
    });

    this.setAccessTokenCookie(
      res,
      tokens.access_token,
      this.authConfiguration.jwtDurationMs,
    );

    return {
      access_token: tokens.access_token,
    };
  }
}
