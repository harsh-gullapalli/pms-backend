import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service.js';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password.util.js';
import { SessionService } from './session.service.js';

const PASSWORD = 'Correct-Horse-1';

describe('AuthService', () => {
  let service: AuthService;
  let findUnique: ReturnType<typeof vi.fn>;
  let sessions: {
    create: ReturnType<typeof vi.fn>;
    revoke: ReturnType<typeof vi.fn>;
  };
  let jwt: { signAsync: ReturnType<typeof vi.fn> };
  let user: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    isActive: boolean;
    role: 'ADMIN' | 'STAFF';
    propertyId: string | null;
    property: { isActive: boolean } | null;
  };

  beforeAll(async () => {
    user = {
      id: 'user-1',
      email: 'admin@pms.local',
      name: 'Admin User',
      passwordHash: await hashPassword(PASSWORD),
      isActive: true,
      role: 'STAFF',
      propertyId: 'property-1',
      property: { isActive: true },
    };
  });

  beforeEach(() => {
    findUnique = vi.fn().mockResolvedValue(user);
    sessions = {
      create: vi.fn().mockResolvedValue('session-1'),
      revoke: vi.fn().mockResolvedValue(undefined),
    };
    jwt = { signAsync: vi.fn().mockResolvedValue('signed.jwt.token') };

    service = new AuthService(
      { user: { findUnique } } as unknown as PrismaService,
      sessions as unknown as SessionService,
      jwt as unknown as JwtService,
    );
  });

  it('creates a session and returns a token without leaking the hash', async () => {
    const result = await service.login(user.email, PASSWORD, {});

    expect(result).toEqual({
      accessToken: 'signed.jwt.token',
      tokenType: 'Bearer',
      user: {
        id: 'user-1',
        email: user.email,
        name: user.name,
        role: 'STAFF',
        propertyId: 'property-1',
      },
    });
    expect(sessions.create).toHaveBeenCalledOnce();
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      sid: 'session-1',
    });
  });

  it('rejects a wrong password without creating a session', async () => {
    await expect(
      service.login(user.email, 'wrong-password', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with the same error', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.login('ghost@pms.local', PASSWORD, {}),
    ).rejects.toThrow('Invalid email or password');
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('rejects a deactivated user even with the right password', async () => {
    findUnique.mockResolvedValue({ ...user, isActive: false });

    await expect(
      service.login(user.email, PASSWORD, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('stores the role and property on the session', async () => {
    await service.login(user.email, PASSWORD, {});

    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'STAFF', propertyId: 'property-1' }),
      {},
    );
  });

  it('refuses a STAFF user without a property, but only after the password is right', async () => {
    findUnique.mockResolvedValue({ ...user, propertyId: null, property: null });

    await expect(
      service.login(user.email, PASSWORD, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    // A wrong password must still look like any other failed login.
    await expect(
      service.login(user.email, 'wrong-password', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('refuses a STAFF user whose property is inactive', async () => {
    findUnique.mockResolvedValue({
      ...user,
      property: { ...user.property!, isActive: false },
    });

    await expect(
      service.login(user.email, PASSWORD, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('lets an ADMIN sign in without a property', async () => {
    findUnique.mockResolvedValue({
      ...user,
      role: 'ADMIN',
      propertyId: null,
      property: null,
    });

    const result = await service.login(user.email, PASSWORD, {});

    expect(result.user.role).toBe('ADMIN');
    expect(result.user.propertyId).toBeNull();
  });

  it('revokes the session on logout', async () => {
    await service.logout('session-1');

    expect(sessions.revoke).toHaveBeenCalledWith('session-1');
  });
});
