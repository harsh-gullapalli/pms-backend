import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAmenityDto {
  @ApiProperty({
    description: 'Amenity name.',
    minLength: 1,
    maxLength: 100,
    example: 'Free Wi-Fi',
  })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Short description of the amenity.',
    maxLength: 1000,
    example: 'Complimentary high-speed Wi-Fi across the property.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the amenity is currently offered.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
