import { useEffect, useMemo, useState } from 'react';
import type { AppSettings } from '../../domain/types';
import type { TagTaxonomyCommand } from '../../domain/tagTaxonomy';
import { SettingSection } from './SettingSection';
import { SettingsSelect } from './SettingsSelect';

type Props = {
  settings: AppSettings;
  knownTags: string[];
  onCommand: (command: TagTaxonomyCommand) => void;
  openSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  motionDuration: number;
  motionEase: string | readonly number[];
};

const keyOf = (value: string) => value.trim().toLowerCase();

export function TagManagementSection({
  settings,
  knownTags,
  onCommand,
  openSections,
  toggleSection,
  motionDuration,
  motionEase
}: Props) {
  const tags = useMemo(() => knownTags.filter(Boolean), [knownTags]);
  const [selectedTag, setSelectedTag] = useState(tags[0] || '');
  const [renameValue, setRenameValue] = useState(selectedTag);
  const [mergeTarget, setMergeTarget] = useState('');
  const [aliasValue, setAliasValue] = useState('');

  useEffect(() => {
    if (selectedTag && tags.some((tag) => tag === selectedTag)) return;
    setSelectedTag(tags[0] || '');
  }, [selectedTag, tags]);

  useEffect(() => {
    setRenameValue(selectedTag);
    setMergeTarget(tags.find((tag) => tag !== selectedTag) || '');
  }, [selectedTag, tags]);

  const goal = settings.tagGoals.find((item) => keyOf(item.tag) === keyOf(selectedTag));
  const aliases = Object.entries(settings.tagAliases || {}).filter(
    ([, target]) => keyOf(target) === keyOf(selectedTag)
  );

  return (
    <SettingSection
      id="tags"
      title="Tags"
      openSections={openSections}
      toggleSection={toggleSection}
      motionDuration={motionDuration}
      motionEase={motionEase}
    >
      {tags.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400 dark:border-slate-700">
          No tags yet
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span>Manage tag</span>
            <SettingsSelect
              ariaLabel="Manage tag"
              value={selectedTag}
              onValueChange={setSelectedTag}
              options={tags.map((tag) => ({ id: tag, label: tag }))}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              aria-label="Rename selected tag"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="button"
              disabled={!renameValue.trim() || keyOf(renameValue) === keyOf(selectedTag)}
              onClick={() => {
                const target = renameValue.trim();
                setSelectedTag(target);
                onCommand({ type: 'rename', source: selectedTag, target });
              }}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Rename tag
            </button>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <SettingsSelect
              ariaLabel="Merge selected tag into"
              value={mergeTarget}
              onValueChange={setMergeTarget}
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              options={tags.filter((tag) => tag !== selectedTag).map((tag) => ({ id: tag, label: tag }))}
            />
            <button
              type="button"
              disabled={!mergeTarget}
              onClick={() => onCommand({ type: 'merge', source: selectedTag, target: mergeTarget })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-40 dark:border-slate-700"
            >
              Merge tags
            </button>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Aliases</div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                aria-label="New alias"
                value={aliasValue}
                onChange={(event) => setAliasValue(event.target.value)}
                placeholder="Alternative spelling"
                className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="button"
                disabled={!aliasValue.trim()}
                onClick={() => {
                  onCommand({ type: 'set-alias', alias: aliasValue.trim(), target: selectedTag });
                  setAliasValue('');
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-40 dark:border-slate-700"
              >
                Add alias
              </button>
            </div>
            {aliases.map(([alias]) => (
              <div key={alias} className="flex items-center justify-between gap-2 text-sm">
                <span>{alias}</span>
                <button
                  type="button"
                  aria-label={`Remove alias ${alias}`}
                  onClick={() => onCommand({ type: 'remove-alias', alias })}
                  className="rounded px-2 py-1 text-rose-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500">Roles</legend>
            {(settings.roles || []).map((role) => (
              <label key={role.id} className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  aria-label={`Connect ${role.name}`}
                  checked={role.tags.some((tag) => keyOf(tag) === keyOf(selectedTag))}
                  onChange={() => onCommand({ type: 'toggle-role', tag: selectedTag, roleId: role.id })}
                />
                <span>{role.name}</span>
              </label>
            ))}
            {settings.roles.length === 0 && <div className="text-xs text-slate-400">No roles.</div>}
          </fieldset>

          <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500">Goals</legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Daily', 'dailyTargetHours'],
                ['Weekly', 'weeklyTargetHours'],
                ['Monthly', 'monthlyTargetHours']
              ].map(([label, goalKey]) => (
                <label key={goalKey} className="flex flex-col gap-1 text-xs text-slate-500">
                  {label}
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    aria-label={`${label} goal for ${selectedTag}`}
                    value={goal?.[goalKey] || 0}
                    onChange={(event) =>
                      onCommand({
                        type: 'set-goal',
                        tag: selectedTag,
                        goal: goalKey as 'dailyTargetHours' | 'weeklyTargetHours' | 'monthlyTargetHours',
                        hours: Number(event.target.value)
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            aria-label="Delete selected tag"
            onClick={() => onCommand({ type: 'delete', tag: selectedTag })}
            className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-800 dark:text-rose-300"
          >
            Delete selected tag
          </button>
        </>
      )}
    </SettingSection>
  );
}
