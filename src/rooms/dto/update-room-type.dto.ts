import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsUUID,
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

/** Partial update: only the provided fields are changed. */
export class UpdateRoomTypeDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 100, example: 'Deluxe King' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Number of physical rooms of this type.',
    minimum: 0,
    maximum: 10000,
    example: 18,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  roomCount?: number;

  @ApiPropertyOptional({
    description: 'Maximum guests per room.',
    minimum: 1,
    maximum: 100,
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Base rate per night, at most two decimal places.',
    minimum: 0,
    maximum: 99999999.99,
    example: 159.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  baseRate?: number;

  @ApiPropertyOptional({ enum: RoomTypeStatus, enumName: 'RoomTypeStatus' })
  @IsOptional()
  @IsEnum(RoomTypeStatus)
  status?: RoomTypeStatus;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Bed classification: id of a room category at the same property. Send null to clear it.',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}
