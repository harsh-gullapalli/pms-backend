import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Close the database and Redis connections cleanly on SIGTERM/SIGINT.
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');

  // API docs are not exposed in production.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PMS Backend API')
      .setDescription(
        'Property management system API for Tripon X. Call `POST /api/v1/auth/login`, then use the returned token with the Authorize button.',
      )
      .setVersion('0.0.1')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();

    SwaggerModule.setup(
      'docs',
      app,
      SwaggerModule.createDocument(app, config),
      {
        useGlobalPrefix: true,
        swaggerOptions: { persistAuthorization: true },
      },
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
