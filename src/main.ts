import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './filters/exception';

async function bootstrap() {
  console.log('PORT: ', process.env.PORT);
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  app.enableCors();
  app.useGlobalFilters(new ExceptionsFilter());
  await app.listen(process.env.PORT || 9889);
}
bootstrap();
