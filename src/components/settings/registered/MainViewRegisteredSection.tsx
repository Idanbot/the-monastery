import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import { activityPetOptions } from '../../../domain/activityPets';
import {
  mainViewSlotContentDefinitions,
  mainViewSlotDefinitions,
  moveMainViewSlot,
  normalizeMainViewSlots,
  updateMainViewSlot
} from '../../../domain/mainView';
import type { ActivityPetId, MainViewSlotContentId } from '../../../domain/types';
import { SettingSection } from '../SettingSection';
import type { RegisteredSectionProps } from './types';

export default function MainViewRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings } = useSettingsContext();
  const slots = normalizeMainViewSlots(settings.mainViewSlots, settings.mainViewModules);

  return (
    <SettingSection id="main" title="Main view" {...props}>
      <div className="grid gap-3 sm:grid-cols-2">
        {mainViewSlotDefinitions.map(({ id, label }, index) => (
          <div key={id} className="ui-control flex flex-col gap-2 rounded-xl p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--ui-text-primary)]">{label}</span>
              <div className="ml-auto flex gap-1">
                <button
                  type="button"
                  aria-label={`Move ${label} earlier`}
                  disabled={index === 0}
                  onClick={() =>
                    setSettings((previous) => ({
                      ...previous,
                      mainViewSlots: moveMainViewSlot(
                        normalizeMainViewSlots(previous.mainViewSlots, previous.mainViewModules),
                        id,
                        'previous'
                      )
                    }))
                  }
                  className="ui-icon-button size-8 disabled:opacity-30"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${label} later`}
                  disabled={index === mainViewSlotDefinitions.length - 1}
                  onClick={() =>
                    setSettings((previous) => ({
                      ...previous,
                      mainViewSlots: moveMainViewSlot(
                        normalizeMainViewSlots(previous.mainViewSlots, previous.mainViewModules),
                        id,
                        'next'
                      )
                    }))
                  }
                  className="ui-icon-button size-8 disabled:opacity-30"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
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
          </div>
        ))}
      </div>
      <div className="ui-control grid gap-3 rounded-xl p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-[var(--ui-text-primary)]">
          Activity pet
          <select
            aria-label="Activity pet"
            value={settings.activityPetId || 'cat'}
            onChange={(event) => {
              const activityPetId = event.target.value as ActivityPetId;
              setSettings((previous) => ({
                ...previous,
                activityPetId
              }));
            }}
            className="rounded-lg border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] px-3 py-2 font-normal outline-none"
          >
            {activityPetOptions.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={settings.activityPetVisible !== false}
            onChange={(event) => {
              const activityPetVisible = event.target.checked;
              setSettings((previous) => ({ ...previous, activityPetVisible }));
            }}
            className="size-4 accent-[var(--ui-info)]"
          />
          Show pet
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={settings.activityFlameAnimationEnabled !== false}
            onChange={(event) => {
              const activityFlameAnimationEnabled = event.target.checked;
              setSettings((previous) => ({
                ...previous,
                activityFlameAnimationEnabled
              }));
            }}
            className="size-4 accent-[var(--ui-info)]"
          />
          Animate streak flame
        </label>
      </div>
      <p className="text-xs text-[var(--ui-text-secondary)]">
        Assign each quarter directly or use the arrows to swap its position.
      </p>
    </SettingSection>
  );
}
