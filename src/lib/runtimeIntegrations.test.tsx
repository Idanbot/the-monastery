import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { AppProviders } from './AppProviders';
import { createAppQueryClient, registerAppServiceWorker } from './runtimeIntegrations';

function QueryProbe() {
  const query = useQuery({ queryKey: ['probe'], queryFn: () => 'ok' });
  return <div>{query.data || 'loading'}</div>;
}

describe('runtime integrations', () => {
  it('provides a TanStack Query client', async () => {
    const client = createAppQueryClient();

    const view = render(
      <AppProviders client={client}>
        <QueryProbe />
      </AppProviders>
    );

    expect(await view.findByText('ok')).toBeInTheDocument();
  });

  it('skips Workbox registration when service workers are unavailable', async () => {
    const register = vi.fn();

    await expect(registerAppServiceWorker({ supported: false, production: true, register })).resolves.toBe(
      'unsupported'
    );
    expect(register).not.toHaveBeenCalled();
  });
});
