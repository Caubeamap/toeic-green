import { registerAs } from '@nestjs/config';

export type ThrottleStorageMode = 'memory' | 'redis';

export function resolveThrottleStorageMode(
  value: unknown,
): ThrottleStorageMode {
  if (value === undefined || value === '') {
    return 'memory';
  }

  if (value === 'memory' || value === 'redis') {
    return value;
  }

  throw new Error('THROTTLE_STORAGE must be either memory or redis');
}

export default registerAs('throttle', () => ({
  storageMode: resolveThrottleStorageMode(process.env.THROTTLE_STORAGE),
}));
