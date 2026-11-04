import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../session.service.js';
import type { AuthUser } from '../types/auth.types.js';
import { AuthGuard } from './auth.guard.js';

const USER: AuthUser = {
  id: 'user-1',
  email: 'admin@pms.local',
  name: 'Admin User',
  sessionId: 'session-1',
};

function contextFor(request: object): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let jwt: { verifyAsync: ReturnType<typeof vi.fn> };
  let sessions: { validate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    jwt = {
      verifyAsync: vi
        .fn()
        .mockResolvedValue({ sub: 'user-1', sid: 'session-1' }),
    };
    sessions = { validate: vi.fn().mockResolvedValue(USER) };

    guard = new AuthGuard(
      reflector as unknown as Reflector,
      jwt as unknown as JwtService,
      sessions as unknown as SessionService,
    );
  });

  it('lets public routes through without checking a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(
      true,
    );
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a request without an Authorization header', async () => {
    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a non-bearer scheme', async () => {
    const request = { headers: { authorization: 'Basic abc123' } };

    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a token that fails verification', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));
    const request = { headers: { authorization: 'Bearer bad.token.here' } };

    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessions.validate).not.toHaveBeenCalled();
  });

  it('rejects a validly signed token without the expected claims', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    const request = { headers: { authorization: 'Bearer some.valid.token' } };

    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token whose session was revoked', async () => {
    sessions.validate.mockResolvedValue(null);
    const request = { headers: { authorization: 'Bearer some.valid.token' } };

    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the user to the request for an active session', async () => {
    const request: { headers: object; user?: AuthUser } = {
      headers: { authorization: 'Bearer some.valid.token' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(sessions.validate).toHaveBeenCalledWith('session-1', 'user-1');
    expect(request.user).toEqual(USER);
  });
});
