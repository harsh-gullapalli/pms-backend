import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import postgresConfig from '../config/postgres.config.js';
import { PrismaClient } from '../generated/prisma/client.js';

const logger = new Logger('PrismaService');

/**
 * Single shared Prisma client (and connection pool) for the application.
 * Connections are opened lazily, so the app can boot while the database is
 * temporarily unavailable; the health endpoint reports the state.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(
    @Inject(postgresConfig.KEY)
    config: ConfigType<typeof postgresConfig>,
  ) {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      max: config.maxConnections,
      connectionTimeoutMillis: config.connectionTimeoutMs,
      idleTimeoutMillis: config.idleTimeoutMs,
    });

    // Idle clients can emit errors (e.g. server restart); without a listener
    // the process would crash instead of letting the pool discard the client.
    pool.on('error', (error) => {
      logger.error(`Idle PostgreSQL client error: ${error.message}`);
    });

    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
