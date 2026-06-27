import type { AppSettings, Task } from './types';
import { mergeSettings, normalizeTasksPayload } from './tasks';

export const currentDataSchemaVersion = 2;

const schemaVersionOf = (value: unknown) =>
  value &&
  typeof value === 'object' &&
  typeof (value as { schemaVersion?: unknown }).schemaVersion === 'number'
    ? (value as { schemaVersion: number }).schemaVersion
    : 0;

const assertSupported = (value: unknown) => {
  if (schemaVersionOf(value) > currentDataSchemaVersion) {
    throw new Error('This data was created by a newer version of TheMonastery.');
  }
};

export const migrateStoredTasks = (value: unknown): Task[] => {
  assertSupported(value);
  const payload =
    value && !Array.isArray(value) && typeof value === 'object' && 'data' in value
      ? (value as { data: unknown }).data
      : value;
  return normalizeTasksPayload(payload);
};

export const migrateStoredSettings = (value: unknown): AppSettings => {
  assertSupported(value);
  const payload =
    value && typeof value === 'object' && 'data' in value ? (value as { data: unknown }).data : value;
  return mergeSettings(payload);
};

export const migrateProfileData = (value: unknown) => {
  assertSupported(value);
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    schemaVersion: currentDataSchemaVersion,
    tasks: migrateStoredTasks(source.tasks || []),
    settings: migrateStoredSettings(source.settings || {})
  };
};

export const createStoredEnvelope = <T>(data: T) => ({ schemaVersion: currentDataSchemaVersion, data });
