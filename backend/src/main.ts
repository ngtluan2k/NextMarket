// main.ts
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // chỉ cho phép field được định nghĩa trong DTO
      forbidNonWhitelisted: true, // nếu có field lạ -> báo lỗi
      transform: true, // tự động transform kiểu dữ liệu (string -> number)
    })
  );

  const globalPrefix = '';
  app.setGlobalPrefix(globalPrefix);

  // CORS cho FE
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('EveryMart API')
    .setDescription('API documentation for EveryMart')
    .setVersion('1.0')
    .addTag('users')
    .addTag('products')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`📄 Swagger docs available at: http://localhost:${port}/api`);
}

bootstrap();
