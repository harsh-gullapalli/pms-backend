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
  ApiBearerAuth,
  ApiBadRequestResponse,
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

import { CreateRoomTypeDto } from './dto/create-room-type.dto.js';
import { RoomTypeResponseDto } from './dto/room-type-response.dto.js';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto.js';
import { RoomsService } from './rooms.service.js';
import type { RoomTypeWithCategory } from './rooms.service.js';

@ApiTags('Rooms')
@ApiParam({ name: 'propertyId', format: 'uuid', description: 'Property id' })
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or revoked access token.',
  type: ErrorResponseDto,
})
@Controller(':propertyId/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({
    summary: 'List room types',
    description:
      'Returns the room types of one property, cheapest base rate first.',
  })
  @ApiOkResponse({ type: RoomTypeResponseDto, isArray: true })
  @Get()
  findAll(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<RoomTypeWithCategory[]> {
    return this.roomsService.findAll(propertyId);
  }

  @ApiOperation({ summary: 'Get a room type by id' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Room type id' })
  @ApiOkResponse({ type: RoomTypeResponseDto })
  @ApiBadRequestResponse({
    description: '`id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No room type with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findOne(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomTypeWithCategory> {
    return this.roomsService.findOne(propertyId, id);
  }

  @ApiOperation({ summary: 'Create a room type' })
  @ApiCreatedResponse({ type: RoomTypeResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A room type with this name already exists at this property.',
    type: ErrorResponseDto,
  })
  @Post()
  create(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateRoomTypeDto,
  ): Promise<RoomTypeWithCategory> {
    return this.roomsService.create(propertyId, dto);
  }

  @ApiOperation({
    summary: 'Update a room type',
    description: 'Partial update: only the fields in the body are changed.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Room type id' })
  @ApiOkResponse({ type: RoomTypeResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or `id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No room type with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A room type with this name already exists.',
    type: ErrorResponseDto,
  })
  @Patch(':id')
  update(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomTypeDto,
  ): Promise<RoomTypeWithCategory> {
    return this.roomsService.update(propertyId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a room type' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Room type id' })
  @ApiNoContentResponse({ description: 'Room type deleted.' })
  @ApiBadRequestResponse({
    description: '`id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No room type with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.roomsService.remove(propertyId, id);
  }
}
