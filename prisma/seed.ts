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

/** Bed classification (room category) of each demo room type: "<property code>:<room type>" -> category name. */
const ROOM_TYPE_CATEGORY: Record<string, string> = {
  'GPH:Standard Single': 'Standard Room',
  'GPH:Standard Double': 'Twin Room',
  'GPH:Deluxe King': 'Accessible King Room',
  'GPH:Executive Suite': 'Executive King Suite',
  'GPH:Presidential Suite': 'Executive King Suite',
  'SSR:Garden Room': 'Garden Room',
  'SSR:Sea View Deluxe': 'Sea View Room',
  'SSR:Family Suite': 'Family Suite',
  'SSR:Beach Villa': 'Private Villa',
};

/** Demo amenities, seeded for every sample property. */
const SAMPLE_AMENITIES = [
  {
    name: 'Free Wi-Fi',
    description: 'High-speed Wi-Fi throughout the property.',
    isActive: true,
  },
  {
    name: 'Swimming Pool',
    description: 'Outdoor pool, open 6am to 10pm.',
    isActive: true,
  },
  {
    name: 'Fitness Centre',
    description: '24-hour gym with cardio and weights.',
    isActive: true,
  },
  {
    name: 'Spa & Wellness',
    description: 'Massage, steam room and sauna by appointment.',
    isActive: true,
  },
  {
    name: 'Airport Shuttle',
    description: 'Scheduled shuttle to and from the airport on request.',
    isActive: false,
  },
  {
    name: 'Complimentary Breakfast',
    description: 'Buffet breakfast served 7am to 10:30am.',
    isActive: true,
  },
  {
    name: 'Restaurant',
    description: 'All-day dining with local and continental menus.',
    isActive: true,
  },
  {
    name: 'Bar & Lounge',
    description: 'Cocktails and light bites until midnight.',
    isActive: true,
  },
  {
    name: 'Room Service',
    description: 'In-room dining available around the clock.',
    isActive: true,
  },
  {
    name: 'Laundry Service',
    description: 'Same-day laundry and dry cleaning.',
    isActive: true,
  },
  {
    name: 'Free Parking',
    description: 'Secure on-site parking for in-house guests.',
    isActive: true,
  },
  {
    name: 'Valet Parking',
    description: 'Chargeable valet service at the main entrance.',
    isActive: false,
  },
  {
    name: 'Business Centre',
    description: 'Printing, scanning and meeting-room hire.',
    isActive: true,
  },
  {
    name: 'Conference Hall',
    description: 'Banquet and conference space for up to 200 guests.',
    isActive: true,
  },
  {
    name: 'Kids Club',
    description: 'Supervised activities for children aged 4 to 12.',
    isActive: true,
  },
  {
    name: 'Pet Friendly',
    description: 'Small pets welcome on request, extra charge applies.',
    isActive: false,
  },
  {
    name: '24-Hour Front Desk',
    description: 'Reception and concierge staffed day and night.',
    isActive: true,
  },
  {
    name: 'Concierge Service',
    description: 'Tours, taxis and restaurant reservations.',
    isActive: true,
  },
  {
    name: 'EV Charging',
    description: 'Two fast-charging bays in the car park.',
    isActive: true,
  },
  {
    name: 'Accessible Facilities',
    description: 'Step-free access, lifts and accessible bathrooms.',
    isActive: true,
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
    roomCategories: [
      {
        name: 'Standard Room',
        description: 'Compact city-view room with work desk and en-suite bath.',
        bedSetup: '1 Queen Bed (160x200 cm)',
        isActive: true,
      },
      {
        name: 'Executive King Suite',
        description:
          'Corner suite with separate lounge area and panoramic sea views.',
        bedSetup: '1 King Bed (180x200 cm)',
        isActive: true,
      },
      {
        name: 'Accessible King Room',
        description:
          'Step-free entrance, wide doorways, roll-in shower and grab bars.',
        bedSetup: '1 King Bed (180x200 cm)',
        isActive: true,
      },
      {
        name: 'Twin Room',
        description:
          'Two separate beds, ideal for colleagues travelling together.',
        bedSetup: '2 Twin Beds (100x200 cm)',
        isActive: false,
      },
    ],
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
    roomCategories: [
      {
        name: 'Garden Room',
        description: 'Ground-floor room opening onto the tropical garden.',
        bedSetup: '1 Queen Bed (160x200 cm)',
        isActive: true,
      },
      {
        name: 'Sea View Room',
        description: 'Upper-floor room with a private balcony facing the sea.',
        bedSetup: '1 King Bed (180x200 cm)',
        isActive: true,
      },
      {
        name: 'Family Suite',
        description: 'Two connecting bedrooms with a shared living area.',
        bedSetup: '1 King Bed + 2 Single Beds',
        isActive: true,
      },
      {
        name: 'Private Villa',
        description: 'Standalone villa with plunge pool and outdoor lounge.',
        bedSetup: '2 King Beds (180x200 cm)',
        isActive: true,
      },
    ],
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
    let roomCategoryCount = 0;
    let amenityCount = 0;
    for (const { roomTypes, roomCategories, ...fields } of SAMPLE_PROPERTIES) {
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

      for (const category of roomCategories) {
        await prisma.roomCategory.upsert({
          where: {
            propertyId_name: { propertyId: property.id, name: category.name },
          },
          update: category,
          create: { ...category, propertyId: property.id },
        });
        roomCategoryCount++;
      }

      for (const roomType of roomTypes) {
        const categoryName =
          ROOM_TYPE_CATEGORY[`${property.code}:${roomType.name}`];
        const category = categoryName
          ? await prisma.roomCategory.findUnique({
              where: {
                propertyId_name: {
                  propertyId: property.id,
                  name: categoryName,
                },
              },
            })
          : null;
        await prisma.roomType.update({
          where: {
            propertyId_name: { propertyId: property.id, name: roomType.name },
          },
          data: { categoryId: category?.id ?? null },
        });
      }

      for (const amenity of SAMPLE_AMENITIES) {
        await prisma.amenity.upsert({
          where: {
            propertyId_name: { propertyId: property.id, name: amenity.name },
          },
          update: amenity,
          create: { ...amenity, propertyId: property.id },
        });
        amenityCount++;
      }
    }

    console.log(
      `Seeded ${SAMPLE_PROPERTIES.length} sample properties with ${roomTypeCount} room types, ${roomCategoryCount} room categories and ${amenityCount} amenities`,
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
