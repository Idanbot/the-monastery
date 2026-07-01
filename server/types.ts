import type { RateLimitPluginOptions } from '@fastify/rate-limit';

export type Task = Record<string, unknown>;

export type ProfileRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  task_count: number;
  revision?: number;
};

export type SettingsRow = {
  settings_json: string;
};

export type ServerOptions = {
  dbPath?: string;
  publicDir?: string;
  logger?: boolean | { level?: string; redact?: string[] };
  apiRateLimit?: RateLimitPluginOptions | false;
  /** Override the owner-token gate (defaults to `THE_MONASTERY_OWNER_TOKEN` env). */
  ownerToken?: string;
  /** Override the request body size limit in bytes (default 1 MiB). */
  bodyLimit?: number;
};
