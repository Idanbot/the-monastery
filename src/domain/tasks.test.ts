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
import { applyTagTaxonomyCommand, canonicalizeTags } from './tagTaxonomy';

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

  it('normalizes auto promotion setting', () => {
    expect(mergeSettings({ autoPromoteNextTask: true }).autoPromoteNextTask).toBe(true);
    expect(mergeSettings({}).autoPromoteNextTask).toBe(false);
  });

  it('normalizes durable tag inventory and board focus settings', () => {
    const settings = mergeSettings({
      tagInventory: [' Python ', 'python', '', 'Cloud'],
      mobileFocusMode: true,
      collapsedBoardLanes: ['done', 'invalid', 'done', 'backlog']
    });

    expect(settings.tagInventory).toEqual(['Python', 'Cloud']);
    expect(settings.mobileFocusMode).toBe(true);
    expect(settings.collapsedBoardLanes).toEqual(['done', 'backlog']);
  });

  it('normalizes persisted board column order', () => {
    const settings = mergeSettings({
      boardColumnOrder: {
        compactActive: ['in-progress'],
        compactDone: ['rejected'],
        threeColumn: ['in-progress', 'backlog', 'rejected'],
        full: ['done', 'backlog', 'done', 'unknown']
      }
    });

    expect(settings.boardColumnOrder.compactActive).toEqual(['in-progress', 'backlog']);
    expect(settings.boardColumnOrder.compactDone).toEqual(['rejected', 'done']);
    expect(settings.boardColumnOrder.threeColumn).toEqual(['in-progress', 'backlog', 'rejected', 'done']);
    expect(settings.boardColumnOrder.full).toEqual(['done', 'backlog', 'in-progress', 'rejected']);
  });
});

describe('tag taxonomy commands', () => {
  it('renames a tag across tasks, subtasks, roles, goals, inventory, and aliases', () => {
    const task = normalizeTask({
      id: 'task',
      title: 'Trace service',
      tags: ['otel'],
      subtasks: [
        {
          id: 'subtask',
          title: 'Add spans',
          status: 'backlog',
          tags: ['otel'],
          logs: [],
          activeLogStart: null
        }
      ]
    });
    const settings = mergeSettings({
      tagInventory: ['otel', 'backend'],
      tagAliases: { tracing: 'otel' },
      roles: [
        {
          id: 'sre',
          name: 'SRE',
          tags: ['otel'],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        }
      ],
      tagGoals: [{ id: 'goal', tag: 'otel', weeklyTargetHours: 3 }]
    });

    const result = applyTagTaxonomyCommand([task], settings, {
      type: 'rename',
      source: 'otel',
      target: 'observability'
    });

    expect(result.tasks[0].tags).toEqual(['observability']);
    expect(result.tasks[0].subtasks[0].tags).toEqual(['observability']);
    expect(result.settings.tagInventory).toEqual(['observability', 'backend']);
    expect(result.settings.roles[0].tags).toEqual(['observability']);
    expect(result.settings.tagGoals[0].tag).toBe('observability');
    expect(result.settings.tagAliases).toEqual({ tracing: 'observability' });
  });

  it('canonicalizes aliases and manages role links, goals, and deletion', () => {
    const initial = mergeSettings({
      tagInventory: ['observability'],
      roles: [
        {
          id: 'sre',
          name: 'SRE',
          tags: [],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        }
      ]
    });
    const aliased = applyTagTaxonomyCommand([], initial, {
      type: 'set-alias',
      alias: 'otel',
      target: 'observability'
    });
    expect(canonicalizeTags(['otel', 'Observability'], aliased.settings.tagAliases)).toEqual([
      'observability'
    ]);

    const linked = applyTagTaxonomyCommand(aliased.tasks, aliased.settings, {
      type: 'toggle-role',
      tag: 'observability',
      roleId: 'sre'
    });
    expect(linked.settings.roles[0].tags).toEqual(['observability']);

    const goal = applyTagTaxonomyCommand(linked.tasks, linked.settings, {
      type: 'set-goal',
      tag: 'observability',
      goal: 'weeklyTargetHours',
      hours: 5
    });
    expect(goal.settings.tagGoals[0]).toMatchObject({
      tag: 'observability',
      weeklyTargetHours: 5
    });

    const deleted = applyTagTaxonomyCommand(
      [normalizeTask({ id: 'tagged', title: 'Tagged', tags: ['observability'] })],
      goal.settings,
      { type: 'delete', tag: 'observability' }
    );
    expect(deleted.tasks[0].tags).toEqual([]);
    expect(deleted.settings.tagInventory).toEqual([]);
    expect(deleted.settings.roles[0].tags).toEqual([]);
    expect(deleted.settings.tagGoals).toEqual([]);
    expect(deleted.settings.tagAliases).toEqual({});
  });

  it('merges duplicate tag goals and keeps the source as an alias', () => {
    const settings = mergeSettings({
      tagInventory: ['otel', 'observability'],
      tagGoals: [
        { id: 'otel-goal', tag: 'otel', dailyTargetHours: 1 },
        { id: 'observability-goal', tag: 'observability', weeklyTargetHours: 4 }
      ]
    });

    const result = applyTagTaxonomyCommand([], settings, {
      type: 'merge',
      source: 'otel',
      target: 'observability'
    });

    expect(result.settings.tagInventory).toEqual(['observability']);
    expect(result.settings.tagAliases).toEqual({ otel: 'observability' });
    expect(result.settings.tagGoals).toHaveLength(1);
    expect(result.settings.tagGoals[0]).toMatchObject({
      tag: 'observability',
      dailyTargetHours: 1,
      weeklyTargetHours: 4
    });
  });

  it('removes aliases, disconnects roles, and updates existing goals', () => {
    const settings = mergeSettings({
      tagInventory: ['observability'],
      tagAliases: { otel: 'observability' },
      roles: [
        {
          id: 'sre',
          name: 'SRE',
          tags: ['observability'],
          dailyTargetHours: 0,
          weeklyTargetHours: 0,
          monthlyTargetHours: 0
        }
      ],
      tagGoals: [{ id: 'goal', tag: 'observability', weeklyTargetHours: 2 }]
    });

    const withoutAlias = applyTagTaxonomyCommand([], settings, {
      type: 'remove-alias',
      alias: 'OTEL'
    });
    expect(withoutAlias.settings.tagAliases).toEqual({});

    const disconnected = applyTagTaxonomyCommand([], withoutAlias.settings, {
      type: 'toggle-role',
      tag: 'observability',
      roleId: 'sre'
    });
    expect(disconnected.settings.roles[0].tags).toEqual([]);

    const updated = applyTagTaxonomyCommand([], disconnected.settings, {
      type: 'set-goal',
      tag: 'observability',
      goal: 'weeklyTargetHours',
      hours: -3
    });
    expect(updated.settings.tagGoals[0].weeklyTargetHours).toBe(0);
  });
});
