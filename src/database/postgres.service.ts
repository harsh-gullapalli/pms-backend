import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Pool } from 'pg';
import postgresConfig from '../config/postgres.config.js';

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private readonly pool: Pool;

  constructor(
    @Inject(postgresConfig.KEY)
    config: ConfigType<typeof postgresConfig>,
  ) {
    this.pool = new Pool({
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
    this.pool.on('error', (error) => {
      this.logger.error(`Idle PostgreSQL client error: ${error.message}`);
    });
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
