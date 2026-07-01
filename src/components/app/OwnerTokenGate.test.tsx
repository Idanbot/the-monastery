import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OwnerTokenGate } from './OwnerTokenGate';

describe('OwnerTokenGate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not mount protected children while authentication is being checked', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined))
    );

    render(
      <OwnerTokenGate enabled>
        <div>Protected workspace</div>
      </OwnerTokenGate>
    );

    expect(screen.getByRole('status')).toHaveTextContent(/checking access/i);
    expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
  });

  it('clears an invalid stored token and returns to the unlock form', async () => {
    localStorage.setItem('the-monastery_owner_token', 'expired-token');
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, authRequired: true })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Owner token required.' })
      });
    vi.stubGlobal('fetch', fetch);

    render(
      <OwnerTokenGate enabled>
        <div>Protected workspace</div>
      </OwnerTokenGate>
    );

    expect(await screen.findByRole('dialog', { name: /owner token required/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/stored owner token is no longer valid/i);
    expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
    expect(localStorage.getItem('the-monastery_owner_token')).toBeNull();
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        '/api/profiles',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer expired-token' })
        })
      )
    );
  });

  it('validates and stores a newly entered token before opening the workspace', async () => {
    const user = userEvent.setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, authRequired: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ profiles: [] })
      });
    vi.stubGlobal('fetch', fetch);

    render(
      <OwnerTokenGate enabled>
        <div>Protected workspace</div>
      </OwnerTokenGate>
    );

    await user.type(await screen.findByLabelText('Owner token', { exact: true }), 'current-token');
    await user.click(screen.getByRole('button', { name: /unlock/i }));

    expect(await screen.findByText('Protected workspace')).toBeInTheDocument();
    expect(localStorage.getItem('the-monastery_owner_token')).toBe('current-token');
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/profiles',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer current-token' })
      })
    );
  });

  it('stays locked when token validation cannot reach an auth-enabled backend', async () => {
    localStorage.setItem('the-monastery_owner_token', 'stored-token');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ ok: true, authRequired: true })
        })
        .mockRejectedValueOnce(new Error('connection lost'))
    );

    render(
      <OwnerTokenGate enabled>
        <div>Protected workspace</div>
      </OwnerTokenGate>
    );

    expect(await screen.findByRole('dialog', { name: /owner token required/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/unable to verify the stored owner token/i);
    expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
  });
});
