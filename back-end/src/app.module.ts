import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import throttleConfig, { ThrottleStorageMode } from './config/throttle.config';
import { createThrottlerStorage } from './config/throttler-storage.factory';
import { validateEnvironment } from './config/env.validation';

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
        throttleConfig,
      ],
      validate: validateEnvironment,
    }),
    // Rate limiting uses a shared Redis store when THROTTLE_STORAGE is redis,
    // so limits hold across instances. The in-process caches in
    // PracticeService / JwtStrategy stay in-memory on purpose: they are hot-path
    // read caches where a Redis round-trip would add latency, and their cross-
    // instance staleness is bounded by short TTLs.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const storage = createThrottlerStorage(
          config.getOrThrow<ThrottleStorageMode>('throttle.storageMode'),
          config.get<string>('REDIS_URL'),
        );
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
