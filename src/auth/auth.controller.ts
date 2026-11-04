import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, LoginResult } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import type { AuthUser } from './types/auth.types.js';

const MAX_USER_AGENT_LENGTH = 255;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() request: Request): Promise<LoginResult> {
    return this.authService.login(dto.email, dto.password, {
      userAgent: request.headers['user-agent']?.slice(0, MAX_USER_AGENT_LENGTH),
      ipAddress: request.ip,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: AuthUser): Promise<void> {
    return this.authService.logout(user.sessionId);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): Omit<AuthUser, 'sessionId'> {
    return { id: user.id, email: user.email, name: user.name };
  }
}
