import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { RoomType } from '../generated/prisma/client.js';
import { CreateRoomTypeDto } from './dto/create-room-type.dto.js';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto.js';

/** All operations are scoped to one property; ids from other properties 404. */
@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string): Promise<RoomType[]> {
    await this.assertPropertyExists(propertyId);
    return this.prisma.roomType.findMany({
      where: { propertyId },
      orderBy: { baseRate: 'asc' },
    });
  }

  async findOne(propertyId: string, id: string): Promise<RoomType> {
    const roomType = await this.prisma.roomType.findFirst({
      where: { id, propertyId },
    });
    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }
    return roomType;
  }

  async create(propertyId: string, dto: CreateRoomTypeDto): Promise<RoomType> {
    await this.assertPropertyExists(propertyId);
    return this.mapErrors(() =>
      this.prisma.roomType.create({
        data: {
          propertyId,
          name: dto.name,
          roomCount: dto.roomCount,
          capacity: dto.capacity,
          baseRate: dto.baseRate,
          status: dto.status,
        },
      }),
    );
  }

  update(
    propertyId: string,
    id: string,
    dto: UpdateRoomTypeDto,
  ): Promise<RoomType> {
    return this.mapErrors(() =>
      this.prisma.roomType.update({ where: { id, propertyId }, data: dto }),
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
