import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { ThrottleStorageMode } from '../../config/throttle.config';
import { PrismaService } from '../../prisma/prisma.service';

const DEPENDENCY_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly redis?: Redis;
  private redisConnectionPromise?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const storageMode = config.get<ThrottleStorageMode>(
      'throttle.storageMode',
      'memory',
    );
    if (storageMode !== 'redis') {
      return;
    }

    const redisUrl = config.get<string>('redis.url');
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not defined');
    }

    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: DEPENDENCY_TIMEOUT_MS,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.redis.on('error', () => undefined);
  }

  async ready() {
    try {
      const checks = [
        withTimeout(
          this.prisma.$queryRawUnsafe('SELECT 1'),
          DEPENDENCY_TIMEOUT_MS,
        ),
      ];
      if (this.redis) {
        checks.push(
          withTimeout(this.pingRedis(this.redis), DEPENDENCY_TIMEOUT_MS),
        );
      }
      await Promise.all(checks);
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready' });
    }
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  private async pingRedis(redis: Redis) {
    if (
      (redis.status === 'wait' || redis.status === 'end') &&
      !this.redisConnectionPromise
    ) {
      this.redisConnectionPromise = redis.connect().finally(() => {
        this.redisConnectionPromise = undefined;
      });
    }
    if (this.redisConnectionPromise) {
      await this.redisConnectionPromise;
    }
    if (redis.status !== 'ready') {
      throw new Error('Redis client is not ready');
    }
    await redis.ping();
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Dependency timeout')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
