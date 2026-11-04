import { ApiProperty } from '@nestjs/swagger';

export class PropertyResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-9d4a-4c55-8a1b-2e6f7a9b0c11',
  })
  id: string;

  @ApiProperty({ example: 'Grand Plaza Hotel' })
  name: string;

  @ApiProperty({ example: 'GPH' })
  code: string;

  @ApiProperty({ type: String, nullable: true, example: '12 Marine Drive' })
  address: string | null;

  @ApiProperty({ example: 'Mumbai' })
  city: string;

  @ApiProperty({ example: 'India' })
  country: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
