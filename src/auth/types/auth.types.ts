import type { Request } from 'express';
import type { UserRole } from '../../generated/prisma/enums.js';

/** Claims stored in the access token. The token never expires; it is only
 *  valid while its session exists (see SessionService). */
export interface JwtPayload {
  /** User id */
  sub: string;
  /** Session id */
  sid: string;
}

/** Authenticated principal attached to the request by AuthGuard. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** The only property a STAFF user may access; null for ADMIN. */
  propertyId: string | null;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
