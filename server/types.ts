export type Task = Record<string, unknown>;

export type ProfileRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  task_count: number;
};

export type SettingsRow = {
  settings_json: string;
};

export type ServerOptions = {
  dbPath?: string;
  publicDir?: string;
  logger?: boolean | { level?: string; redact?: string[] };
};
