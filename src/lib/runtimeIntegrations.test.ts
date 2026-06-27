import { describe, expect, it, vi } from 'vitest';
import { registerAppServiceWorker } from './runtimeIntegrations';

describe('runtime integrations', () => {
  it('skips Workbox registration when service workers are unavailable', async () => {
    const register = vi.fn();

    await expect(registerAppServiceWorker({ supported: false, production: true, register })).resolves.toBe(
      'unsupported'
    );
    expect(register).not.toHaveBeenCalled();
  });

  it('skips registration in development', async () => {
    const register = vi.fn();
    await expect(registerAppServiceWorker({ supported: true, production: false, register })).resolves.toBe(
      'development'
    );
    expect(register).not.toHaveBeenCalled();
  });

  it('registers when supported and in production', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    await expect(registerAppServiceWorker({ supported: true, production: true, register })).resolves.toBe(
      'registered'
    );
    expect(register).toHaveBeenCalled();
  });
});
