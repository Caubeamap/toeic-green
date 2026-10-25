import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import type { DynamicModule, FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getOptionsToken,
  ThrottlerModule,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { AppModule } from '../app.module';
import { validateEnvironment } from './env.validation';
import redisConfig from './redis.config';
import throttleConfig from './throttle.config';
import { createThrottlerStorage } from './throttler-storage.factory';

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}));

jest.mock('@nest-lab/throttler-storage-redis', () => ({
  ThrottlerStorageRedisService: jest.fn(),
}));

describe('createThrottlerStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([undefined, 'rediss://redis.example:6379'])(
    'uses built-in memory storage without constructing Redis for URL %s',
    (redisUrl) => {
      expect(createThrottlerStorage('memory', redisUrl)).toBeUndefined();
      expect(Redis).not.toHaveBeenCalled();
      expect(ThrottlerStorageRedisService).not.toHaveBeenCalled();
    },
  );

  it('constructs one Redis client and returns its storage adapter in Redis mode', () => {
    const storage = createThrottlerStorage('redis', 'redis://localhost:6379');
    const redisClient = jest.mocked(Redis).mock.results[0].value as Pick<
      Redis,
      'on'
    >;

    expect(Redis).toHaveBeenCalledTimes(1);
    expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableAutoPipelining: true,
    });
    expect(redisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(ThrottlerStorageRedisService).toHaveBeenCalledTimes(1);
    expect(ThrottlerStorageRedisService).toHaveBeenCalledWith(redisClient);
    expect(storage).toBe(
      jest.mocked(ThrottlerStorageRedisService).mock.instances[0],
    );
  });

  it.each([undefined, ''])(
    'rejects Redis mode without REDIS_URL (%s) before constructing dependencies',
    (redisUrl) => {
      expect(() => createThrottlerStorage('redis', redisUrl)).toThrow(
        'REDIS_URL',
      );
      expect(Redis).not.toHaveBeenCalled();
      expect(ThrottlerStorageRedisService).not.toHaveBeenCalled();
    },
  );
});

describe('AppModule throttler wiring', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.REDIS_URL;
    process.env.THROTTLE_STORAGE = 'redis';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each(['development', 'test'])(
    'rejects missing REDIS_URL in %s instead of using the Redis namespace fallback',
    (nodeEnv) => {
      process.env.NODE_ENV = nodeEnv;
      const config = new ConfigService({
        ...validateEnvironment({
          NODE_ENV: nodeEnv,
          THROTTLE_STORAGE: 'redis',
        }),
        throttle: throttleConfig(),
        redis: redisConfig(),
      });
      const imports = Reflect.getMetadata(
        'imports',
        AppModule,
      ) as DynamicModule[];
      const throttlerModule = imports.find(
        (entry) => entry.module === ThrottlerModule,
      );
      const optionsProvider = throttlerModule?.providers?.find(
        (provider) =>
          typeof provider === 'object' &&
          'provide' in provider &&
          provider.provide === getOptionsToken(),
      ) as FactoryProvider<ThrottlerModuleOptions>;

      expect(() => optionsProvider.useFactory(config)).toThrow('REDIS_URL');
      expect(Redis).not.toHaveBeenCalled();
      expect(ThrottlerStorageRedisService).not.toHaveBeenCalled();
    },
  );
});
