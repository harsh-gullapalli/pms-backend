import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Redis } from 'ioredis';
import redisConfig from '../config/redis.config.js';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    @Inject(redisConfig.KEY)
    config: ConfigType<typeof redisConfig>,
  ) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      connectTimeout: config.connectTimeoutMs,
      // Fail a command after one reconnect attempt instead of queueing it
      // indefinitely; the client keeps reconnecting in the background.
      maxRetriesPerRequest: 1,
    });
  }

  async ping(): Promise<void> {
    await this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
