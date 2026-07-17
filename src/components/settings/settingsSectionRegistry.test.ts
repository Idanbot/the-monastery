import { expect, it } from 'vitest';
import { settingsSectionRegistry, settingsSectionIds } from './settingsSectionRegistry';

it('registers every extracted settings section once', () => {
  expect(settingsSectionIds).toEqual([
    'main',
    'time',
    'board',
    'tags',
    'projects',
    'sidebar',
    'integrations'
  ]);
  expect(new Set(settingsSectionRegistry.map((section) => section.id)).size).toBe(
    settingsSectionRegistry.length
  );
  expect(settingsSectionRegistry.every((section) => typeof section.load === 'function')).toBe(true);
});
