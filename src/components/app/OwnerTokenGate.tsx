import { useEffect, useState } from 'react';
import { ApiError, apiRequest, readOwnerToken, shouldUseBackend, storeOwnerToken } from '../../lib/api';
import { ThemedSurface } from '../ui/ThemedSurface';

type HealthResponse = { ok: boolean; authRequired?: boolean };
type GateState = 'checking' | 'open' | 'locked';

export function OwnerTokenGate({
  children,
  enabled = shouldUseBackend()
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [state, setState] = useState<GateState>(enabled ? 'checking' : 'open');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setState('open');
      return undefined;
    }

    let cancelled = false;
    const checkAccess = async () => {
      let health: HealthResponse;
      try {
        health = await apiRequest<HealthResponse>('/api/health');
      } catch {
        // Backend unreachable: preserve local/offline mode.
        if (!cancelled) setState('open');
        return;
      }

      if (!health.authRequired) {
        if (!cancelled) setState('open');
        return;
      }

      if (!readOwnerToken()) {
        if (!cancelled) setState('locked');
        return;
      }

      try {
        await apiRequest('/api/profiles');
        if (!cancelled) setState('open');
      } catch (validationError) {
        if (validationError instanceof ApiError && validationError.status === 401) {
          storeOwnerToken('');
          if (!cancelled) {
            setError('Stored owner token is no longer valid. Enter the current token.');
            setState('locked');
          }
          return;
        }
        if (!cancelled) {
          setError('Unable to verify the stored owner token.');
          setState('locked');
        }
      }
    };

    void checkAccess();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (state === 'open') return <>{children}</>;

  if (state === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">
        <div role="status" aria-live="polite">
          Checking access...
        </div>
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Enter the owner token.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest('/api/profiles', {
        headers: { Authorization: `Bearer ${trimmed}` }
      });
      storeOwnerToken(trimmed);
      setState('open');
    } catch (validationError) {
      setError(
        validationError instanceof ApiError && validationError.status === 401
          ? 'Owner token is not valid.'
          : 'Unable to verify the owner token.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        <form onSubmit={(event) => void submit(event)} className="mt-4 flex flex-col gap-3">
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Owner token"
            aria-label="Owner token"
            autoFocus
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          {error && (
            <p role="alert" className="text-xs text-rose-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </ThemedSurface>
    </ThemedSurface>
  );
}
