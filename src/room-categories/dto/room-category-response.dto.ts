import { ApiProperty } from '@nestjs/swagger';

export class RoomCategoryResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Property this category belongs to.',
  })
  propertyId: string;

  @ApiProperty({ example: 'Accessible King Suite' })
  name: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Architectural description.',
  })
  description: string | null;

  @ApiProperty({ example: '1 King Bed (180x200 cm)' })
  bedSetup: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
