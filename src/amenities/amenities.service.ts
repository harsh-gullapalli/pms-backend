import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { Amenity } from '../generated/prisma/client.js';
import { CreateAmenityDto } from './dto/create-amenity.dto.js';
import { UpdateAmenityDto } from './dto/update-amenity.dto.js';

/** All operations are scoped to one property; ids from other properties 404. */
@Injectable()
export class AmenitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string): Promise<Amenity[]> {
    await this.assertPropertyExists(propertyId);
    return this.prisma.amenity.findMany({
      where: { propertyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(propertyId: string, id: string): Promise<Amenity> {
    const amenity = await this.prisma.amenity.findFirst({
      where: { id, propertyId },
    });
    if (!amenity) {
      throw new NotFoundException('Amenity not found');
    }
    return amenity;
  }

  async create(propertyId: string, dto: CreateAmenityDto): Promise<Amenity> {
    await this.assertPropertyExists(propertyId);
    return this.mapErrors(() =>
      this.prisma.amenity.create({ data: { propertyId, ...dto } }),
    );
  }

  update(
    propertyId: string,
    id: string,
    dto: UpdateAmenityDto,
  ): Promise<Amenity> {
    return this.mapErrors(() =>
      this.prisma.amenity.update({ where: { id, propertyId }, data: dto }),
    );
  }

  async remove(propertyId: string, id: string): Promise<void> {
    await this.mapErrors(() =>
      this.prisma.amenity.delete({ where: { id, propertyId } }),
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
            'A amenity with this name already exists at this property',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Amenity not found');
        }
      }
      throw error;
    }
  }
}
