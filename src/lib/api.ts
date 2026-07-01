import type { ZodType } from 'zod';

export const shouldUseBackend = () => typeof window !== 'undefined' && import.meta.env.MODE !== 'test';

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

const ownerTokenStorageKey = 'the-monastery_owner_token';

/**
 * Owner token used to authenticate API requests when the server is started
 * with `THE_MONASTERY_OWNER_TOKEN`. Stored in localStorage after the user
 * enters it via the token gate. Returns an empty string when no token is set.
 */
export const readOwnerToken = (): string => {
  if (typeof localStorage === 'undefined') return '';
  try {
    return localStorage.getItem(ownerTokenStorageKey) || '';
  } catch {
    return '';
  }
};

export const storeOwnerToken = (token: string) => {
  if (typeof localStorage === 'undefined') return;
  try {
    if (token) localStorage.setItem(ownerTokenStorageKey, token);
    else localStorage.removeItem(ownerTokenStorageKey);
  } catch {
    // localStorage may be unavailable (private mode); the token simply won't persist.
  }
};

const authHeader = (): Record<string, string> => {
  const token = readOwnerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiRequest = async <T = unknown>(
  path: string,
  options: RequestInit = {},
  responseSchema?: ZodType<T>
): Promise<T> => {
  const { headers: optionHeaders, ...restOptions } = options;
  const headers = options.body
    ? { 'Content-Type': 'application/json', ...authHeader(), ...(optionHeaders || {}) }
    : { ...authHeader(), ...(optionHeaders || {}) };

  const response = await fetch(path, {
    ...restOptions,
    headers
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error || 'Request failed.', response.status, body);
  return responseSchema ? responseSchema.parse(body) : (body as T);
};
