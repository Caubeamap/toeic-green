import { HealthController } from './health.controller';

describe('HealthController', () => {
  const healthService = {
    ready: jest.fn(),
  };
  const controller = new HealthController(healthService as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns a dependency-free liveness response', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(healthService.ready).not.toHaveBeenCalled();
  });

  it('delegates readiness checks to HealthService', async () => {
    healthService.ready.mockResolvedValue({ status: 'ready' });
    await expect(controller.ready()).resolves.toEqual({ status: 'ready' });
    expect(healthService.ready).toHaveBeenCalledTimes(1);
  });
});
