import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const startedAt = performance.now();
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  // Enable cookie parser middleware
  app.use(cookieParser());

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Register global exception filter for database errors
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:6868';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  const port = process.env.PORT || 2409;
  await app.listen(port);

  const readyInMs = Math.round(performance.now() - startedAt);
  console.log(
    [
      '',
      '▲ NestJS 11 (SWC)',
      `- Local:    http://localhost:${port}/api`,
      `- Frontend: ${frontendUrl}`,
      '',
      `✓ Ready in ${readyInMs}ms`,
      '',
    ].join('\n'),
  );
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
