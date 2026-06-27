import { Workbox } from 'workbox-window';

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
