import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { UserRole } from '../generated/prisma/enums.js';
import { RedisService } from '../redis/redis.service.js';
import type { AuthUser } from './types/auth.types.js';

/**
 * Cached sessions are only an optimisation: PostgreSQL is the source of truth.
 * The TTL bounds how long a stale entry could survive if Redis is unreachable
 * at the moment a session is revoked.
 */
const CACHE_TTL_SECONDS = 300;

type CachedSession = Omit<AuthUser, 'sessionId'>;

export interface SessionOwner {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  propertyId: string | null;
}

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(
    owner: SessionOwner,
    metadata: SessionMetadata,
  ): Promise<string> {
    const session = await this.prisma.session.create({
      data: { userId: owner.id, ...metadata },
      select: { id: true },
    });

    await this.cache(session.id, owner);
    return session.id;
  }

  /** Returns the session's user if the session is still active, else null. */
  async validate(sessionId: string, userId: string): Promise<AuthUser | null> {
    const cached = await this.readCache(sessionId);

    if (cached) {
      return cached.id === userId ? { ...cached, sessionId } : null;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            propertyId: true,
            isActive: true,
          },
        },
      },
    });

    const user = session?.user;
    if (!user || !user.isActive || user.id !== userId) {
      return null;
    }

    const owner: SessionOwner = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      propertyId: user.propertyId,
    };
    await this.cache(sessionId, owner);
    return { ...owner, sessionId };
  }

  /** Idempotent: revoking an unknown or already revoked session is a no-op. */
  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });

    try {
      await this.redis.del(this.cacheKey(sessionId));
    } catch (error) {
      this.logger.error(
        `Could not evict session ${sessionId} from cache; it expires within ${CACHE_TTL_SECONDS}s: ${describe(error)}`,
      );
    }
  }

  private cacheKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private async readCache(sessionId: string): Promise<CachedSession | null> {
    try {
      const raw = await this.redis.get(this.cacheKey(sessionId));
      return raw ? (JSON.parse(raw) as CachedSession) : null;
    } catch (error) {
      this.logger.warn(`Session cache read failed: ${describe(error)}`);
      return null;
    }
  }

  private async cache(sessionId: string, owner: SessionOwner): Promise<void> {
    try {
      await this.redis.set(
        this.cacheKey(sessionId),
        JSON.stringify(owner),
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      this.logger.warn(`Session cache write failed: ${describe(error)}`);
    }
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
