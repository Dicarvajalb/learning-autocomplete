import { UserRole } from 'src/generated/prisma/enums';

export interface OAuthRedirect {
  url: string;
  state: string;
}

export interface OAuthCallbackArgs {
  code: string;
}

export interface LoginResponseDTO {
  access_token: string;
}

export type OAuthCallbackResult = LoginResponseDTO;

export interface TokenPayload {
  sub: string;
  email: string | null;
  role: UserRole;
  jti?: string;
  iat?: number;
  exp?: number;
}

export type AuthenticatedUser = TokenPayload;

export { UserRole as AuthUserRole };
