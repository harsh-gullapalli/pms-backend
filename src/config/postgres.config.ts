import { registerAs } from '@nestjs/config';
import { envInt, optionalEnv, requireEnv } from './env.util.js';

export default registerAs('postgres', () => ({
  host: optionalEnv('DB_HOST', 'localhost'),
  port: envInt('DB_PORT', 5432),
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
  maxConnections: envInt('DB_POOL_MAX', 10),
  connectionTimeoutMs: envInt('DB_CONNECTION_TIMEOUT_MS', 5000),
  idleTimeoutMs: envInt('DB_IDLE_TIMEOUT_MS', 30000),
}));
