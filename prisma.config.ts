import { defineConfig } from 'prisma/config';
import { databaseUrl } from './prisma/database-url.js';

// The Prisma CLI does not load .env by itself (and Nest's ConfigModule is not
// involved here), so load it explicitly. A missing file is fine in CI/prod,
// where variables come from the real environment.
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl(),
  },
});
