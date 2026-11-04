import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthUser } from '../auth/types/auth.types.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import type { Property } from '../generated/prisma/client.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { PropertyResponseDto } from './dto/property-response.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PropertiesService } from './properties.service.js';

@ApiTags('Properties')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or revoked access token.',
  type: ErrorResponseDto,
})
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @ApiOperation({
    summary: 'List properties',
    description:
      'Ordered by name. ADMIN users get every property; STAFF users get only their own.',
  })
  @ApiOkResponse({ type: PropertyResponseDto, isArray: true })
  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<Property[]> {
    return this.propertiesService.findAll(user);
  }

  @ApiOperation({ summary: 'Get a property by id' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Property id' })
  @ApiOkResponse({ type: PropertyResponseDto })
  @ApiBadRequestResponse({
    description: '`id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No property with this id, or (for STAFF) not their own property.',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Property> {
    return this.propertiesService.findOne(user, id);
  }

  @ApiOperation({ summary: 'Create a property', description: 'ADMIN only.' })
  @ApiCreatedResponse({ type: PropertyResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A property with this code already exists.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'ADMIN role required.',
    type: ErrorResponseDto,
  })
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreatePropertyDto): Promise<Property> {
    return this.propertiesService.create(dto);
  }

  @ApiOperation({
    summary: 'Update a property',
    description:
      'ADMIN only. Partial update: only the fields in the body are changed. Send null for an optional field to clear it.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Property id' })
  @ApiOkResponse({ type: PropertyResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or `id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No property with this id.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A property with this code already exists.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'ADMIN role required.',
    type: ErrorResponseDto,
  })
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ): Promise<Property> {
    return this.propertiesService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Delete a property',
    description:
      'ADMIN only. Fails with 409 while the property still has room types or users.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Property id' })
  @ApiNoContentResponse({ description: 'Property deleted.' })
  @ApiBadRequestResponse({
    description: '`id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No property with this id.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The property still has room types or users.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'ADMIN role required.',
    type: ErrorResponseDto,
  })
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.propertiesService.remove(id);
  }
}
