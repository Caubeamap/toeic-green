import { resolveThrottleStorageMode } from './throttle.config';

describe('resolveThrottleStorageMode', () => {
  it('defaults an absent or empty storage mode to memory', () => {
    expect(resolveThrottleStorageMode(undefined)).toBe('memory');
    expect(resolveThrottleStorageMode('')).toBe('memory');
  });

  it('accepts only exact memory and redis modes', () => {
    expect(resolveThrottleStorageMode('memory')).toBe('memory');
    expect(resolveThrottleStorageMode('redis')).toBe('redis');
  });

  it('rejects unknown, mixed-case, and padded modes', () => {
    for (const value of ['unknown', 'Memory', 'REDIS', ' memory ', 'redis ']) {
      expect(() => resolveThrottleStorageMode(value)).toThrow(
        'THROTTLE_STORAGE must be either memory or redis',
      );
    }
  });
});
