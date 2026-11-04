import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/auth.types.js';

/**
 * Registered globally after AuthGuard. Any route with a `:propertyId` path
 * parameter is limited to that property for STAFF users; ADMIN users may use
 * any property. A mismatch answers 404 so other properties' ids are not
 * revealed. Public routes carry no user and pass through.
 */
@Injectable()
export class PropertyScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;
    const propertyId = (request.params as Record<string, string | undefined>)
      .propertyId;

    if (!user || propertyId === undefined || user.role === 'ADMIN') {
      return true;
    }
    if (user.propertyId !== propertyId) {
      throw new NotFoundException('Property not found');
    }
    return true;
  }
}
