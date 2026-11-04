import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO4217CurrencyCode,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PropertyType } from '../../generated/prisma/enums.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const upperTrim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const lowerTrim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const PHONE_DESCRIPTION =
  'Digits, spaces, parentheses and "-", with an optional leading "+".';

export class CreatePropertyDto {
  @ApiProperty({ minLength: 1, maxLength: 150, example: 'Grand Plaza Hotel' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiProperty({
    description:
      'Short unique code (letters, digits, "-" or "_"). Stored upper-case.',
    pattern: '^[A-Z0-9_-]{2,20}$',
    example: 'GPH',
  })
  @Transform(upperTrim)
  @IsString()
  @Matches(/^[A-Z0-9_-]{2,20}$/, {
    message: 'code must be 2-20 characters: letters, digits, "-" or "_"',
  })
  code: string;

  @ApiProperty({
    enum: PropertyType,
    enumName: 'PropertyType',
    example: PropertyType.HOTEL,
  })
  @IsEnum(PropertyType)
  type: PropertyType;

  @ApiPropertyOptional({
    maxLength: 2000,
    example: 'A 5-star waterfront hotel in South Mumbai.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ maxLength: 255, example: '12 Marine Drive' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Mumbai' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'Maharashtra' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'India' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({ maxLength: 20, example: '400001' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: `Main phone. ${PHONE_DESCRIPTION}`,
    example: '+91 22 1234 5678',
  })
  @IsOptional()
  @Transform(trim)
  @Matches(PHONE_PATTERN, { message: 'phone must be a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({
    description: `Front desk phone. ${PHONE_DESCRIPTION}`,
    example: '+91 22 1234 5600',
  })
  @IsOptional()
  @Transform(trim)
  @Matches(PHONE_PATTERN, {
    message: 'frontDeskPhone must be a valid phone number',
  })
  frontDeskPhone?: string;

  @ApiPropertyOptional({
    description: `Emergency contact number. ${PHONE_DESCRIPTION}`,
    example: '+91 98200 12345',
  })
  @IsOptional()
  @Transform(trim)
  @Matches(PHONE_PATTERN, {
    message: 'emergencyContact must be a valid phone number',
  })
  emergencyContact?: string;

  @ApiPropertyOptional({
    description: 'Main email address.',
    format: 'email',
    maxLength: 254,
    example: 'hello@grandplaza.example',
  })
  @IsOptional()
  @Transform(lowerTrim)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    description: 'General inquiries email.',
    format: 'email',
    maxLength: 254,
    example: 'info@grandplaza.example',
  })
  @IsOptional()
  @Transform(lowerTrim)
  @IsEmail()
  @MaxLength(254)
  generalEmail?: string;

  @ApiPropertyOptional({
    format: 'email',
    maxLength: 254,
    example: 'reservations@grandplaza.example',
  })
  @IsOptional()
  @Transform(lowerTrim)
  @IsEmail()
  @MaxLength(254)
  reservationsEmail?: string;

  @ApiPropertyOptional({
    format: 'uri',
    maxLength: 255,
    example: 'https://www.grandplaza.example',
  })
  @IsOptional()
  @Transform(trim)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({
    description: 'Standard check-in time, 24-hour "HH:mm".',
    pattern: TIME_PATTERN.source,
    default: '14:00',
    example: '14:00',
  })
  @IsOptional()
  @Transform(trim)
  @Matches(TIME_PATTERN, { message: 'checkInTime must be HH:mm (24-hour)' })
  checkInTime?: string;

  @ApiPropertyOptional({
    description: 'Standard check-out time, 24-hour "HH:mm".',
    pattern: TIME_PATTERN.source,
    default: '11:00',
    example: '11:00',
  })
  @IsOptional()
  @Transform(trim)
  @Matches(TIME_PATTERN, { message: 'checkOutTime must be HH:mm (24-hour)' })
  checkOutTime?: string;

  @ApiProperty({
    description: 'Default currency, ISO 4217 code. Stored upper-case.',
    minLength: 3,
    maxLength: 3,
    example: 'INR',
  })
  @Transform(upperTrim)
  @IsISO4217CurrencyCode()
  defaultCurrency: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  numberOfFloors?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100000, example: 86 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100_000)
  totalRooms?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
