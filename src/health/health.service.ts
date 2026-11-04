import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

export type ComponentStatus = 'up' | 'down';

export interface ComponentHealth {
  status: ComponentStatus;
  latencyMs: number;
}

export interface HealthReport {
  status: 'ok' | 'error';
  timestamp: string;
  components: {
    postgres: ComponentHealth;
    redis: ComponentHealth;
  };
}

const PROBE_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthReport> {
    const [postgres, redis] = await Promise.all([
      this.probe('postgres', () => this.prisma.ping()),
      this.probe('redis', () => this.redis.ping()),
    ]);

    const healthy = postgres.status === 'up' && redis.status === 'up';

    return {
      status: healthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      components: { postgres, redis },
    };
  }

  private async probe(
    name: string,
    ping: () => Promise<void>,
  ): Promise<ComponentHealth> {
    const startedAt = performance.now();

    try {
      await withTimeout(ping(), PROBE_TIMEOUT_MS);
      return { status: 'up', latencyMs: elapsedMs(startedAt) };
    } catch (error) {
      // Details stay in the server log; the public response only reports status.
      this.logger.warn(`${name} health check failed: ${describe(error)}`);
      return { status: 'down', latencyMs: elapsedMs(startedAt) };
    }
  }
}

function elapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
