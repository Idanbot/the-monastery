export const fetchWithTimeout = async (url, timeoutMs = 5_000, fetchImpl = globalThis.fetch) => {
  const controller = new globalThis.AbortController();
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      controller.abort();
      reject(new Error(`Timed out requesting ${url}`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([fetchImpl(url, { signal: controller.signal }), timeout]);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};
