import type { Request } from 'express';

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
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
