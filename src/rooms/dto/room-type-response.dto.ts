import { ApiProperty } from '@nestjs/swagger';
import { RoomTypeStatus } from '../../generated/prisma/enums.js';

export class RoomTypeCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Accessible King Suite' })
  name: string;

  @ApiProperty({ example: '1 King Bed (180x200 cm)' })
  bedSetup: string;
}

export class RoomTypeResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Property this room type belongs to.',
  })
  propertyId: string;

  @ApiProperty({ example: 'Deluxe King' })
  name: string;

  @ApiProperty({
    description: 'Number of physical rooms of this type.',
    example: 18,
  })
  roomCount: number;

  @ApiProperty({ description: 'Maximum guests per room.', example: 2 })
  capacity: number;

  @ApiProperty({
    type: String,
    description:
      'Base rate per night, serialized as a decimal string to keep it exact.',
    example: '149',
  })
  baseRate: string;

  @ApiProperty({ enum: RoomTypeStatus, enumName: 'RoomTypeStatus' })
  status: RoomTypeStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Bed classification (room category) id, if set.',
  })
  categoryId: string | null;

  @ApiProperty({
    type: () => RoomTypeCategoryDto,
    nullable: true,
    description: 'The room category this room type is classified under.',
  })
  category: RoomTypeCategoryDto | null;
}
