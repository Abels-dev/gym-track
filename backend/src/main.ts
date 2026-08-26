import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  
  // Azure App Service / Container dynamically sets process.env.PORT (defaults to 8080 or config)
  const port = process.env.PORT ? Number(process.env.PORT) : (configService.get<number>('PORT') || 8080);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.enableCors();
  app.enableShutdownHooks();

  // Listen on 0.0.0.0 for Azure Linux container / App Service compatibility
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on port ${port} (host: 0.0.0.0)`);
}
bootstrap();
