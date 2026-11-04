import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/auth/password.util.js';
import { databaseUrl } from './database-url.js';

try {
  process.loadEnvFile();
} catch {
  // no .env file
}

/** Sample accounts for local development only. There is no registration flow. */
const SAMPLE_USERS = [
  { email: 'admin@pms.local', name: 'Admin User', password: 'Admin@12345' },
  { email: 'john.doe@pms.local', name: 'John Doe', password: 'Password@123' },
  {
    email: 'jane.smith@pms.local',
    name: 'Jane Smith',
    password: 'Password@123',
  },
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed sample users in production');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl() }),
  });

  try {
    for (const { email, name, password } of SAMPLE_USERS) {
      const passwordHash = await hashPassword(password);

      await prisma.user.upsert({
        where: { email },
        update: { name, passwordHash, isActive: true },
        create: { email, name, passwordHash },
      });
    }

    console.log(`Seeded ${SAMPLE_USERS.length} sample users`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
