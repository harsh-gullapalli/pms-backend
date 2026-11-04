import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RoomTypeStatus } from '../../generated/prisma/enums.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateRoomTypeDto {
  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Deluxe King' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Number of physical rooms of this type.',
    minimum: 0,
    maximum: 10000,
    example: 18,
  })
  @IsInt()
  @Min(0)
  @Max(10_000)
  roomCount: number;

  @ApiProperty({
    description: 'Maximum guests per room.',
    minimum: 1,
    maximum: 100,
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  capacity: number;

  @ApiProperty({
    description: 'Base rate per night, at most two decimal places.',
    minimum: 0,
    maximum: 99999999.99,
    example: 149.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  baseRate: number;

  @ApiPropertyOptional({
    enum: RoomTypeStatus,
    enumName: 'RoomTypeStatus',
    default: RoomTypeStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(RoomTypeStatus)
  status?: RoomTypeStatus;
}
