import { NestFactory } from '@nestjs/core';
import { configureApp } from './app.setup';

jest.mock('@nestjs/core', () => ({
  NestFactory: { create: jest.fn() },
}));
jest.mock('./app.module', () => ({ AppModule: class AppModule {} }));
jest.mock('./app.setup', () => ({ configureApp: jest.fn() }));

describe('bootstrap', () => {
  it('enables shutdown hooks before listening', async () => {
    const enableShutdownHooks = jest.fn();
    const listen = jest.fn().mockResolvedValue(undefined);
    (NestFactory.create as jest.Mock).mockResolvedValue({
      enableShutdownHooks,
      listen,
    });
    (configureApp as jest.Mock).mockReturnValue({
      frontendUrl: 'https://frontend.example',
    });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    require('./main');
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(enableShutdownHooks).toHaveBeenCalledTimes(1);
    expect(enableShutdownHooks.mock.invocationCallOrder[0]).toBeLessThan(
      listen.mock.invocationCallOrder[0],
    );
  });
});
