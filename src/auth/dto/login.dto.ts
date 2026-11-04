import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    format: 'email',
    maxLength: 254,
    example: 'admin@pms.local',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 128,
    format: 'password',
    example: 'Admin@12345',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
