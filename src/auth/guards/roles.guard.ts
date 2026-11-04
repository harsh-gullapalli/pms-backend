import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../generated/prisma/enums.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AuthenticatedRequest } from '../types/auth.types.js';

/**
 * Registered globally after AuthGuard. Routes without @Roles() are open to
 * every authenticated user; public routes never reach a user, so they pass.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    return true;
  }
}
