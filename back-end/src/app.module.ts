import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PracticeModule } from './modules/practice/practice.module';
import { ExploreModule } from './modules/explore/explore.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { CommentsModule } from './modules/comments/comments.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import mailConfig from './config/mail.config';
import storageConfig from './config/storage.config';
import { validateEnvironment } from './config/env.validation';

// Build a Redis-backed throttler store so rate limits are shared across
// instances. Falls back to in-memory for tests and local/no-Redis setups so
// those keep working without a Redis dependency.
function createThrottlerStorage(url: string | undefined) {
  const useRedis =
    !!url &&
    process.env.NODE_ENV !== 'test' &&
    !/localhost|127\.0\.0\.1/.test(url);

  if (!useRedis || !url) {
    return undefined;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableAutoPipelining: true,
  });
  // ioredis retries on its own; log errors so a transient Redis blip is visible
  // without crashing the app.
  client.on('error', (err: Error) =>
    console.error('[redis throttler] error:', err.message),
  );
  return new ThrottlerStorageRedisService(client);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        mailConfig,
        storageConfig,
      ],
      validate: validateEnvironment,
    }),
    // Rate limiting uses a shared Redis store when REDIS_URL points at a real
    // Redis, so limits hold across instances. The in-process caches in
    // PracticeService / JwtStrategy stay in-memory on purpose: they are hot-path
    // read caches where a Redis round-trip would add latency, and their cross-
    // instance staleness is bounded by short TTLs.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const storage = createThrottlerStorage(config.get<string>('redis.url'));
        return {
          throttlers: [{ ttl: 60000, limit: 100 }],
          ...(storage ? { storage } : {}),
          skipIf: (context) => {
            if (process.env.NODE_ENV === 'test') {
              const req = context
                .switchToHttp()
                .getRequest<{ body?: { email?: string } }>();
              return req.body?.email !== 'missing@example.com';
            }
            return false;
          },
        };
      },
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    PracticeModule,
    ExploreModule,
    VocabularyModule,
    CommentsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
