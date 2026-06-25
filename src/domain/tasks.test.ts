import { describe, expect, it } from 'vitest';
import {
  defaultSettings,
  getNextRecurringDate,
  mergeSettings,
  normalizePlanningImportPayload,
  normalizeTask,
  normalizeTasksPayload,
  taskMatchesSearch
} from './tasks';

describe('task domain helpers', () => {
  it('normalizes partial task input with safe defaults', () => {
    expect(normalizeTask({ title: 'Study', urgency: 99 })).toMatchObject({
      title: 'Study',
      status: 'backlog',
      urgency: 10,
      tags: [],
      recurrence: 'none',
      recurrenceRootId: null
    });
  });

  it('normalizes export payloads', () => {
    const tasks = normalizeTasksPayload({ tasks: [{ id: 'a', title: 'A' }] });

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ id: 'a', title: 'A' });
  });

  it('normalizes imported task note aliases into note activity', () => {
    const tasks = normalizeTasksPayload({
      tasks: [
        {
          title: 'Learn React',
          note: 'Watch intro video: https://youtube.com/watch?v=abc',
          notes: [
            { title: 'Course page', url: 'https://course.example/react' },
            { text: 'Read docs', url: 'https://react.dev/learn' }
          ]
        }
      ]
    });

    expect(tasks[0].activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'note', text: 'Watch intro video: https://youtube.com/watch?v=abc' }),
        expect.objectContaining({ type: 'note', text: `Course page\nhttps://course.example/react` }),
        expect.objectContaining({ type: 'note', text: `Read docs\nhttps://react.dev/learn` })
      ])
    );
  });

  it('normalizes planning imports with tasks, roles, tags, and goals', () => {
    const planning = normalizePlanningImportPayload({
      tasks: [{ id: 'task-a', title: 'Ship importer', tags: ['import'], notes: ['Implementation note'] }],
      roles: [{ id: 'role-a', name: 'Builder', tags: ['build'], weeklyTargetHours: 6 }],
      tags: ['monk', 'import'],
      goals: { monk: { dailyTargetHours: 1 }, learning: 3 }
    });

    expect(planning.tasks[0]).toMatchObject({ id: 'task-a', title: 'Ship importer', tags: ['import'] });
    expect(planning.tasks[0].activity[0]).toMatchObject({ type: 'note', text: 'Implementation note' });
    expect(planning.roles[0]).toEqual({
      id: 'role-a',
      name: 'Builder',
      tags: ['build'],
      dailyTargetHours: 0,
      weeklyTargetHours: 6,
      monthlyTargetHours: 0
    });
    expect(planning.tags).toEqual(expect.arrayContaining(['monk', 'import', 'build', 'learning']));
    expect(planning.tagGoals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tag: 'monk', dailyTargetHours: 1 }),
        expect.objectContaining({ tag: 'learning', weeklyTargetHours: 3 })
      ])
    );
  });

  it('normalizes a simple imported list as task titles', () => {
    const planning = normalizePlanningImportPayload(['Read paper', 'Write notes']);

    expect(planning.tasks.map((task) => task.title)).toEqual(['Read paper', 'Write notes']);
    expect(planning.roles).toEqual([]);
  });

  it('calculates next recurring dates without UTC day drift', () => {
    expect(getNextRecurringDate('2026-06-17', 'daily')).toBe('2026-06-18');
    expect(getNextRecurringDate('2026-06-17', 'weekly')).toBe('2026-06-24');
    expect(getNextRecurringDate('2026-06-17', 'monthly')).toBe('2026-07-17');
  });

  it('searches task, activity, and subtask text', () => {
    const task = normalizeTask({
      title: 'Backend API',
      tags: ['node'],
      activity: [{ id: 'a', type: 'note', text: 'OAuth detail', timestamp: new Date().toISOString() }],
      subtasks: [
        { id: 's', title: 'SQL migration', status: 'backlog', logs: [], activeLogStart: null, tags: ['db'] }
      ]
    });

    expect(taskMatchesSearch(task, 'oauth')).toBe(true);
    expect(taskMatchesSearch(task, 'migration')).toBe(true);
    expect(taskMatchesSearch(task, 'frontend')).toBe(false);
  });

  it('merges settings with role target defaults', () => {
    const settings = mergeSettings({ roles: [{ id: 'r', name: 'Role', tags: ['x'] }] });

    expect(settings.roles[0]).toEqual({
      id: 'r',
      name: 'Role',
      tags: ['x'],
      dailyTargetHours: 0,
      weeklyTargetHours: 0,
      monthlyTargetHours: 0
    });
  });

  it('merges tag goals with cadence defaults', () => {
    const settings = mergeSettings({ tagGoals: [{ id: 'tg', tag: 'python', weeklyTargetHours: 4 }] });

    expect(settings.tagGoals[0]).toEqual({
      id: 'tg',
      tag: 'python',
      dailyTargetHours: 0,
      weeklyTargetHours: 4,
      monthlyTargetHours: 0
    });
  });

  it('uses Liquid Glass readability defaults for a clean profile', () => {
    expect(defaultSettings.visualTheme).toBe('liquid-glass');
    expect(defaultSettings.modalBlur).toBe(1);
    expect(defaultSettings.modalTransparency).toBe(35);
  });

  it('normalizes visual control settings with safe defaults and bounds', () => {
    const settings = mergeSettings({
      clockBackgroundVisible: false,
      modalBlur: 12,
      clockTextColor: '  #111111  ',
      clockBackgroundColor: '  #eeeeee  ',
      clockDisplayMode: 'analog',
      resizeHandleVisible: false,
      resizeHandleThickness: -1,
      resizeHandleLength: -1,
      resizeHandleColor: '  #ff2d55  ',
      timelineHourLinesVisible: false,
      colorScheme: { main: ' #007aff ', secondary: ' #34c759 ', text: ' #1d1d1f ' },
      timelineNowLineVisible: false
    });

    expect(settings.modalBlur).toBe(12);
    expect(settings.clockTextColor).toBe('#111111');
    expect(settings.clockBackgroundColor).toBe('#eeeeee');
    expect(settings.clockDisplayMode).toBe('analog');
    expect(settings.colorScheme.text).toBe('#1d1d1f');
    expect(settings.clockBackgroundVisible).toBe(false);
    expect(settings.resizeHandleVisible).toBe(false);
    expect(settings.resizeHandleThickness).toBe(1);
    expect(settings.resizeHandleLength).toBe(1);
    expect(settings.resizeHandleColor).toBe('#ff2d55');
    expect(settings.timelineHourLinesVisible).toBe(false);
    expect(settings.timelineNowLineVisible).toBe(false);
  });
});
