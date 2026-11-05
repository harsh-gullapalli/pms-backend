import { PartialType } from '@nestjs/swagger';
import { CreateRoomCategoryDto } from './create-room-category.dto.js';

/** Partial update: only the provided fields are changed. */
export class UpdateRoomCategoryDto extends PartialType(
  CreateRoomCategoryDto,
) {}
