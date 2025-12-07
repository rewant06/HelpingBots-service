import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const frontendUrlEnv = process.env.FRONTEND_URL || '';
  const allowedOrigins = frontendUrlEnv.split(',').map((url) => url.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-api-key, x-user-id', // Allow custom headers
  });
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

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
