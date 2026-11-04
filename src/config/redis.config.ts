import { registerAs } from '@nestjs/config';
import { envInt, optionalEnv } from './env.util.js';

export default registerAs('redis', () => ({
  host: optionalEnv('REDIS_HOST', 'localhost'),
  port: envInt('REDIS_PORT', 6379),
  password: optionalEnv('REDIS_PASSWORD', '') || undefined,
  connectTimeoutMs: envInt('REDIS_CONNECT_TIMEOUT_MS', 5000),
}));
