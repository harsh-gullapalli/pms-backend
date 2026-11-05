import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import jwtConfig from './config/jwt.config.js';
import postgresConfig from './config/postgres.config.js';
import redisConfig from './config/redis.config.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { AmenitiesModule } from './amenities/amenities.module.js';
import { RoomCategoriesModule } from './room-categories/room-categories.module.js';
import { RoomsModule } from './rooms/rooms.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [postgresConfig, redisConfig, jwtConfig],
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    PropertiesModule,
    RoomsModule,
    RoomCategoriesModule,
    AmenitiesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
