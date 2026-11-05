import { ApiProperty } from '@nestjs/swagger';

export class AmenityResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Property this amenity belongs to.',
  })
  propertyId: string;

  @ApiProperty({ example: 'Free Wi-Fi' })
  name: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Short description.',
  })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
