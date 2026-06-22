import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../domain/tasks';
import { useImportFlows } from './useImportFlows';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

const makeJsonFile = (payload: unknown) =>
  new File([JSON.stringify(payload)], 'import.json', { type: 'application/json' });

function ImportHarness({ importPayload, planningPayload = null }) {
  const [tasks, setTasks] = useState([
    normalizeTask({ id: 'same', title: 'Same task' }),
    normalizeTask({ id: 'changed', title: 'Old title' })
  ]);
  const [settings, setSettings] = useState({
    ...defaultSettings,
    roles: [
      {
        id: 'role-existing',
        name: 'Cloud Architect',
        tags: ['cloud'],
        dailyTargetHours: 0,
        weeklyTargetHours: 2,
        monthlyTargetHours: 0
      }
    ],
    tagGoals: [
      {
        id: 'goal-existing',
        tag: 'cloud',
        dailyTargetHours: 0,
        weeklyTargetHours: 1,
        monthlyTargetHours: 0
      }
    ]
  });
  const [selectedTaskId, setSelectedTaskId] = useState('changed');
  const flows = useImportFlows({ tasks, setTasks, setSettings, setSelectedTaskId });

  return (
    <div>
      <div data-testid="task-titles">{tasks.map((task) => task.title).join('|')}</div>
      <div data-testid="selected-task">{selectedTaskId || 'none'}</div>
      <div data-testid="task-preview">
        {flows.importPreview
          ? String(flows.importPreview.newTasks.length) +
            '/' +
            String(flows.importPreview.updatedTasks.length) +
            '/' +
            String(flows.importPreview.unchangedTasks.length)
          : 'none'}
      </div>
      <div data-testid="planning-preview">
        {flows.planningImportPreview
          ? String(flows.planningImportPreview.newTasks.length) +
            '/' +
            String(flows.planningImportPreview.updatedTasks.length)
          : 'none'}
      </div>
      <div data-testid="roles">
        {settings.roles.map((role) => role.name + ':' + role.weeklyTargetHours).join('|')}
      </div>
      <div data-testid="goals">
        {settings.tagGoals.map((goal) => goal.tag + ':' + goal.weeklyTargetHours).join('|')}
      </div>
      <button onClick={() => flows.importTasks(makeJsonFile(importPayload))}>Import tasks</button>
      <button onClick={flows.confirmImportTasks}>Confirm tasks</button>
      <button onClick={() => flows.importPlanningData(makeJsonFile(planningPayload))}>Import planning</button>
      <button onClick={flows.confirmPlanningImport}>Confirm planning</button>
    </div>
  );
}

describe('useImportFlows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('previews new, updated, and unchanged task imports before merging', async () => {
    const user = userEvent.setup();
    const same = normalizeTask({ id: 'same', title: 'Same task' });
    const payload = {
      tasks: [same, { id: 'changed', title: 'New title' }, { id: 'new-task', title: 'Imported task' }]
    };

    render(<ImportHarness importPayload={payload} />);

    await user.click(screen.getByRole('button', { name: /import tasks/i }));
    await waitFor(() => expect(screen.getByTestId('task-preview')).toHaveTextContent('1/1/1'));

    await user.click(screen.getByRole('button', { name: /confirm tasks/i }));

    expect(screen.getByTestId('task-titles')).toHaveTextContent('Same task|New title|Imported task');
    expect(screen.getByTestId('selected-task')).toHaveTextContent('none');
    expect(screen.getByTestId('task-preview')).toHaveTextContent('none');
  });

  it('previews and confirms planning imports while replacing duplicate roles and tag goals', async () => {
    const user = userEvent.setup();
    const payload = {
      tasks: [
        { id: 'changed', title: 'Updated planning task' },
        { id: 'planning-new', title: 'New planning task' }
      ],
      roles: [
        { id: 'role-imported', name: 'Cloud Architect', tags: ['architecture'], weeklyTargetHours: 5 },
        { id: 'role-devops', name: 'DevOps', tags: ['platform'], weeklyTargetHours: 4 }
      ],
      goals: { cloud: { weeklyTargetHours: 3 }, platform: { weeklyTargetHours: 2 } }
    };

    render(<ImportHarness importPayload={{ tasks: [] }} planningPayload={payload} />);

    await user.click(screen.getByRole('button', { name: /import planning/i }));
    await waitFor(() => expect(screen.getByTestId('planning-preview')).toHaveTextContent('1/1'));

    await user.click(screen.getByRole('button', { name: /confirm planning/i }));

    expect(screen.getByTestId('task-titles')).toHaveTextContent(
      'Updated planning task|New planning task|Same task'
    );
    expect(screen.getByTestId('roles')).toHaveTextContent('Cloud Architect:5|DevOps:4');
    expect(screen.getByTestId('goals')).toHaveTextContent('cloud:3|platform:2');
    expect(screen.getByTestId('selected-task')).toHaveTextContent('none');
    expect(screen.getByTestId('planning-preview')).toHaveTextContent('none');
  });
});
