import type { AppSettings, TaskStatus } from '../../domain/types';
import { defaultBoardColumnOrder, statusLabels } from '../../domain/tasks';
import { SettingSection } from './SettingSection';
import { SchemaSettingField } from './SchemaSettingField';
import { SettingsSelect } from './SettingsSelect';

type Props = {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  openSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  motionDuration: number;
  motionEase: string | readonly number[];
};

export function BoardSettingsSection({
  settings,
  setSettings,
  openSections,
  toggleSection,
  motionDuration,
  motionEase
}: Props) {
  const order = settings.boardColumnOrder || defaultBoardColumnOrder;
  const updateSetting = (key: keyof AppSettings, value: unknown) =>
    setSettings((previous) => ({ ...previous, [key]: value }) as AppSettings);
  const updateOrder = (key: keyof AppSettings['boardColumnOrder'], value: TaskStatus[]) =>
    setSettings((previous) => ({
      ...previous,
      boardColumnOrder: { ...previous.boardColumnOrder, [key]: value }
    }));
  const setPairFirst = (key: 'compactActive' | 'compactDone', pair: TaskStatus[], first: TaskStatus) =>
    updateOrder(key, [first, pair.find((status) => status !== first)!]);
  const setThreePairFirst = (pair: TaskStatus[], first: TaskStatus, offset: number) => {
    const next = [...order.threeColumn];
    next.splice(offset, 2, first, pair.find((status) => status !== first)!);
    updateOrder('threeColumn', next);
  };
  const toggleCollapsedLane = (status: TaskStatus) =>
    setSettings((previous) => {
      const collapsed = previous.collapsedBoardLanes || [];
      return {
        ...previous,
        collapsedBoardLanes: collapsed.includes(status)
          ? collapsed.filter((item) => item !== status)
          : [...collapsed, status]
      };
    });
  const moveFullLane = (status: TaskStatus, direction: number) => {
    const index = order.full.indexOf(status);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= order.full.length) return;
    const next = [...order.full];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateOrder('full', next);
  };

  return (
    <SettingSection
      id="board"
      title="Board"
      openSections={openSections}
      toggleSection={toggleSection}
      motionDuration={motionDuration}
      motionEase={motionEase}
    >
      <SchemaSettingField
        settingKey="layoutPreset"
        settings={settings}
        updateSetting={updateSetting}
        optionLabels={{
          compact: 'Compact: 2 split columns',
          'three-column': '3 columns: active + outcomes',
          full: 'Full: 4 columns'
        }}
      />
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Lane order</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LaneSelect
            label="Compact active top"
            value={order.compactActive[0]}
            options={['backlog', 'in-progress']}
            onChange={(value) => setPairFirst('compactActive', ['backlog', 'in-progress'], value)}
          />
          <LaneSelect
            label="Compact outcome top"
            value={order.compactDone[0]}
            options={['done', 'rejected']}
            onChange={(value) => setPairFirst('compactDone', ['done', 'rejected'], value)}
          />
          <LaneSelect
            label="3-column active first"
            value={order.threeColumn[0]}
            options={['backlog', 'in-progress']}
            onChange={(value) => setThreePairFirst(['backlog', 'in-progress'], value, 0)}
          />
          <LaneSelect
            label="3-column outcome top"
            value={order.threeColumn[2]}
            options={['done', 'rejected']}
            onChange={(value) => setThreePairFirst(['done', 'rejected'], value, 2)}
          />
        </div>
        <div className="space-y-2">
          <span className="text-sm text-slate-700 dark:text-slate-300">Full layout order</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {order.full.map((status, index) => (
              <div
                key={status}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="font-medium">
                  {index + 1}. {statusLabels[status]}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${statusLabels[status]} left`}
                    onClick={() => moveFullLane(status, -1)}
                    disabled={index === 0}
                    className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-700"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${statusLabels[status]} right`}
                    onClick={() => moveFullLane(status, 1)}
                    disabled={index === order.full.length - 1}
                    className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-700"
                  >
                    Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SchemaSettingField
        settingKey="resizeHandleVisible"
        settings={settings}
        updateSetting={updateSetting}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SchemaSettingField
          settingKey="resizeHandleThickness"
          settings={settings}
          updateSetting={updateSetting}
        />
        <SchemaSettingField
          settingKey="resizeHandleLength"
          settings={settings}
          updateSetting={updateSetting}
        />
        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>Color</span>
          <input
            aria-label="Resize bar color"
            type="color"
            value={settings.resizeHandleColor}
            onChange={(event) => updateSetting('resizeHandleColor', event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
      </div>
      <fieldset className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500">
          Collapsed lanes
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(['backlog', 'in-progress', 'done', 'rejected'] as TaskStatus[]).map((status) => (
            <label
              key={status}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <input
                type="checkbox"
                aria-label={`Collapse ${statusLabels[status]} lane`}
                checked={(settings.collapsedBoardLanes || []).includes(status)}
                onChange={() => toggleCollapsedLane(status)}
              />
              <span>{statusLabels[status]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <SchemaSettingField settingKey="collapseTasks" settings={settings} updateSetting={updateSetting} />
      <SchemaSettingField
        settingKey="autoPromoteNextTask"
        settings={settings}
        updateSetting={updateSetting}
      />
    </SettingSection>
  );
}

function LaneSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: TaskStatus;
  options: TaskStatus[];
  onChange: (value: TaskStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <SettingsSelect
        ariaLabel={`${label} lane`}
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as TaskStatus)}
        options={options.map((status) => ({ id: status, label: statusLabels[status] }))}
      />
    </div>
  );
}
