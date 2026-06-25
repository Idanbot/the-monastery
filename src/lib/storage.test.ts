import { beforeEach, describe, expect, it } from 'vitest';
import { parseStoredJson } from './storage';

describe('storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('parses stored JSON or returns the fallback for missing and invalid data', () => {
    expect(parseStoredJson('missing', ['fallback'])).toEqual(['fallback']);

    localStorage.setItem('valid', JSON.stringify({ ok: true }));
    expect(parseStoredJson('valid', null)).toEqual({ ok: true });

    localStorage.setItem('invalid', '{bad');
    expect(parseStoredJson('invalid', { safe: true })).toEqual({ safe: true });
  });
});
