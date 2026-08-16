import { expect, it } from 'vitest';
import { settingsSectionRegistry, settingsSectionIds } from './settingsSectionRegistry';

it('registers every extracted settings section once', () => {
  expect(settingsSectionIds).toEqual([
    'appearance',
    'main',
    'media',
    'time',
    'board',
    'tags',
    'roles',
    'projects',
    'sidebar',
    'profiles',
    'integrations',
    'data'
  ]);
  expect(new Set(settingsSectionRegistry.map((section) => section.id)).size).toBe(
    settingsSectionRegistry.length
  );
  expect(settingsSectionRegistry.every((section) => typeof section.load === 'function')).toBe(true);
  expect(settingsSectionRegistry.every((section) => section.label && section.description)).toBe(true);
});
