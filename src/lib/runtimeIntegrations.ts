import { QueryClient } from '@tanstack/react-query';
import { Workbox } from 'workbox-window';

export const createAppQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1
      }
    }
  });

export async function registerAppServiceWorker({
  supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  production = import.meta.env.PROD,
  register = async () => {
    const workbox = new Workbox('/sw.js');
    await workbox.register();
  }
}: {
  supported?: boolean;
  production?: boolean;
  register?: () => Promise<unknown>;
} = {}) {
  if (!supported) return 'unsupported';
  if (!production) return 'development';

  await register();
  return 'registered';
}
