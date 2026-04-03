import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import authConfig from 'src/config/auth.config';
import oauthConfig from 'src/config/oauth.config';
import {
  type UserRole,
  type AuthUserProfile,
  LoginResponseDTO,
  OAuthCallbackArgs,
  OAuthCallbackResult,
  OAuthRedirect,
  TokenPayload,
} from './domain/entities';
import { OAuthServiceI } from './domain/utilities';

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope?: string;
  token_type?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  name?: string;
};

type GoogleIdTokenClaims = {
  sub?: string;
  email?: string;
  name?: string;
};

type PrismaTransactionClient = Prisma.TransactionClient;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) {}

  public async issueTokenForUser(
    userId: string,
    prismaClient: PrismaTransactionClient = this.prisma,
  ): Promise<LoginResponseDTO> {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    const accessTokenId = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      this.buildTokenPayload(user.id, user.email, user.role, accessTokenId),
    );

    await prismaClient.authSession.create({
      data: {
        userId: user.id,
        accessTokenId,
        expiresAt: new Date(Date.now() + this.authConfiguration.jwtDurationMs),
      },
    });

    return {
      access_token: accessToken,
    };
  }

  public async validateApplicationToken(token: string): Promise<TokenPayload> {
    const payload = await this.jwtService
      .verifyAsync<TokenPayload>(token, this.buildVerifyOptions())
      .catch(() => {
        throw new UnauthorizedException('Invalid authentication token');
      });

    if (!payload?.sub || !payload?.jti) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const activeSession = await this.prisma.authSession.findFirst({
      where: {
        userId: payload.sub,
        accessTokenId: payload.jti,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!activeSession) {
      throw new UnauthorizedException(
        'Authentication session is no longer active',
      );
    }

    return payload;
  }

  public async logout(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private buildTokenPayload(
    sub: string,
    email: string | null,
    role: UserRole,
    jti: string,
  ): TokenPayload {
    return {
      sub,
      email,
      role,
      jti,
    };
  }

  private buildSignOptions(jti: string, durationMs: number) {
    return {
      algorithm: 'RS256' as const,
      audience: this.authConfiguration.jwtAudience,
      expiresIn: Math.max(1, Math.floor(durationMs / 1000)),
      issuer: this.authConfiguration.jwtIssuer,
      jwtid: jti,
      privateKey: this.authConfiguration.jwtPrivateKey || undefined,
    };
  }

  private buildVerifyOptions() {
    return {
      algorithms: ['RS256' as const],
      audience: this.authConfiguration.jwtAudience,
      issuer: this.authConfiguration.jwtIssuer,
      publicKey: this.authConfiguration.jwtPublicKey || undefined,
    };
  }
}

@Injectable()
export class OAuthGoogleService implements OAuthServiceI {
  private static readonly GOOGLE_AUTH_URL =
    'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly GOOGLE_TOKEN_URL =
    'https://oauth2.googleapis.com/token';
  private static readonly GOOGLE_USERINFO_URL =
    'https://www.googleapis.com/oauth2/v3/userinfo';

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    @Inject(oauthConfig.KEY)
    private readonly oauthConfiguration: ConfigType<typeof oauthConfig>,
  ) {}

  public async createAuthRedirectUrl(): Promise<OAuthRedirect> {
    const clientId = this.oauthConfiguration.googleClientId;
    const callbackUrl = this.oauthConfiguration.googleCallbackUrl;

    const state = randomUUID();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'consent',
    });

    return {
      url: `${OAuthGoogleService.GOOGLE_AUTH_URL}?${params.toString()}`,
      state,
    };
  }

  public async handleCallback(
    args: OAuthCallbackArgs,
  ): Promise<OAuthCallbackResult> {
    const tokenRes = await this.exchangeCodeForTokens(args.code);
    const idClaims = await this.verifyGoogleIdToken(tokenRes.id_token);
    const userInfo = await this.fetchUserInfo(tokenRes.access_token);

    return this.prisma.$transaction(async (prismaClient) => {
      const sub = idClaims.sub ?? userInfo.sub;
      if (!sub) {
        throw new UnauthorizedException('Invalid Google identity');
      }

      const email = userInfo.email ?? idClaims.email ?? null;
      const displayName =
        userInfo.name ?? idClaims.name ?? email?.split('@')[0] ?? 'User';

      const user = await this.findOrCreateUser(
        {
          sub,
          email,
          displayName,
        },
        prismaClient,
      );

      return this.authService.issueTokenForUser(user.id, prismaClient);
    });
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: this.oauthConfiguration.googleClientId,
      client_secret: this.oauthConfiguration.googleClientSecret,
      redirect_uri: this.oauthConfiguration.googleCallbackUrl,
      grant_type: 'authorization_code',
    });

    const response = await fetch(OAuthGoogleService.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Google token exchange failed');
    }

    const data = (await response.json()) as GoogleTokenResponse;
    if (!data?.access_token || !data?.id_token) {
      throw new UnauthorizedException('Google token exchange failed');
    }

    return data;
  }

  private async fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(OAuthGoogleService.GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Google userinfo invalid');
    }

    const data = (await response.json()) as GoogleUserInfo;
    if (!data?.sub) {
      throw new UnauthorizedException('Google userinfo invalid');
    }

    return data;
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<GoogleIdTokenClaims> {
    const client = new OAuth2Client(this.oauthConfiguration.googleClientId);

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.oauthConfiguration.googleClientId,
      });

      return (ticket.getPayload() ?? {}) as GoogleIdTokenClaims;
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  private async findOrCreateUser(
    profile: {
      sub: string;
      email: string | null;
      displayName: string;
    },
    prismaClient: PrismaTransactionClient = this.prisma,
  ): Promise<AuthUserProfile> {
    const user = await prismaClient.user.upsert({
      where: { oAuthSubject: profile.sub },
      update: {
        displayName: profile.displayName,
        ...(profile.email ? { email: profile.email } : {}),
      },
      create: {
        oAuthSubject: profile.sub,
        email: profile.email,
        displayName: profile.displayName,
        role: 'USER',
      },
      select: { id: true, email: true, role: true },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
