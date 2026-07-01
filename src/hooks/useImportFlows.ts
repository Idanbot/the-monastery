import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { parseIcsTasks } from '../domain/calendar';
import { normalizePlanningImportPayload } from '../domain/tasks';
import { migrateStoredTasks } from '../domain/dataMigrations';
import type { AppSettings, ImportPreview, PlanningImportPreview, Task } from '../domain/types';

export function useImportFlows({
  tasks,
  setTasks,
  setSettings,
  setSelectedTaskId
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [planningImportPreview, setPlanningImportPreview] = useState<PlanningImportPreview | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importCalendarInputRef = useRef<HTMLInputElement>(null);
  const importPlanningInputRef = useRef<HTMLInputElement>(null);

  const importCalendarTasks = async (file: File) => {
    if (!file) return;
    try {
      const imported = parseIcsTasks(await file.text());
      setImportPreview({
        imported,
        newTasks: imported,
        updatedTasks: [],
        unchangedTasks: []
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not import calendar file.');
    } finally {
      if (importCalendarInputRef.current) importCalendarInputRef.current.value = '';
    }
  };

  const importTasks = async (file: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const imported = migrateStoredTasks(JSON.parse(text));
      const currentById = new Map(tasks.map((task) => [task.id, task]));
      const newTasks = imported.filter((task) => !currentById.has(task.id));
      const updatedTasks = imported.filter((task) => {
        const current = currentById.get(task.id);
        return current && JSON.stringify(current) !== JSON.stringify(task);
      });
      const unchangedTasks = imported.filter((task) => {
        const current = currentById.get(task.id);
        return current && JSON.stringify(current) === JSON.stringify(task);
      });

      setImportPreview({ imported, newTasks, updatedTasks, unchangedTasks });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not import tasks.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const confirmImportTasks = () => {
    if (!importPreview) return;
    const imported = importPreview.imported;
    setTasks((prev) => {
      const importedIds = new Set(imported.map((task) => task.id));
      return [...imported, ...prev.filter((task) => !importedIds.has(task.id))];
    });
    setSelectedTaskId(null);
    setImportPreview(null);
    toast.success('Tasks imported.');
  };

  const importPlanningData = async (file: File) => {
    if (!file) return;
    try {
      const imported = normalizePlanningImportPayload(JSON.parse(await file.text()));
      const currentTasksById = new Map(tasks.map((task) => [task.id, task]));
      const newTasks = imported.tasks.filter((task) => !currentTasksById.has(task.id));
      const updatedTasks = imported.tasks.filter((task) => {
        const current = currentTasksById.get(task.id);
        return current && JSON.stringify(current) !== JSON.stringify(task);
      });
      setPlanningImportPreview({ ...imported, newTasks, updatedTasks });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not import planning data.');
    } finally {
      if (importPlanningInputRef.current) importPlanningInputRef.current.value = '';
    }
  };

  const confirmPlanningImport = () => {
    if (!planningImportPreview) return;
    const importedTasks = planningImportPreview.tasks || [];
    const importedTaskIds = new Set(importedTasks.map((task) => task.id));
    setTasks((previous) => [...importedTasks, ...previous.filter((task) => !importedTaskIds.has(task.id))]);
    setSettings((previous) => {
      const roleKeys = new Set(
        (planningImportPreview.roles || []).flatMap((role) => [role.id, role.name.toLowerCase()])
      );
      const goalTags = new Set((planningImportPreview.tagGoals || []).map((goal) => goal.tag.toLowerCase()));
      return {
        ...previous,
        roles: [
          ...(planningImportPreview.roles || []),
          ...(previous.roles || []).filter(
            (role) => !roleKeys.has(role.id) && !roleKeys.has(String(role.name || '').toLowerCase())
          )
        ],
        tagGoals: [
          ...(planningImportPreview.tagGoals || []),
          ...(previous.tagGoals || []).filter((goal) => !goalTags.has(String(goal.tag || '').toLowerCase()))
        ]
      };
    });
    setSelectedTaskId(null);
    setPlanningImportPreview(null);
    toast.success('Planning data imported.');
  };

  return {
    importPreview,
    setImportPreview,
    planningImportPreview,
    setPlanningImportPreview,
    importInputRef,
    importCalendarInputRef,
    importPlanningInputRef,
    importTasks,
    importCalendarTasks,
    importPlanningData,
    confirmImportTasks,
    confirmPlanningImport
  };
}
