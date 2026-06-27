import { describe, expect, it } from 'vitest';
import { defaultSettings } from './tasks';
import { normalizeSchemaSettings, settingDefinitions } from './settingsSchema';

describe('settings schema', () => {
  it('keeps schema defaults aligned with application defaults', () => {
    for (const definition of settingDefinitions) {
      expect(definition.defaultValue).toEqual(defaultSettings[definition.key]);
    }
  });

  it('normalizes bounded and enumerated values through one interface', () => {
    expect(
      normalizeSchemaSettings({
        layoutPreset: 'invalid',
        modalBlur: 500,
        resizeHandleThickness: 0,
        showSeconds: 0
      })
    ).toMatchObject({
      layoutPreset: 'compact',
      modalBlur: 64,
      resizeHandleThickness: 1,
      showSeconds: false
    });
  });
});
