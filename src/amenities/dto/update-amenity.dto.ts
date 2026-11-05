import { PartialType } from '@nestjs/swagger';
import { CreateAmenityDto } from './create-amenity.dto.js';

/** Partial update: only the provided fields are changed. */
export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {}
