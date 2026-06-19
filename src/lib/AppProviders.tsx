import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createAppQueryClient } from './runtimeIntegrations';

const appQueryClient = createAppQueryClient();

export function AppProviders({
  children,
  client = appQueryClient
}: {
  children: ReactNode;
  client?: QueryClient;
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
