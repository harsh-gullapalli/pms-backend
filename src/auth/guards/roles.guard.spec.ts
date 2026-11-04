import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

function contextFor(user: object | undefined): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows routes without @Roles()', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextFor({ role: 'STAFF' }))).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(guard.canActivate(contextFor({ role: 'ADMIN' }))).toBe(true);
  });

  it('rejects a user whose role is not listed', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(contextFor({ role: 'STAFF' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a restricted route when there is no user', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
