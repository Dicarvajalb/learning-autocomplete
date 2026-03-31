import { registerAs } from '@nestjs/config';

export default registerAs('oauthConfig', () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3001/auth/google/callback',
}));
