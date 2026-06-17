export const shouldUseBackend = () =>
  typeof window !== 'undefined' && (import.meta as any).env?.MODE !== 'test';

export const apiRequest = async (path, options: RequestInit = {}) => {
  const { headers: optionHeaders, ...restOptions } = options;
  const headers = options.body
    ? { 'Content-Type': 'application/json', ...(optionHeaders || {}) }
    : optionHeaders;

  const response = await fetch(path, {
    ...restOptions,
    headers
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body;
};
