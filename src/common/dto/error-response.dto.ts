import { ApiProperty } from '@nestjs/swagger';

/** Shape of every error body produced by Nest's default exception filter. */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({
    description: 'Human-readable message, or a list of validation messages.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Room type not found',
  })
  message: string | string[];

  @ApiProperty({ example: 'Not Found' })
  error: string;
}
