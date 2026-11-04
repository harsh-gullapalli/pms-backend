import { PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto.js';

/** Partial update: every field is optional and only provided ones change. */
export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
