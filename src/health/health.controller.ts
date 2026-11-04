import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator.js';
import { HealthReportDto } from './dto/health-report.dto.js';
import { HealthReport, HealthService } from './health.service.js';

/** Public so load balancers and orchestrators can probe it without a token. */
@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({
    summary: 'Health check',
    description:
      'Probes PostgreSQL and Redis. Public, so load balancers can call it without a token.',
  })
  @ApiOkResponse({
    description: 'All components are up.',
    type: HealthReportDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'At least one component is down.',
    type: HealthReportDto,
  })
  @Get()
  async check(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthReport> {
    const report = await this.healthService.check();

    res.status(
      report.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );

    return report;
  }
}
