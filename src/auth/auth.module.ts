import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config.js';
import { RedisModule } from '../redis/redis.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './guards/auth.guard.js';
import { PropertyScopeGuard } from './guards/property-scope.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [
    RedisModule,
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.secret,
        signOptions: { algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    // Default-deny: all routes in the app are protected unless @Public().
    { provide: APP_GUARD, useClass: AuthGuard },
    // Run after AuthGuard (registration order): role and property checks need
    // the authenticated user.
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PropertyScopeGuard },
  ],
})
export class AuthModule {}
