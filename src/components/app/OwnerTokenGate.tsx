import { useEffect, useState } from 'react';
import { apiRequest, storeOwnerToken } from '../../lib/api';
import { ThemedSurface } from '../ui/ThemedSurface';

type HealthResponse = { ok: boolean; authRequired?: boolean };

/**
 * Gates the app behind a single-owner token when the server is started with
 * `THE_MONASTERY_OWNER_TOKEN`. The health endpoint is unauthenticated and
 * reports `authRequired`; if set and the browser has no stored token, this
 * component overlays a minimal entry form. On submit the token is stored and
 * the page reloads so the bootstrapping sync runs with the new credential.
 *
 * The gate is non-blocking: children always render (so local-no-backend mode
 * and tests work), and the token form overlays only once auth is confirmed
 * required. On a gated server with no stored token every data request would
 * 401 during that brief window, so no profile data is exposed.
 */
export function OwnerTokenGate({ children }: { children: React.ReactNode }) {
  const [authRequired, setAuthRequired] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiRequest<HealthResponse>('/api/health')
      .then((data) => {
        if (cancelled) return;
        setAuthRequired(Boolean(data.authRequired));
        setHasToken(Boolean(localStorage.getItem('the-monastery_owner_token')));
      })
      .catch(() => {
        // Backend unreachable — let the app fall back to local mode.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!authRequired || hasToken) return <>{children}</>;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Enter the owner token.');
      return;
    }
    storeOwnerToken(trimmed);
    window.location.reload();
  };

  return (
    <>
      <div aria-hidden className="pointer-events-none opacity-0">
        {children}
      </div>
      <ThemedSurface variant="overlay" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <ThemedSurface
          role="dialog"
          aria-label="Owner token required"
          variant="modal"
          className="w-full max-w-sm rounded-xl border p-5 shadow-2xl"
        >
          <h3 className="text-base font-bold">Owner token required</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This server requires an owner token. Enter it to continue.
          </p>
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Owner token"
              aria-label="Owner token"
              autoFocus
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
            >
              Unlock
            </button>
          </form>
        </ThemedSurface>
      </ThemedSurface>
    </>
  );
}
