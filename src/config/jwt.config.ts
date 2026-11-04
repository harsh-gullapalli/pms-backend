import { registerAs } from '@nestjs/config';
import { requireEnv } from './env.util.js';

const MIN_SECRET_LENGTH = 32;

export default registerAs('jwt', () => {
  const secret = requireEnv('JWT_SECRET');

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }

  return { secret };
});
