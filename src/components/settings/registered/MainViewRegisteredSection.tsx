import { useSettingsContext } from '../../../contexts/SettingsContext';
import {
  mainViewSlotContentDefinitions,
  mainViewSlotDefinitions,
  normalizeMainViewSlots,
  updateMainViewSlot
} from '../../../domain/mainView';
import type { MainViewSlotContentId } from '../../../domain/types';
import { SettingSection } from '../SettingSection';
import type { RegisteredSectionProps } from './types';

export default function MainViewRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings } = useSettingsContext();
  const slots = normalizeMainViewSlots(settings.mainViewSlots, settings.mainViewModules);

  return (
    <SettingSection id="main" title="Main view" {...props}>
      <div className="grid gap-3 sm:grid-cols-2">
        {mainViewSlotDefinitions.map(({ id, label }) => (
          <label key={id} className="ui-control flex flex-col gap-2 rounded-xl p-3 text-sm">
            <span className="font-semibold text-[var(--ui-text-primary)]">{label}</span>
            <select
              aria-label={`${label} quarter`}
              value={slots[id]}
              onChange={(event) => {
                const content = event.target.value as MainViewSlotContentId;
                setSettings((previous) => ({
                  ...previous,
                  mainViewSlots: updateMainViewSlot(
                    normalizeMainViewSlots(previous.mainViewSlots, previous.mainViewModules),
                    id,
                    content
                  )
                }));
              }}
              className="w-full rounded-lg border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] px-3 py-2 outline-none"
            >
              {mainViewSlotContentDefinitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="text-xs text-[var(--ui-text-secondary)]">
        Each quarter stays equal in size. Paired modules keep compact utilities together.
      </p>
    </SettingSection>
  );
}
