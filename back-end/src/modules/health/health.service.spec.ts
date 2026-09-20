import { ServiceUnavailableException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { HealthService } from './health.service';

jest.mock('ioredis', () => ({ Redis: jest.fn() }));

describe('HealthService', () => {
  const prisma = { $queryRawUnsafe: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('rediss://cache.example:6379') };
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

  it('disconnects the readiness Redis client on shutdown', () => {
    const service = new HealthService(prisma as never, config as never);
    service.onModuleDestroy();
    expect(redis.disconnect).toHaveBeenCalledTimes(1);
  });
});
