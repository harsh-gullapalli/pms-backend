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
import type { Amenity } from '../generated/prisma/client.js';
import { CreateAmenityDto } from './dto/create-amenity.dto.js';
import { AmenityResponseDto } from './dto/amenity-response.dto.js';
import { UpdateAmenityDto } from './dto/update-amenity.dto.js';
import { AmenitiesService } from './amenities.service.js';

@ApiTags('Amenities')
@ApiParam({ name: 'propertyId', format: 'uuid', description: 'Property id' })
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or revoked access token.',
  type: ErrorResponseDto,
})
@Controller(':propertyId/amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @ApiOperation({
    summary: 'List amenities',
    description: 'Returns the amenities of one property, by name.',
  })
  @ApiOkResponse({ type: AmenityResponseDto, isArray: true })
  @Get()
  findAll(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<Amenity[]> {
    return this.amenitiesService.findAll(propertyId);
  }

  @ApiOperation({ summary: 'Get a amenity by id' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Amenity id' })
  @ApiOkResponse({ type: AmenityResponseDto })
  @ApiBadRequestResponse({
    description: '`id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No amenity with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findOne(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Amenity> {
    return this.amenitiesService.findOne(propertyId, id);
  }

  @ApiOperation({ summary: 'Create a amenity' })
  @ApiCreatedResponse({ type: AmenityResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No such property.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A amenity with this name already exists at this property.',
    type: ErrorResponseDto,
  })
  @Post()
  create(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateAmenityDto,
  ): Promise<Amenity> {
    return this.amenitiesService.create(propertyId, dto);
  }

  @ApiOperation({
    summary: 'Update a amenity',
    description: 'Partial update: only the fields in the body are changed.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Amenity id' })
  @ApiOkResponse({ type: AmenityResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or `id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No amenity with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A amenity with this name already exists.',
    type: ErrorResponseDto,
  })
  @Patch(':id')
  update(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAmenityDto,
  ): Promise<Amenity> {
    return this.amenitiesService.update(propertyId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a amenity' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Amenity id' })
  @ApiNoContentResponse({ description: 'Amenity deleted.' })
  @ApiBadRequestResponse({
    description: '`id` is not a valid UUID.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No amenity with this id at this property, or no such property.',
    type: ErrorResponseDto,
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.amenitiesService.remove(propertyId, id);
  }
}
