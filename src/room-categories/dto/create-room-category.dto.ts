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

export class CreateRoomCategoryDto {
  @ApiProperty({
    description: 'Classification name.',
    minLength: 1,
    maxLength: 100,
    example: 'Accessible King Suite',
  })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Architectural description of the category.',
    maxLength: 1000,
    example: 'Wide entrance door, roll-in shower and grab bars.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Standard bed setup.',
    minLength: 1,
    maxLength: 200,
    example: '1 King Bed (180x200 cm)',
  })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  bedSetup: string;

  @ApiPropertyOptional({
    description: 'Whether the category can be used for room allocation.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
