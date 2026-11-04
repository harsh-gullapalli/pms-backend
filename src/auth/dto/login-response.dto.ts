import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    format: 'uuid',
    example: '0b0c7a3e-5f1c-4f55-9a52-1d3f6a6f2b10',
  })
  id: string;

  @ApiProperty({ example: 'admin@pms.local' })
  email: string;

  @ApiProperty({ example: 'Admin User' })
  name: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description:
      'JWT access token. It does not expire; it stays valid until the session is ended with POST /auth/logout.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ enum: ['Bearer'], example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
