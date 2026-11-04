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

/** Demo properties, each with its own room types, for local development. */
const SAMPLE_PROPERTIES = [
  {
    name: 'Grand Plaza Hotel',
    code: 'GPH',
    address: '12 Marine Drive',
    city: 'Mumbai',
    country: 'India',
    roomTypes: [
      {
        name: 'Standard Single',
        roomCount: 20,
        capacity: 1,
        baseRate: 79,
        status: 'ACTIVE',
      },
      {
        name: 'Standard Double',
        roomCount: 30,
        capacity: 2,
        baseRate: 109,
        status: 'ACTIVE',
      },
      {
        name: 'Deluxe King',
        roomCount: 18,
        capacity: 2,
        baseRate: 149,
        status: 'ACTIVE',
      },
      {
        name: 'Executive Suite',
        roomCount: 6,
        capacity: 3,
        baseRate: 299,
        status: 'MAINTENANCE',
      },
      {
        name: 'Presidential Suite',
        roomCount: 2,
        capacity: 6,
        baseRate: 599,
        status: 'INACTIVE',
      },
    ],
  },
  {
    name: 'Seaside Resort',
    code: 'SSR',
    address: 'Candolim Beach Road',
    city: 'Goa',
    country: 'India',
    roomTypes: [
      {
        name: 'Garden Room',
        roomCount: 24,
        capacity: 2,
        baseRate: 95,
        status: 'ACTIVE',
      },
      {
        name: 'Sea View Deluxe',
        roomCount: 16,
        capacity: 2,
        baseRate: 165,
        status: 'ACTIVE',
      },
      {
        name: 'Family Suite',
        roomCount: 10,
        capacity: 4,
        baseRate: 219,
        status: 'ACTIVE',
      },
      {
        name: 'Beach Villa',
        roomCount: 4,
        capacity: 6,
        baseRate: 449,
        status: 'ACTIVE',
      },
    ],
  },
] as const;

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

    let roomTypeCount = 0;
    for (const { roomTypes, ...fields } of SAMPLE_PROPERTIES) {
      const property = await prisma.property.upsert({
        where: { code: fields.code },
        update: fields,
        create: fields,
      });

      for (const roomType of roomTypes) {
        await prisma.roomType.upsert({
          where: {
            propertyId_name: { propertyId: property.id, name: roomType.name },
          },
          update: roomType,
          create: { ...roomType, propertyId: property.id },
        });
        roomTypeCount++;
      }
    }

    console.log(
      `Seeded ${SAMPLE_PROPERTIES.length} sample properties with ${roomTypeCount} room types`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

await main();
