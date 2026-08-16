import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useTaskContext } from '../../../contexts/TaskContext';
import { generateId } from '../../../domain/ids';
import { createRoleFromPreset, rolePresets } from '../../../domain/rolePresets';
import { parseTagString } from '../../../domain/tags';
import type { GoalCadence, RoleDefinition, TagGoal } from '../../../domain/types';
import { TagPicker } from '../../tag-picker/TagPicker';
import { Button } from '../../ui/Button';
import { SettingSection } from '../SettingSection';
import { SettingsSelect } from '../SettingsSelect';
import type { RegisteredSectionProps } from './types';

type GoalKey = keyof GoalCadence;

function GoalInputs({
  value,
  labels,
  onChange
}: {
  value: GoalCadence;
  labels: readonly string[];
  onChange: (key: GoalKey, value: number) => void;
}) {
  const keys: GoalKey[] = ['dailyTargetHours', 'weeklyTargetHours', 'monthlyTargetHours'];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key, index) => (
        <label key={key} className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          {labels[index]}
          <input
            type="number"
            min="0"
            step="0.25"
            value={value[key] || 0}
            onChange={(event) => onChange(key, Math.max(0, Number(event.target.value) || 0))}
            className="ui-input w-full px-2 py-1.5 text-xs"
          />
        </label>
      ))}
    </div>
  );
}

export default function RolesRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings, addRole, updateRole, removeRole } = useSettingsContext();
  const { tagPool = [], createRoleRoutineTasks } = useTaskContext();
  const roleTagValues = useMemo(
    () => Object.fromEntries(settings.roles.map((role) => [role.id, role.tags.join(', ')])),
    [settings.roles]
  );
  const [roleTagDrafts, setRoleTagDrafts] = useState(roleTagValues);
  const [selectedRolePresetId, setSelectedRolePresetId] = useState(rolePresets[0].id);

  useEffect(() => setRoleTagDrafts(roleTagValues), [roleTagValues]);

  const updateTagGoal = (goalId: string, updates: Partial<TagGoal>) =>
    setSettings((previous) => ({
      ...previous,
      tagGoals: previous.tagGoals.map((goal) => (goal.id === goalId ? { ...goal, ...updates } : goal))
    }));

  return (
    <SettingSection id="roles" title="Roles" {...props}>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <SettingsSelect
          ariaLabel="Role preset"
          value={selectedRolePresetId}
          onValueChange={setSelectedRolePresetId}
          options={rolePresets.map((preset) => ({ id: preset.id, label: preset.name }))}
        />
        <Button
          onClick={() => {
            const preset = rolePresets.find((item) => item.id === selectedRolePresetId) || rolePresets[0];
            setSettings((previous) => ({
              ...previous,
              roles: [...previous.roles, createRoleFromPreset(preset)]
            }));
          }}
          variant="secondary"
        >
          <Plus size={13} /> Preset
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={addRole} variant="secondary" size="sm">
          <Plus size={13} /> Add
        </Button>
        <Button
          onClick={createRoleRoutineTasks}
          disabled={settings.roles.length === 0}
          variant="secondary"
          size="sm"
        >
          Create routines
        </Button>
      </div>
      <div className="space-y-3">
        {settings.roles.map((role: RoleDefinition) => (
          <div key={role.id} className="ui-control space-y-2 rounded-lg p-3">
            <div className="flex gap-2">
              <input
                aria-label={`Role name ${role.name}`}
                value={role.name}
                onChange={(event) => updateRole(role.id, { name: event.target.value })}
                className="ui-input min-w-0 flex-1 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeRole(role.id)}
                className="ui-icon-button text-slate-400 hover:text-rose-600"
                title="Remove role"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <TagPicker
              value={roleTagDrafts[role.id] ?? ''}
              onChange={(nextValue) =>
                setRoleTagDrafts((previous) => ({ ...previous, [role.id]: nextValue }))
              }
              onCommit={(nextValue) => updateRole(role.id, { tags: parseTagString(nextValue) })}
              placeholder="python, docker, backend"
              tagPool={tagPool}
              className="text-slate-600 dark:text-slate-300"
              inputClassName="bg-white dark:bg-slate-950"
            />
            <GoalInputs
              value={role}
              labels={['Daily h', 'Weekly h', 'Monthly h']}
              onChange={(key, value) => updateRole(role.id, { [key]: value })}
            />
          </div>
        ))}
        <div className="ui-control space-y-2 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tag goals</div>
            <button
              type="button"
              aria-label="Add tag goal"
              onClick={() =>
                setSettings((previous) => ({
                  ...previous,
                  tagGoals: [
                    ...previous.tagGoals,
                    {
                      id: generateId(),
                      tag: '',
                      dailyTargetHours: 0,
                      weeklyTargetHours: 0,
                      monthlyTargetHours: 0
                    }
                  ]
                }))
              }
              className="ui-icon-button size-8"
            >
              <Plus size={13} />
            </button>
          </div>
          {settings.tagGoals.map((goal) => (
            <div
              key={goal.id}
              className="grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-white p-2 dark:bg-slate-950"
            >
              <div className="space-y-2">
                <input
                  aria-label="Tag goal"
                  value={goal.tag}
                  placeholder="tag"
                  onChange={(event) => updateTagGoal(goal.id, { tag: event.target.value })}
                  className="ui-input w-full px-3 py-2 text-sm"
                />
                <GoalInputs
                  value={goal}
                  labels={['D', 'W', 'M']}
                  onChange={(key, value) => updateTagGoal(goal.id, { [key]: value })}
                />
              </div>
              <button
                type="button"
                aria-label={`Delete ${goal.tag || 'tag'} goal`}
                onClick={() =>
                  setSettings((previous) => ({
                    ...previous,
                    tagGoals: previous.tagGoals.filter((item) => item.id !== goal.id)
                  }))
                }
                className="ui-icon-button self-start text-slate-400 hover:text-rose-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {settings.tagGoals.length === 0 && <div className="text-xs text-slate-400">No tag goals.</div>}
        </div>
        {settings.roles.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400 dark:border-slate-700">
            No roles defined
          </div>
        )}
      </div>
    </SettingSection>
  );
}
