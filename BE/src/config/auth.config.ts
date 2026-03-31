import { registerAs } from '@nestjs/config';

export default registerAs('authConfig', () => ({
  jwtDurationMs: Number.parseInt(process.env.JWT_DURATION_MS || '') || 600000,
  jwtRefreshDurationMs:
    Number.parseInt(process.env.JWT_REFRESH_DURATION_MS || '') || 604800000,
  jwtIssuer: process.env.JWT_ISSUER || 'learning-devops',
  jwtAudience: process.env.JWT_AUDIENCE || 'learning-devops',
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY || '',
  jwtPublicKey: process.env.JWT_PUBLIC_KEY || '',
}));
