import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth.types.js';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { Property } from '../generated/prisma/client.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  /** ADMIN sees every property; STAFF only the one they belong to. */
  async findAll(user: AuthUser): Promise<Property[]> {
    return this.prisma.property.findMany({
      where: this.visibleTo(user),
      orderBy: { name: 'asc' },
    });
  }

  async findOne(user: AuthUser, id: string): Promise<Property> {
    const property = await this.prisma.property.findFirst({
      // AND, not a spread: both scopes constrain `id`, and a spread would let
      // the user's own id overwrite the requested one.
      where: { AND: [{ id }, this.visibleTo(user)] },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  create(dto: CreatePropertyDto): Promise<Property> {
    return this.mapErrors(() => this.prisma.property.create({ data: dto }));
  }

  /** Callers are ADMIN only (enforced by @Roles on the route). */
  update(id: string, dto: UpdatePropertyDto): Promise<Property> {
    return this.mapErrors(() =>
      this.prisma.property.update({ where: { id }, data: dto }),
    );
  }

  async remove(id: string): Promise<void> {
    await this.mapErrors(() => this.prisma.property.delete({ where: { id } }));
  }

  private visibleTo(user: AuthUser): { id?: string } {
    if (user.role === 'ADMIN') {
      return {};
    }
    if (!user.propertyId) {
      // Cannot happen for a signed-in STAFF user; never fall back to "all".
      throw new ForbiddenException(
        'Your account is not assigned to a property',
      );
    }
    return { id: user.propertyId };
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
            'Property still has room types or users; remove them first',
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
