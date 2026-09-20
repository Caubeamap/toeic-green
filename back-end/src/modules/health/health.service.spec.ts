import { ServiceUnavailableException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { HealthService } from './health.service';

jest.mock('ioredis', () => ({ Redis: jest.fn() }));

describe('HealthService', () => {
  const prisma = { $queryRawUnsafe: jest.fn() };
  const config = {
    get: jest.fn().mockReturnValue('rediss://cache.example:6379'),
  };
  const redis = {
    status: 'ready',
    on: jest.fn(),
    connect: jest.fn(),
    ping: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Redis as unknown as jest.Mock).mockImplementation(() => redis);
    prisma.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);
    redis.status = 'ready';
    redis.connect.mockResolvedValue(undefined);
    redis.ping.mockResolvedValue('PONG');
  });

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
    expect((error as ServiceUnavailableException).getResponse()).toEqual({
      status: 'not_ready',
    });
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

  it('disconnects the readiness Redis client on shutdown', () => {
    const service = new HealthService(prisma as never, config as never);
    service.onModuleDestroy();
    expect(redis.disconnect).toHaveBeenCalledTimes(1);
  });
});
