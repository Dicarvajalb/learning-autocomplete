import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  isProduction: process.env.ENVIRONMENT == 'production' || false,
}));
