import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const upperTrim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

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

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'India' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
