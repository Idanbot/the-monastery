import { describe, expect, it } from 'vitest';
import { defaultMainViewModules, normalizeMainViewModules, updateMainViewModule } from './mainView';

describe('main view layout', () => {
  it('defaults to focus and activity in the middle with utilities on the right', () => {
    expect(defaultMainViewModules).toEqual([
      { id: 'focus', area: 'center', visible: true },
      { id: 'activity', area: 'center', visible: true },
      { id: 'calendar', area: 'right', visible: true },
      { id: 'media', area: 'right', visible: true },
      { id: 'clock', area: 'right', visible: true }
    ]);
  });

  it('preserves valid custom order and fills missing modules safely', () => {
    expect(
      normalizeMainViewModules([
        { id: 'activity', area: 'right', visible: false },
        { id: 'focus', area: 'center', visible: true },
        { id: 'unknown', area: 'center', visible: true }
      ])
    ).toEqual([
      { id: 'activity', area: 'right', visible: false },
      { id: 'focus', area: 'center', visible: true },
      { id: 'calendar', area: 'right', visible: true },
      { id: 'media', area: 'right', visible: true },
      { id: 'clock', area: 'right', visible: true }
    ]);
  });

  it('updates placement and visibility without losing module order', () => {
    const updated = updateMainViewModule(defaultMainViewModules, 'calendar', {
      area: 'center',
      visible: false
    });

    expect(updated.map((module) => module.id)).toEqual(defaultMainViewModules.map((module) => module.id));
    expect(updated.find((module) => module.id === 'calendar')).toEqual({
      id: 'calendar',
      area: 'center',
      visible: false
    });
  });
});
