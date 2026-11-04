import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service.js';
import type { UserRole } from '../generated/prisma/enums.js';
import { hashPassword, verifyPassword } from './password.util.js';
import { SessionMetadata, SessionService } from './session.service.js';
import type { JwtPayload } from './types/auth.types.js';

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** The one property a STAFF user belongs to; null for ADMIN. */
  propertyId: string | null;
}

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthProfile;
}

@Injectable()
export class AuthService {
  /**
   * Compared against when the email is unknown so that a failed login takes
   * the same time whether or not the account exists (prevents user enumeration
   * through response timing).
   */
  private readonly decoyHash = hashPassword('decoy-password-not-in-use');

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly jwt: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
    metadata: SessionMetadata,
  ): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        isActive: true,
        role: true,
        propertyId: true,
        property: { select: { isActive: true } },
      },
    });

    const passwordMatches = await verifyPassword(
      password,
      user?.passwordHash ?? (await this.decoyHash),
    );

    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Checked only after the credentials are proven, so these specific
    // messages cannot be used to probe which accounts exist.
    if (user.role === 'STAFF') {
      if (!user.property) {
        throw new ForbiddenException(
          'Your account is not assigned to a property. Contact an administrator.',
        );
      }
      if (!user.property.isActive) {
        throw new ForbiddenException(
          'Your property is inactive. Contact an administrator.',
        );
      }
    }

    const profile: AuthProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      propertyId: user.propertyId,
    };
    const sessionId = await this.sessions.create(profile, metadata);
    const payload: JwtPayload = { sub: user.id, sid: sessionId };

    return {
      // No expiry: the token is valid until the session is revoked on logout.
      accessToken: await this.jwt.signAsync(payload),
      tokenType: 'Bearer',
      user: profile,
    };
  }

  logout(sessionId: string): Promise<void> {
    return this.sessions.revoke(sessionId);
  }
}
