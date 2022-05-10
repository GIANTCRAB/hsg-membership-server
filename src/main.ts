import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(cookieParser());
  app.use(csurf({ cookie: true }));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  dotenv.config();

  const config = new DocumentBuilder()
    .setTitle('Hackerspace Membership Server')
    .setDescription(
      'Server API for managing the hackerspace and their members.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.APP_PORT);
}

bootstrap();
