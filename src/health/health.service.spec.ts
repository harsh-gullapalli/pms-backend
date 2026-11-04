import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  let service: HealthService;
  let postgres: { ping: ReturnType<typeof vi.fn> };
  let redis: { ping: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    postgres = { ping: vi.fn().mockResolvedValue(undefined) };
    redis = { ping: vi.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: postgres },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('reports ok when both dependencies respond', async () => {
    const report = await service.check();

    expect(report.status).toBe('ok');
    expect(report.components.postgres.status).toBe('up');
    expect(report.components.redis.status).toBe('up');
  });

  it('reports error when postgres is down', async () => {
    postgres.ping.mockRejectedValue(new Error('connection refused'));

    const report = await service.check();

    expect(report.status).toBe('error');
    expect(report.components.postgres.status).toBe('down');
    expect(report.components.redis.status).toBe('up');
  });

  it('reports error when redis is down', async () => {
    redis.ping.mockRejectedValue(new Error('ECONNREFUSED'));

    const report = await service.check();

    expect(report.status).toBe('error');
    expect(report.components.redis.status).toBe('down');
    expect(report.components.postgres.status).toBe('up');
  });

  it('marks a hung dependency as down after the probe timeout', async () => {
    vi.useFakeTimers();
    redis.ping.mockReturnValue(new Promise(() => undefined));

    const pending = service.check();
    await vi.advanceTimersByTimeAsync(2000);
    const report = await pending;

    vi.useRealTimers();
    expect(report.components.redis.status).toBe('down');
    expect(report.status).toBe('error');
  });
});
