import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '../../generated/prisma/enums.js';

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

  @ApiProperty({ enum: PropertyType, enumName: 'PropertyType' })
  type: PropertyType;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'A 5-star waterfront hotel in South Mumbai.',
  })
  description: string | null;

  @ApiProperty({ type: String, nullable: true, example: '12 Marine Drive' })
  address: string | null;

  @ApiProperty({ example: 'Mumbai' })
  city: string;

  @ApiProperty({ type: String, nullable: true, example: 'Maharashtra' })
  state: string | null;

  @ApiProperty({ example: 'India' })
  country: string;

  @ApiProperty({ type: String, nullable: true, example: '400001' })
  postalCode: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+91 22 1234 5678' })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+91 22 1234 5600' })
  frontDeskPhone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+91 98200 12345' })
  emergencyContact: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'hello@grandplaza.example',
  })
  email: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'info@grandplaza.example',
  })
  generalEmail: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'reservations@grandplaza.example',
  })
  reservationsEmail: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://www.grandplaza.example',
  })
  website: string | null;

  @ApiProperty({ description: '24-hour "HH:mm".', example: '14:00' })
  checkInTime: string;

  @ApiProperty({ description: '24-hour "HH:mm".', example: '11:00' })
  checkOutTime: string;

  @ApiProperty({ description: 'ISO 4217 currency code.', example: 'INR' })
  defaultCurrency: string;

  @ApiProperty({ type: Number, nullable: true, example: 12 })
  numberOfFloors: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 86 })
  totalRooms: number | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
