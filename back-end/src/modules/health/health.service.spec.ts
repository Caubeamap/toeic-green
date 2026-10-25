import { ServiceUnavailableException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { HealthService } from './health.service';

jest.mock('ioredis', () => ({ Redis: jest.fn() }));

describe('HealthService', () => {
  const prisma = { $queryRawUnsafe: jest.fn() };
  const config = { get: jest.fn() };
  let configValues: Record<string, unknown>;
  const redis = {
    status: 'ready',
    on: jest.fn(),
    connect: jest.fn(),
    ping: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    configValues = {
      'throttle.storageMode': 'redis',
      'redis.url': 'rediss://cache.example:6379',
    };
    config.get.mockImplementation((key: string) => configValues[key]);
    (Redis as unknown as jest.Mock).mockImplementation(() => redis);
    prisma.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);
    redis.status = 'ready';
    redis.connect.mockResolvedValue(undefined);
    redis.ping.mockResolvedValue('PONG');
  });

  it.each([undefined, 'rediss://stale.example:6379'])(
    'checks PostgreSQL without Redis in memory mode with URL %p',
    async (redisUrl) => {
      configValues['throttle.storageMode'] = 'memory';
      configValues['redis.url'] = redisUrl;
      const service = new HealthService(prisma as never, config as never);

      await expect(service.ready()).resolves.toEqual({ status: 'ready' });
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
      expect(Redis).not.toHaveBeenCalled();
      expect(redis.connect).not.toHaveBeenCalled();
      expect(redis.ping).not.toHaveBeenCalled();
    },
  );

  it('returns a generic 503 when PostgreSQL fails in memory mode', async () => {
    configValues['throttle.storageMode'] = 'memory';
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('database detail'));
    const service = new HealthService(prisma as never, config as never);

    const error = await service.ready().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getStatus()).toBe(503);
    expect((error as ServiceUnavailableException).getResponse()).toEqual({
      status: 'not_ready',
    });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
    expect(Redis).not.toHaveBeenCalled();
  });

  it('does not disconnect Redis on memory-mode shutdown', () => {
    configValues['throttle.storageMode'] = 'memory';
    const service = new HealthService(prisma as never, config as never);

    service.onModuleDestroy();

    expect(redis.disconnect).not.toHaveBeenCalled();
    expect(Redis).not.toHaveBeenCalled();
  });

  it.each([undefined, ''])(
    'fails closed without a Redis URL in Redis mode (%p)',
    (redisUrl) => {
      configValues['redis.url'] = redisUrl;

      expect(() => new HealthService(prisma as never, config as never)).toThrow(
        'REDIS_URL',
      );
      expect(Redis).not.toHaveBeenCalled();
    },
  );

  it('reports ready when PostgreSQL and Redis respond', async () => {
    const service = new HealthService(prisma as never, config as never);
    await expect(service.ready()).resolves.toEqual({ status: 'ready' });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('returns a generic 503 when a dependency fails', async () => {
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('database detail'));
    const service = new HealthService(prisma as never, config as never);
    const error = await service.ready().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getStatus()).toBe(503);
    expect((error as ServiceUnavailableException).getResponse()).toEqual({
      status: 'not_ready',
    });
  });

  it('returns a generic 503 when Redis fails in Redis mode', async () => {
    redis.ping.mockRejectedValue(new Error('Redis quota detail'));
    const service = new HealthService(prisma as never, config as never);

    const error = await service.ready().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getStatus()).toBe(503);
    expect((error as ServiceUnavailableException).getResponse()).toEqual({
      status: 'not_ready',
    });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('shares an initial Redis connection across concurrent readiness checks', async () => {
    let resolveConnect: (() => void) | undefined;
    redis.status = 'wait';
    redis.connect.mockImplementation(() => {
      redis.status = 'connecting';
      return new Promise<void>((resolve) => {
        resolveConnect = resolve;
      });
    });
    redis.ping.mockImplementation(() =>
      redis.status === 'ready'
        ? Promise.resolve('PONG')
        : Promise.reject(new Error("Stream isn't writeable")),
    );
    const service = new HealthService(prisma as never, config as never);

    const firstReadiness = service.ready();
    const secondReadiness = service.ready();

    expect(redis.connect).toHaveBeenCalledTimes(1);
    const pingCallsWhileConnecting = redis.ping.mock.calls.length;

    redis.status = 'ready';
    resolveConnect?.();

    const results = await Promise.allSettled([firstReadiness, secondReadiness]);
    expect(pingCallsWhileConnecting).toBe(0);
    expect(results).toEqual([
      { status: 'fulfilled', value: { status: 'ready' } },
      { status: 'fulfilled', value: { status: 'ready' } },
    ]);
    expect(redis.connect).toHaveBeenCalledTimes(1);
    expect(redis.ping).toHaveBeenCalledTimes(2);
  });

  it('retries Redis connection after a shared connection attempt fails', async () => {
    let rejectConnect: ((error: Error) => void) | undefined;
    redis.status = 'wait';
    redis.connect
      .mockImplementationOnce(() => {
        redis.status = 'connecting';
        return new Promise<void>((_resolve, reject) => {
          rejectConnect = reject;
        });
      })
      .mockImplementationOnce(() => {
        redis.status = 'ready';
        return Promise.resolve();
      });
    const service = new HealthService(prisma as never, config as never);

    const initialReadiness = [service.ready(), service.ready()];
    expect(redis.connect).toHaveBeenCalledTimes(1);

    rejectConnect?.(new Error('connection failed'));
    const initialResults = await Promise.allSettled(initialReadiness);
    expect(initialResults.map((result) => result.status)).toEqual([
      'rejected',
      'rejected',
    ]);

    redis.status = 'end';
    await expect(service.ready()).resolves.toEqual({ status: 'ready' });
    expect(redis.connect).toHaveBeenCalledTimes(2);
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('disconnects the readiness Redis client exactly once on Redis-mode shutdown', () => {
    const service = new HealthService(prisma as never, config as never);
    service.onModuleDestroy();
    expect(redis.disconnect).toHaveBeenCalledTimes(1);
  });
});
