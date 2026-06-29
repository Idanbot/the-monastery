export const shouldUseBackend = () =>
  typeof window !== 'undefined' && (import.meta as any).env?.MODE !== 'test';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiRequest = async <T = unknown>(
  path: string,
  options: RequestInit = {},
  responseSchema?: ZodType<T>
): Promise<T> => {
  const { headers: optionHeaders, ...restOptions } = options;
  const headers = options.body
    ? { 'Content-Type': 'application/json', ...(optionHeaders || {}) }
    : optionHeaders;

  const response = await fetch(path, {
    ...restOptions,
    headers
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error || 'Request failed.', response.status, body);
  return responseSchema ? responseSchema.parse(body) : (body as T);
};
import type { ZodType } from 'zod';
