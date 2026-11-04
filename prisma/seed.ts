import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/auth/password.util.js';
import { databaseUrl } from './database-url.js';

try {
  process.loadEnvFile();
} catch {
  // no .env file
}

/**
 * Sample accounts for local development only. There is no registration flow.
 * ADMIN users are not tied to a property; STAFF users belong to exactly one
 * (by property code) and can only sign in to and access that property.
 */
const SAMPLE_USERS = [
  {
    email: 'admin@pms.local',
    name: 'Admin User',
    password: 'Admin@12345',
    role: 'ADMIN',
    propertyCode: null,
  },
  {
    email: 'john.doe@pms.local',
    name: 'John Doe',
    password: 'Password@123',
    role: 'STAFF',
    propertyCode: 'GPH',
  },
  {
    email: 'jane.smith@pms.local',
    name: 'Jane Smith',
    password: 'Password@123',
    role: 'STAFF',
    propertyCode: 'SSR',
  },
] as const;

/** Demo properties, each with its own room types, for local development. */
const SAMPLE_PROPERTIES = [
  {
    name: 'Grand Plaza Hotel',
    code: 'GPH',
    type: 'HOTEL',
    address: '12 Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400001',
    phone: '+91 22 1234 5678',
    description:
      'Five-star waterfront hotel in South Mumbai with sea-facing rooms and a rooftop restaurant.',
    frontDeskPhone: '+91 22 1234 5600',
    emergencyContact: '+91 98200 12345',
    email: 'hello@grandplaza.example',
    generalEmail: 'info@grandplaza.example',
    reservationsEmail: 'reservations@grandplaza.example',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    defaultCurrency: 'INR',
    numberOfFloors: 12,
    totalRooms: 76,
    website: 'https://www.grandplaza.example',
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
    type: 'RESORT',
    address: 'Candolim Beach Road',
    city: 'Candolim',
    state: 'Goa',
    country: 'India',
    postalCode: '403515',
    phone: '+91 832 765 4321',
    description:
      'Beachfront resort in Candolim with garden rooms, sea-view suites and private villas.',
    frontDeskPhone: '+91 832 765 4300',
    emergencyContact: '+91 98500 54321',
    email: 'hello@seasideresort.example',
    generalEmail: 'info@seasideresort.example',
    reservationsEmail: 'stay@seasideresort.example',
    checkInTime: '13:00',
    checkOutTime: '10:00',
    defaultCurrency: 'INR',
    numberOfFloors: 3,
    totalRooms: 54,
    website: 'https://www.seasideresort.example',
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
    const propertyIds = new Map<string, string>();
    let roomTypeCount = 0;
    for (const { roomTypes, ...fields } of SAMPLE_PROPERTIES) {
      const property = await prisma.property.upsert({
        where: { code: fields.code },
        update: fields,
        create: fields,
      });
      propertyIds.set(property.code, property.id);

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

    for (const { email, name, password, role, propertyCode } of SAMPLE_USERS) {
      const passwordHash = await hashPassword(password);
      const propertyId = propertyCode
        ? (propertyIds.get(propertyCode) ?? null)
        : null;
      const existing = await prisma.user.findUnique({ where: { email } });

      const user = await prisma.user.upsert({
        where: { email },
        update: { name, passwordHash, isActive: true, role, propertyId },
        create: { email, name, passwordHash, role, propertyId },
      });

      // A changed role or property must not keep working on old tokens. (A
      // session already cached in Redis can still be honoured for up to 5
      // minutes.)
      if (
        existing &&
        (existing.role !== role || existing.propertyId !== propertyId)
      ) {
        await prisma.session.deleteMany({ where: { userId: user.id } });
      }
    }

    console.log(`Seeded ${SAMPLE_USERS.length} sample users`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
