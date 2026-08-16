import { Calendar, Download, FileJson, Upload } from 'lucide-react';
import { useProfileContext } from '../../../contexts/ProfileContext';
import { SettingSection } from '../SettingSection';
import type { RegisteredSectionProps } from './types';

export default function DataRegisteredSection(props: RegisteredSectionProps) {
  const {
    exportTasks,
    backupData,
    exportTaskSchema,
    importInputRef,
    importTasks,
    importCalendarInputRef,
    importCalendarTasks,
    importPlanningInputRef,
    importPlanningData,
    localBackups,
    restoreLocalBackup,
    removeLocalBackup
  } = useProfileContext();
  const imports = [
    {
      label: 'Import',
      icon: Upload,
      ref: importInputRef,
      testId: 'tasks-import-input',
      accept: 'application/json,.json',
      importFile: importTasks
    },
    {
      label: 'Import ICS',
      icon: Calendar,
      ref: importCalendarInputRef,
      testId: 'ics-import-input',
      accept: 'text/calendar,.ics',
      importFile: importCalendarTasks
    },
    {
      label: 'Import planning',
      icon: Upload,
      ref: importPlanningInputRef,
      testId: 'planning-import-input',
      accept: 'application/json,.json',
      importFile: importPlanningData
    }
  ];

  return (
    <SettingSection id="data" title="Tasks Data" {...props}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" onClick={exportTasks} className="ui-secondary-button px-3 py-2 text-sm">
          <Download size={14} /> Export
        </button>
        <button type="button" onClick={backupData} className="ui-secondary-button px-3 py-2 text-sm">
          <Download size={14} /> Backup
        </button>
        {imports.map(({ label, icon: Icon, ref }) => (
          <button
            key={label}
            type="button"
            onClick={() => ref.current?.click()}
            className="ui-secondary-button px-3 py-2 text-sm"
          >
            <Icon size={14} /> {label}
          </button>
        ))}
        <button type="button" onClick={exportTaskSchema} className="ui-secondary-button px-3 py-2 text-sm">
          <FileJson size={14} /> Schema
        </button>
      </div>
      <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Local backup history
        </div>
        {localBackups.length === 0 && <div className="text-xs text-slate-400">No local backups yet.</div>}
        {localBackups.map((backup) => (
          <div key={backup.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-xs">
            <div className="min-w-0">
              <div className="truncate font-medium">{backup.profileName || backup.label}</div>
              <div className="text-slate-400">
                {new Date(backup.createdAt).toLocaleString()} · {backup.taskCount || 0} tasks
              </div>
            </div>
            <button
              type="button"
              onClick={() => restoreLocalBackup(backup.id)}
              className="ui-secondary-button px-2 py-1"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => removeLocalBackup(backup.id)}
              className="ui-secondary-button px-2 py-1 text-rose-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      {imports.map(({ ref, testId, accept, importFile }) => (
        <input
          key={testId}
          ref={ref}
          data-testid={testId}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) props.onClose?.();
            importFile(file);
          }}
        />
      ))}
    </SettingSection>
  );
}
