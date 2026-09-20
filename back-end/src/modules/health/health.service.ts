import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

const DEPENDENCY_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly redis: Redis;
  private redisConnectionPromise?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
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
      await Promise.all([
        withTimeout(
          this.prisma.$queryRawUnsafe('SELECT 1'),
          DEPENDENCY_TIMEOUT_MS,
        ),
        withTimeout(this.pingRedis(), DEPENDENCY_TIMEOUT_MS),
      ]);
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready' });
    }
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  private async pingRedis() {
    if (
      (this.redis.status === 'wait' || this.redis.status === 'end') &&
      !this.redisConnectionPromise
    ) {
      this.redisConnectionPromise = this.redis.connect().finally(() => {
        this.redisConnectionPromise = undefined;
      });
    }
    if (this.redisConnectionPromise) {
      await this.redisConnectionPromise;
    }
    if (this.redis.status !== 'ready') {
      throw new Error('Redis client is not ready');
    }
    await this.redis.ping();
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
