import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SessionService } from '../session.service.js';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth.types.js';

/**
 * Registered globally: every route requires a valid bearer token whose
 * session is still active, unless the route is marked with @Public().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verify(token);
    const user = await this.sessions.validate(payload.sid, payload.sub);

    if (!user) {
      throw new UnauthorizedException('Session is no longer active');
    }

    request.user = user;
    return true;
  }

  private async verify(token: string): Promise<JwtPayload> {
    let payload: Partial<JwtPayload>;

    try {
      payload = await this.jwt.verifyAsync<Partial<JwtPayload>>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new UnauthorizedException('Invalid token');
    }

    return { sub: payload.sub, sid: payload.sid };
  }
}

function extractBearerToken(request: Request): string | undefined {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}
