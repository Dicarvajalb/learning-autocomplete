import { registerAs } from '@nestjs/config';

export default registerAs('frontendConfig', () => ({
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
