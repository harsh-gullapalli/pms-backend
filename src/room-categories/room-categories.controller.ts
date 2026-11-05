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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import type { RoomCategory } from '../generated/prisma/client.js';
import { CreateRoomCategoryDto } from './dto/create-room-category.dto.js';
import { RoomCategoryResponseDto } from './dto/room-category-response.dto.js';
import { UpdateRoomCategoryDto } from './dto/update-room-category.dto.js';
import { RoomCategoriesService } from './room-categories.service.js';

@ApiTags('Room categories')
@ApiParam({ name: 'propertyId', format: 'uuid', description: 'Property id' })
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or revoked access token.',
  type: ErrorResponseDto,
})
@Controller(':propertyId/room-categories')
export class RoomCategoriesController {
  constructor(private readonly categoriesService: RoomCategoriesService) {}

  @ApiOperation({
    summary: 'List room categories',
    description: 'Returns the room categories of one property, by name.',
  })
  @ApiOkResponse({ type: RoomCategoryResponseDto, isArray: true })
  @Get()
  findAll(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<RoomCategory[]> {
    return this.categoriesService.findAll(propertyId);
  }

  @ApiOperation({ summary: 'Get a room category by id' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Room category id' })
  @ApiOkResponse({ type: RoomCategoryResponseDto })
  @ApiBadRequestResponse({
    description: '`id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No room category with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findOne(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomCategory> {
    return this.categoriesService.findOne(propertyId, id);
  }

  @ApiOperation({ summary: 'Create a room category' })
  @ApiCreatedResponse({ type: RoomCategoryResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No such property.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'A room category with this name already exists at this property.',
    type: ErrorResponseDto,
  })
  @Post()
  create(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateRoomCategoryDto,
  ): Promise<RoomCategory> {
    return this.categoriesService.create(propertyId, dto);
  }

  @ApiOperation({
    summary: 'Update a room category',
    description: 'Partial update: only the fields in the body are changed.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Room category id' })
  @ApiOkResponse({ type: RoomCategoryResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or `id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No room category with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A room category with this name already exists.',
    type: ErrorResponseDto,
  })
  @Patch(':id')
  update(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomCategoryDto,
  ): Promise<RoomCategory> {
    return this.categoriesService.update(propertyId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a room category' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Room category id' })
  @ApiNoContentResponse({ description: 'Room category deleted.' })
  @ApiBadRequestResponse({
    description: '`id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No room category with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.categoriesService.remove(propertyId, id);
  }
}
