import type { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import type { ThrottleStorageMode } from './throttle.config';

export function createThrottlerStorage(
  mode: ThrottleStorageMode,
  redisUrl: string | undefined,
): ThrottlerStorage | undefined {
  if (mode === 'memory') {
    return undefined;
  }

  if (!redisUrl) {
    throw new Error('REDIS_URL is required when THROTTLE_STORAGE is redis');
  }

  const client = new Redis(redisUrl, {
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
