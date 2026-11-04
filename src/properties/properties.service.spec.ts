import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth.types.js';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { PropertyType } from '../generated/prisma/enums.js';
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
  type: PropertyType.HOTEL,
  defaultCurrency: 'INR',
  city: 'Mumbai',
  country: 'India',
};

const ADMIN: AuthUser = {
  id: 'u1',
  email: 'a@pms.local',
  name: 'Admin',
  role: 'ADMIN',
  propertyId: null,
  sessionId: 's1',
};
const STAFF: AuthUser = { ...ADMIN, role: 'STAFF', propertyId: 'property-1' };

describe('PropertiesService', () => {
  let service: PropertiesService;
  let property: Record<
    'findMany' | 'findFirst' | 'create' | 'update' | 'delete',
    ReturnType<typeof vi.fn>
  >;

  beforeEach(() => {
    property = {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new PropertiesService({ property } as unknown as PrismaService);
  });

  it('findAll returns every property for an ADMIN', async () => {
    property.findMany.mockResolvedValue([]);
    await service.findAll(ADMIN);
    expect(property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('findAll only returns their own property for STAFF', async () => {
    property.findMany.mockResolvedValue([]);
    await service.findAll(STAFF);
    expect(property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'property-1' } }),
    );
  });

  it('never widens to all properties for a STAFF user without one', async () => {
    await expect(
      service.findAll({ ...STAFF, propertyId: null }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(property.findMany).not.toHaveBeenCalled();
  });

  it('findOne scopes STAFF to their own property', async () => {
    property.findFirst.mockResolvedValue(null);
    await expect(service.findOne(STAFF, 'other')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // Must require BOTH the requested id and the user's own property.
    expect(property.findFirst).toHaveBeenCalledWith({
      where: { AND: [{ id: 'other' }, { id: 'property-1' }] },
    });
  });

  it('findOne throws NotFound for a missing property', async () => {
    property.findFirst.mockResolvedValue(null);
    await expect(service.findOne(ADMIN, 'x')).rejects.toBeInstanceOf(
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

  it('remove maps a missing row to NotFound', async () => {
    property.delete.mockRejectedValue(prismaError('P2025'));
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update writes only the given fields', async () => {
    property.update.mockResolvedValue({});
    await service.update('property-1', { city: 'Goa' });
    expect(property.update).toHaveBeenCalledWith({
      where: { id: 'property-1' },
      data: { city: 'Goa' },
    });
  });

  it('update maps a duplicate code to Conflict', async () => {
    property.update.mockRejectedValue(prismaError('P2002'));
    await expect(
      service.update('property-1', { code: 'TAKEN' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('update maps a missing row to NotFound', async () => {
    property.update.mockRejectedValue(prismaError('P2025'));
    await expect(service.update('x', { city: 'Goa' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
