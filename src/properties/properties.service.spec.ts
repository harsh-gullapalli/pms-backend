import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { PropertiesService } from './properties.service.js';

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: 'test',
  });
}

const dto = {
  name: 'Grand Plaza',
  code: 'GPH',
  city: 'Mumbai',
  country: 'India',
};

describe('PropertiesService', () => {
  let service: PropertiesService;
  let property: Record<
    'findMany' | 'findUnique' | 'create' | 'update' | 'delete',
    ReturnType<typeof vi.fn>
  >;

  beforeEach(() => {
    property = {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new PropertiesService({ property } as unknown as PrismaService);
  });

  it('findOne throws NotFound for a missing property', async () => {
    property.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create maps a duplicate code to Conflict', async () => {
    property.create.mockRejectedValue(prismaError('P2002'));
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('remove maps a foreign key violation to Conflict', async () => {
    property.delete.mockRejectedValue(prismaError('P2003'));
    await expect(service.remove('x')).rejects.toBeInstanceOf(ConflictException);
  });

  it('update and remove map a missing row to NotFound', async () => {
    property.update.mockRejectedValue(prismaError('P2025'));
    property.delete.mockRejectedValue(prismaError('P2025'));
    await expect(service.update('x', { city: 'Goa' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
