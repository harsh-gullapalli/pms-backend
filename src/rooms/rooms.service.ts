import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateRoomTypeDto } from './dto/create-room-type.dto.js';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto.js';

const WITH_CATEGORY = {
  category: { select: { id: true, name: true, bedSetup: true } },
} satisfies Prisma.RoomTypeInclude;

/** A room type together with its bed classification (room category). */
export type RoomTypeWithCategory = Prisma.RoomTypeGetPayload<{
  include: typeof WITH_CATEGORY;
}>;

/** All operations are scoped to one property; ids from other properties 404. */
@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string): Promise<RoomTypeWithCategory[]> {
    await this.assertPropertyExists(propertyId);
    return this.prisma.roomType.findMany({
      where: { propertyId },
      orderBy: { baseRate: 'asc' },
      include: WITH_CATEGORY,
    });
  }

  async findOne(propertyId: string, id: string): Promise<RoomTypeWithCategory> {
    const roomType = await this.prisma.roomType.findFirst({
      where: { id, propertyId },
      include: WITH_CATEGORY,
    });
    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }
    return roomType;
  }

  async create(
    propertyId: string,
    dto: CreateRoomTypeDto,
  ): Promise<RoomTypeWithCategory> {
    await this.assertPropertyExists(propertyId);
    await this.assertCategoryBelongs(propertyId, dto.categoryId);
    await this.assertWithinTotalRooms(propertyId, dto.roomCount);
    return this.mapErrors(() =>
      this.prisma.roomType.create({
        data: {
          propertyId,
          name: dto.name,
          roomCount: dto.roomCount,
          capacity: dto.capacity,
          baseRate: dto.baseRate,
          status: dto.status,
          categoryId: dto.categoryId,
        },
        include: WITH_CATEGORY,
      }),
    );
  }

  async update(
    propertyId: string,
    id: string,
    dto: UpdateRoomTypeDto,
  ): Promise<RoomTypeWithCategory> {
    await this.assertCategoryBelongs(propertyId, dto.categoryId);
    if (dto.roomCount !== undefined) {
      await this.assertWithinTotalRooms(propertyId, dto.roomCount, id);
    }
    return this.mapErrors(() =>
      this.prisma.roomType.update({
        where: { id, propertyId },
        data: dto,
        include: WITH_CATEGORY,
      }),
    );
  }

  async remove(propertyId: string, id: string): Promise<void> {
    await this.mapErrors(() =>
      this.prisma.roomType.delete({ where: { id, propertyId } }),
    );
  }

  private async assertPropertyExists(propertyId: string): Promise<void> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
  }

  /**
   * The room types of a property together may not hold more rooms than the
   * property's `totalRooms` (when that is set). `excludeId` leaves out the room
   * type being updated, whose count is being replaced.
   */
  private async assertWithinTotalRooms(
    propertyId: string,
    roomCount: number,
    excludeId?: string,
  ): Promise<void> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { totalRooms: true },
    });
    if (!property?.totalRooms) return;

    const others = await this.prisma.roomType.aggregate({
      where: { propertyId, ...(excludeId ? { id: { not: excludeId } } : {}) },
      _sum: { roomCount: true },
    });
    const allocated = others._sum.roomCount ?? 0;
    const available = property.totalRooms - allocated;
    if (roomCount > available) {
      throw new BadRequestException(
        `Room types cannot hold more than the property's ${property.totalRooms} rooms: ${allocated} already allocated, ${Math.max(available, 0)} available`,
      );
    }
  }

  /** A category id, when given, must be a room category of the same property. */
  private async assertCategoryBelongs(
    propertyId: string,
    categoryId: string | null | undefined,
  ): Promise<void> {
    if (!categoryId) return;
    const category = await this.prisma.roomCategory.findFirst({
      where: { id: categoryId, propertyId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException(
        'categoryId must be a room category of this property',
      );
    }
  }

  /** Translates known Prisma errors into HTTP exceptions. */
  private async mapErrors<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A room type with this name already exists at this property',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Room type not found');
        }
      }
      throw error;
    }
  }
}
