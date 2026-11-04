import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { Property } from '../generated/prisma/client.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Property[]> {
    return this.prisma.property.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  create(dto: CreatePropertyDto): Promise<Property> {
    return this.mapErrors(() => this.prisma.property.create({ data: dto }));
  }

  update(id: string, dto: UpdatePropertyDto): Promise<Property> {
    return this.mapErrors(() =>
      this.prisma.property.update({ where: { id }, data: dto }),
    );
  }

  async remove(id: string): Promise<void> {
    await this.mapErrors(() => this.prisma.property.delete({ where: { id } }));
  }

  /** Translates known Prisma errors into HTTP exceptions. */
  private async mapErrors<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A property with this code already exists',
          );
        }
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Property still has room types; delete them first',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Property not found');
        }
      }
      throw error;
    }
  }
}
