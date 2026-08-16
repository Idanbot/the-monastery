import { describe, expect, it } from 'vitest';
import { appSettingsSchema } from '../../shared/settingsContract';
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

  it('keeps the shared persisted settings contract aligned with normalized settings', () => {
    expect(appSettingsSchema.parse(defaultSettings)).toEqual(defaultSettings);
    expect(Object.keys(defaultSettings).every((key) => key in appSettingsSchema.shape)).toBe(true);

    for (const [key, schema] of Object.entries(appSettingsSchema.shape)) {
      if (!(key in defaultSettings)) expect(schema.safeParse(undefined).success).toBe(true);
    }
  });
});
