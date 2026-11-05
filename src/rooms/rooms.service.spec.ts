import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { RoomsService } from './rooms.service.js';

const PROPERTY_ID = 'property-1';

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: 'test',
  });
}

describe('RoomsService', () => {
  let service: RoomsService;
  let roomType: Record<
    'findMany' | 'findFirst' | 'create' | 'update' | 'delete' | 'aggregate',
    ReturnType<typeof vi.fn>
  >;
  let property: { findUnique: ReturnType<typeof vi.fn> };
  let roomCategory: { findFirst: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    roomType = {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({ _sum: { roomCount: 0 } }),
    };
    property = { findUnique: vi.fn().mockResolvedValue({ id: PROPERTY_ID }) };
    roomCategory = { findFirst: vi.fn() };
    service = new RoomsService({
      roomType,
      property,
      roomCategory,
    } as unknown as PrismaService);
  });

  it('findAll only returns room types of the given property', async () => {
    roomType.findMany.mockResolvedValue([]);
    await service.findAll(PROPERTY_ID);
    expect(roomType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { propertyId: PROPERTY_ID } }),
    );
  });

  it('findAll and create throw NotFound for an unknown property', async () => {
    property.findUnique.mockResolvedValue(null);
    await expect(service.findAll(PROPERTY_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.create(PROPERTY_ID, {
        name: 'A',
        roomCount: 1,
        capacity: 1,
        baseRate: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(roomType.create).not.toHaveBeenCalled();
  });

  it('findOne scopes the lookup to the property and 404s on a miss', async () => {
    roomType.findFirst.mockResolvedValue(null);
    await expect(service.findOne(PROPERTY_ID, 'x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(roomType.findFirst).toHaveBeenCalledWith({
      where: { id: 'x', propertyId: PROPERTY_ID },
      include: expect.anything(),
    });
  });

  it('create stores the property id from the route, not the body', async () => {
    roomType.create.mockResolvedValue({});
    await service.create(PROPERTY_ID, {
      name: 'Deluxe',
      roomCount: 1,
      capacity: 2,
      baseRate: 100,
    });
    expect(roomType.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ propertyId: PROPERTY_ID }),
      include: expect.anything(),
    });
  });

  it('create maps a duplicate name to Conflict', async () => {
    roomType.create.mockRejectedValue(prismaError('P2002'));
    await expect(
      service.create(PROPERTY_ID, {
        name: 'Deluxe',
        roomCount: 1,
        capacity: 2,
        baseRate: 100,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('update and remove are scoped to the property and map a miss to NotFound', async () => {
    roomType.update.mockRejectedValue(prismaError('P2025'));
    roomType.delete.mockRejectedValue(prismaError('P2025'));
    await expect(
      service.update(PROPERTY_ID, 'x', { capacity: 3 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(PROPERTY_ID, 'x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(roomType.update).toHaveBeenCalledWith({
      where: { id: 'x', propertyId: PROPERTY_ID },
      data: { capacity: 3 },
      include: expect.anything(),
    });
    expect(roomType.delete).toHaveBeenCalledWith({
      where: { id: 'x', propertyId: PROPERTY_ID },
    });
  });

  it('rethrows unknown errors unchanged', async () => {
    const error = new Error('db down');
    roomType.create.mockRejectedValue(error);
    await expect(
      service.create(PROPERTY_ID, {
        name: 'A',
        roomCount: 1,
        capacity: 1,
        baseRate: 1,
      }),
    ).rejects.toBe(error);
  });

  it('create and update reject a category from another property', async () => {
    roomCategory.findFirst.mockResolvedValue(null);
    await expect(
      service.create(PROPERTY_ID, {
        name: 'A',
        roomCount: 1,
        capacity: 1,
        baseRate: 1,
        categoryId: 'other-cat',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update(PROPERTY_ID, 'x', { categoryId: 'other-cat' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(roomCategory.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-cat', propertyId: PROPERTY_ID },
      select: { id: true },
    });
    expect(roomType.create).not.toHaveBeenCalled();
    expect(roomType.update).not.toHaveBeenCalled();
  });

  it('update can clear the category with null without looking it up', async () => {
    roomType.update.mockResolvedValue({});
    await service.update(PROPERTY_ID, 'x', { categoryId: null });
    expect(roomCategory.findFirst).not.toHaveBeenCalled();
    expect(roomType.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { categoryId: null } }),
    );
  });

  describe('property total rooms', () => {
    beforeEach(() => {
      property.findUnique.mockResolvedValue({
        id: PROPERTY_ID,
        totalRooms: 50,
      });
      roomType.aggregate.mockResolvedValue({ _sum: { roomCount: 45 } });
    });

    const input = { name: 'A', roomCount: 6, capacity: 1, baseRate: 1 };

    it('create rejects room counts beyond the property total', async () => {
      await expect(service.create(PROPERTY_ID, input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(roomType.create).not.toHaveBeenCalled();
    });

    it('create allows filling the property exactly', async () => {
      roomType.create.mockResolvedValue({});
      await service.create(PROPERTY_ID, { ...input, roomCount: 5 });
      expect(roomType.create).toHaveBeenCalled();
    });

    it('update excludes the room type itself and rejects overflow', async () => {
      await expect(
        service.update(PROPERTY_ID, 'x', { roomCount: 6 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(roomType.aggregate).toHaveBeenCalledWith({
        where: { propertyId: PROPERTY_ID, id: { not: 'x' } },
        _sum: { roomCount: true },
      });
      expect(roomType.update).not.toHaveBeenCalled();
    });

    it('update without a room count skips the check', async () => {
      roomType.update.mockResolvedValue({});
      await service.update(PROPERTY_ID, 'x', { capacity: 3 });
      expect(roomType.aggregate).not.toHaveBeenCalled();
    });

    it('no limit applies when the property has no total set', async () => {
      property.findUnique.mockResolvedValue({
        id: PROPERTY_ID,
        totalRooms: null,
      });
      roomType.create.mockResolvedValue({});
      await service.create(PROPERTY_ID, { ...input, roomCount: 9999 });
      expect(roomType.create).toHaveBeenCalled();
    });
  });
});
