import { Module } from '@nestjs/common';
import { RoomCategoriesController } from './room-categories.controller.js';
import { RoomCategoriesService } from './room-categories.service.js';

@Module({
  controllers: [RoomCategoriesController],
  providers: [RoomCategoriesService],
})
export class RoomCategoriesModule {}
