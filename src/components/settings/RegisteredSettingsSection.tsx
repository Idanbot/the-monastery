import { lazy, Suspense, type ComponentType } from 'react';
import { settingsSectionRegistry, type RegisteredSettingsSectionId } from './settingsSectionRegistry';
import type { RegisteredSectionProps } from './registered/types';

const components = Object.fromEntries(
  settingsSectionRegistry.map(({ id, load }) => [
    id,
    lazy(load as () => Promise<{ default: ComponentType<RegisteredSectionProps> }>)
  ])
) as unknown as Record<RegisteredSettingsSectionId, ComponentType<RegisteredSectionProps>>;

export function RegisteredSettingsSection({
  id,
  ...props
}: RegisteredSectionProps & { id: RegisteredSettingsSectionId }) {
  const Component = components[id];
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-700">
          Loading settings...
        </div>
      }
    >
      <Component {...props} />
    </Suspense>
  );
}
