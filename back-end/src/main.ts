import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const startedAt = performance.now();
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  const { frontendUrl } = configureApp(app);

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
