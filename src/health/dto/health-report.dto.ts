import { ApiProperty } from '@nestjs/swagger';

export class ComponentHealthDto {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  status: 'up' | 'down';

  @ApiProperty({
    description: 'Time the probe took, in milliseconds.',
    example: 3,
  })
  latencyMs: number;
}

export class HealthComponentsDto {
  @ApiProperty({ type: ComponentHealthDto })
  postgres: ComponentHealthDto;

  @ApiProperty({ type: ComponentHealthDto })
  redis: ComponentHealthDto;
}

export class HealthReportDto {
  @ApiProperty({
    enum: ['ok', 'error'],
    description: '`ok` only when every component is up.',
    example: 'ok',
  })
  status: 'ok' | 'error';

  @ApiProperty({ format: 'date-time', example: '2026-11-04T14:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ type: HealthComponentsDto })
  components: HealthComponentsDto;
}
