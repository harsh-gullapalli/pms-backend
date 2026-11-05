import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { RoomCategory } from '../generated/prisma/client.js';
import { CreateRoomCategoryDto } from './dto/create-room-category.dto.js';
import { UpdateRoomCategoryDto } from './dto/update-room-category.dto.js';

/** All operations are scoped to one property; ids from other properties 404. */
@Injectable()
export class RoomCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string): Promise<RoomCategory[]> {
    await this.assertPropertyExists(propertyId);
    return this.prisma.roomCategory.findMany({
      where: { propertyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(propertyId: string, id: string): Promise<RoomCategory> {
    const category = await this.prisma.roomCategory.findFirst({
      where: { id, propertyId },
    });
    if (!category) {
      throw new NotFoundException('Room category not found');
    }
    return category;
  }

  async create(
    propertyId: string,
    dto: CreateRoomCategoryDto,
  ): Promise<RoomCategory> {
    await this.assertPropertyExists(propertyId);
    return this.mapErrors(() =>
      this.prisma.roomCategory.create({ data: { propertyId, ...dto } }),
    );
  }

  update(
    propertyId: string,
    id: string,
    dto: UpdateRoomCategoryDto,
  ): Promise<RoomCategory> {
    return this.mapErrors(() =>
      this.prisma.roomCategory.update({ where: { id, propertyId }, data: dto }),
    );
  }

  async remove(propertyId: string, id: string): Promise<void> {
    await this.mapErrors(() =>
      this.prisma.roomCategory.delete({ where: { id, propertyId } }),
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
            'A room category with this name already exists at this property',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Room category not found');
        }
      }
      throw error;
    }
  }
}
