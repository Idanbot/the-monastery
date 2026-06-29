import { z } from 'zod';

export const revisionSchema = z.number().int().nonnegative();
export const mutationResponseSchema = z.object({ ok: z.literal(true), revision: revisionSchema });
export const taskRecordSchema = z.record(z.string(), z.unknown());
export const tasksResponseSchema = z.object({ tasks: z.array(taskRecordSchema), revision: revisionSchema });
export const settingsResponseSchema = z.object({
  settings: z.record(z.string(), z.unknown()).nullable(),
  revision: revisionSchema
});
export const profileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    taskCount: z.number().int().nonnegative().optional()
  })
  .passthrough();
export const profilesResponseSchema = z.object({ profiles: z.array(profileSchema) });
export const profileResponseSchema = z.object({ profile: profileSchema });
export const okResponseSchema = z.object({ ok: z.literal(true) }).passthrough();
export const backupResponseSchema = z.record(z.string(), z.unknown());

export const apiPaths = {
  profiles: '/api/profiles',
  profile: (profileId: string) => `/api/profiles/${encodeURIComponent(profileId)}`,
  tasks: (profileId: string) => `/api/profiles/${encodeURIComponent(profileId)}/tasks`,
  task: (profileId: string, taskId: string) =>
    `/api/profiles/${encodeURIComponent(profileId)}/tasks/${encodeURIComponent(taskId)}`,
  settings: (profileId: string) => `/api/profiles/${encodeURIComponent(profileId)}/settings`,
  resetProfile: (profileId: string) => `/api/profiles/${encodeURIComponent(profileId)}/reset`,
  backup: '/api/backup'
} as const;

export type TasksResponse = z.infer<typeof tasksResponseSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type ProfilesResponse = z.infer<typeof profilesResponseSchema>;
export type MutationResponse = z.infer<typeof mutationResponseSchema>;

export const contractResponse = <T>(schema: z.ZodType<T>, value: T): T => schema.parse(value);
