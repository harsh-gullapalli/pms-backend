import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { AuthService, LoginResult } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { AuthUserDto, LoginResponseDto } from './dto/login-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { AuthUser } from './types/auth.types.js';

const MAX_USER_AGENT_LENGTH = 255;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Log in',
    description:
      'Exchanges email and password for a bearer access token. The token has no expiry and stays valid until you call `POST /auth/logout`.',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password.',
    type: ErrorResponseDto,
  })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() request: Request): Promise<LoginResult> {
    return this.authService.login(dto.email, dto.password, {
      userAgent: request.headers['user-agent']?.slice(0, MAX_USER_AGENT_LENGTH),
      ipAddress: request.ip,
    });
  }

  @ApiOperation({
    summary: 'Log out',
    description: 'Revokes the current session, invalidating the access token.',
  })
  @ApiBearerAuth()
  @ApiNoContentResponse({ description: 'Session revoked.' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or revoked access token.',
    type: ErrorResponseDto,
  })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: AuthUser): Promise<void> {
    return this.authService.logout(user.sessionId);
  }

  @ApiOperation({ summary: 'Get the current user' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthUserDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or revoked access token.',
    type: ErrorResponseDto,
  })
  @Get('me')
  me(@CurrentUser() user: AuthUser): Omit<AuthUser, 'sessionId'> {
    return { id: user.id, email: user.email, name: user.name };
  }
}
