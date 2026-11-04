import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/enums.js';

/** The signed-in user. Used by both `POST /auth/login` and `GET /auth/me`. */
export class AuthUserDto {
  @ApiProperty({
    format: 'uuid',
    example: '0b0c7a3e-5f1c-4f55-9a52-1d3f6a6f2b10',
  })
  id: string;

  @ApiProperty({ example: 'john.doe@pms.local' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.STAFF,
    description:
      '`ADMIN` manages every property; `STAFF` is limited to their own property.',
  })
  role: UserRole;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    example: '3f2b8c1e-9d4a-4c55-8a1b-2e6f7a9b0c11',
    description:
      'Id of the property a STAFF user belongs to (`properties.id`); null for ADMIN. Load details with `GET /properties/{id}`.',
  })
  propertyId: string | null;
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
