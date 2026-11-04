import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { PropertyScopeGuard } from './property-scope.guard.js';

function contextFor(
  user: object | undefined,
  params: Record<string, string>,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
  } as unknown as ExecutionContext;
}

const STAFF = { role: 'STAFF', propertyId: 'property-1' };

describe('PropertyScopeGuard', () => {
  const guard = new PropertyScopeGuard();

  it('lets STAFF use their own property', () => {
    expect(
      guard.canActivate(contextFor(STAFF, { propertyId: 'property-1' })),
    ).toBe(true);
  });

  it('hides other properties from STAFF with a 404', () => {
    expect(() =>
      guard.canActivate(contextFor(STAFF, { propertyId: 'property-2' })),
    ).toThrow(NotFoundException);
  });

  it('lets ADMIN use any property', () => {
    expect(
      guard.canActivate(
        contextFor(
          { role: 'ADMIN', propertyId: null },
          { propertyId: 'property-2' },
        ),
      ),
    ).toBe(true);
  });

  it('ignores routes without :propertyId and public routes', () => {
    expect(guard.canActivate(contextFor(STAFF, {}))).toBe(true);
    expect(
      guard.canActivate(contextFor(undefined, { propertyId: 'property-2' })),
    ).toBe(true);
  });
});
