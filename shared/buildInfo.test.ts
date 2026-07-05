import { describe, expect, it } from 'vitest';
import { formatBuildVersion } from './buildInfo.js';

describe('formatBuildVersion', () => {
  it('uses the workflow run number as a short automatic revision', () => {
    expect(formatBuildVersion('1.0.0', '42')).toBe('1.0.42');
    expect(formatBuildVersion('2.7.3', '0009')).toBe('2.7.9');
  });

  it('uses a clear local identifier when no CI revision is available', () => {
    expect(formatBuildVersion('1.0.0')).toBe('1.0.dev');
    expect(formatBuildVersion('1.0.0', 'not-a-run')).toBe('1.0.dev');
  });
});
