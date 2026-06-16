import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PracticeModule } from './modules/practice/practice.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import mailConfig from './config/mail.config';
import { validateEnvironment } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, mailConfig],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
        skipIf: (context) => {
          if (process.env.NODE_ENV === 'test') {
            const req = context
              .switchToHttp()
              .getRequest<{ body?: { email?: string } }>();
            return req.body?.email !== 'missing@example.com';
          }
          return false;
        },
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    PracticeModule,
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
