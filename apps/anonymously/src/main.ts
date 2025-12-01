import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip properties not in the DTO
      forbidNonWhitelisted: true, // Throw an error if extra properties are sent
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('HelpingBots VEIL')
    .setDescription('VEIL')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 5001);
}
bootstrap();
