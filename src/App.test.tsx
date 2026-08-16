import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {
  clickNewTask,
  makeTask,
  mockDesktopMedia,
  resetAppTestState,
  seedSettings,
  seedTasks
} from './test/appTestHarness';

beforeEach(resetAppTestState);

it('renders a tiny app version indicator', async () => {
  render(<App />);

  expect(screen.getByTestId('app-version-chip')).toHaveTextContent('v' + __APP_VERSION__);
  expect(__APP_VERSION__).toMatch(/^1\.0\.(?:dev|\d+)$/);
  expect(screen.getByTestId('app-version-chip')).not.toHaveTextContent(/fe|be|frontend|backend/i);
});

it('keeps the desktop header focused on primary actions', () => {
  render(<App />);

  expect(screen.getByRole('button', { name: /open command palette/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
  const createTaskButton = screen.getByLabelText('Backlog task', { selector: 'button' });
  expect(createTaskButton).toHaveTextContent(/^Task$/);
  expect(createTaskButton.querySelector('svg')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /hide clock|show clock/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /shortcuts & guide/i })).not.toBeInTheDocument();
  expect(screen.queryByText('Online')).not.toBeInTheDocument();
});

it('keeps global actions, workspace controls, and current work in one responsive toolbar', async () => {
  const user = userEvent.setup();
  seedTasks([
    makeTask({
      id: 'active-header-task',
      title: 'Design migration boundary',
      status: 'in-progress',
      activeLogStart: '2026-07-14T08:00:00.000Z'
    })
  ]);
  render(<App />);

  const primaryBar = screen.getByTestId('app-primary-bar');
  const workspaceToolbar = screen.getByTestId('workspace-toolbar');
  expect(primaryBar).toContainElement(workspaceToolbar);
  expect(primaryBar.closest('header')).toHaveAttribute('data-layout', 'single-row');
  expect(within(workspaceToolbar).getByRole('group', { name: 'Workspace views' })).toBeInTheDocument();
  expect(
    within(workspaceToolbar).getByRole('textbox', {
      name: 'Search tasks, notes, roles, and projects'
    })
  ).toBeInTheDocument();
  const currentWork = screen.getByRole('button', { name: /open current work design migration boundary/i });
  expect(currentWork).toBeInTheDocument();

  await user.click(currentWork);
  expect(screen.getByTestId('task-modal')).toBeInTheDocument();
});

it('opens the customizable TheMonastery main workspace', async () => {
  mockDesktopMedia();
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByRole('heading', { name: /themonastery/i })).toBeInTheDocument();
  await user.click(screen.getByTestId('view-switch-main'));
  expect(screen.getByTestId('main-workspace')).toBeInTheDocument();
  expect(screen.getByTestId('main-focus-module')).toBeInTheDocument();
  expect(screen.getByTestId('main-activity-module')).toBeInTheDocument();
  expect(screen.getByTestId('main-calendar-module')).toBeInTheDocument();
});

it('filters commands in the command palette', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('{Control>}k{/Control}');
  await user.type(screen.getByPlaceholderText(/search commands/i), 'analytics');

  const palette = screen.getByRole('dialog', { name: /command palette/i });
  expect(within(palette).getByText(/go to analytics/i)).toBeInTheDocument();
  expect(within(palette).queryByRole('option', { name: /new focus task/i })).not.toBeInTheDocument();
});

it('opens the command palette from the header control', async () => {
  const user = userEvent.setup();
  seedTasks([makeTask({ title: 'Palette command target' })]);
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open command palette/i }));

  expect(screen.getByRole('dialog', { name: /command palette/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /start timer: palette command target/i })).toBeInTheDocument();
});

it('renders analytics with a chart component', async () => {
  const user = userEvent.setup();
  seedTasks([makeTask({ id: 'done-task', title: 'Done task', status: 'done' })]);
  render(<App />);

  await user.click(screen.getByTestId('view-switch-dashboard'));

  expect(await screen.findByTestId('analytics-status-chart', {}, { timeout: 5000 })).toBeInTheDocument();
});

it('returns to the main workspace when the logo is clicked', async () => {
  mockDesktopMedia();
  const user = userEvent.setup();
  seedTasks([makeTask({ id: 'done-task', title: 'Done task', status: 'done' })]);
  render(<App />);

  await user.click(screen.getByTestId('view-switch-dashboard'));
  expect(await screen.findByTestId('analytics-status-chart', {}, { timeout: 5000 })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /go to main view/i }));
  expect(screen.getByTestId('main-workspace')).toBeInTheDocument();
  expect(screen.getByTestId('main-focus-module')).toBeInTheDocument();
});

it('shows virtualized mobile task list', async () => {
  const user = userEvent.setup();
  seedTasks([makeTask({ id: 'one', title: 'One' }), makeTask({ id: 'two', title: 'Two', status: 'done' })]);
  render(<App />);

  await user.click(screen.getByRole('button', { name: /list/i }));

  const taskList = screen.getByTestId('virtualized-task-list');
  expect(taskList).toBeInTheDocument();
  expect(within(taskList).getByText(/^One$/)).toBeInTheDocument();
});

it('shows the breathing intro before monk mode focus controls', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /enter monk mode/i }));

  expect(screen.getByTestId('one-breath')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /skip breathing intro/i })).toBeInTheDocument();
});

it('suggests tags from the task title and role graph as clickable chips', async () => {
  const user = userEvent.setup();
  seedSettings({
    roles: [
      {
        id: 'role-cloud',
        name: 'Cloud Architect',
        tags: ['gcp', 'gke', 'networking'],
        dailyTargetHours: 0,
        weeklyTargetHours: 3,
        monthlyTargetHours: 0
      }
    ]
  });
  render(<App />);

  await clickNewTask(user);
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'GKE migration plan' } });

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /add suggested tag gke/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add suggested tag gcp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add suggested tag networking/i })).toBeInTheDocument();
  });

  await user.click(screen.getByRole('button', { name: /add suggested tag gke/i }));
  await user.click(screen.getByRole('button', { name: /add suggested tag gcp/i }));
  await user.click(screen.getByRole('button', { name: /add suggested tag networking/i }));

  await waitFor(() => {
    expect(screen.getByPlaceholderText(/backend, high priority/i)).toHaveValue('gke, gcp, networking');
  });
}, 20_000);

it('opens a focus planning flow and applies selected work into today', async () => {
  const user = userEvent.setup();
  seedSettings({
    roles: [
      {
        id: 'role-backend',
        name: 'Senior Backend',
        tags: ['backend'],
        dailyTargetHours: 0,
        weeklyTargetHours: 4,
        monthlyTargetHours: 0
      }
    ]
  });
  seedTasks([
    makeTask({
      id: 'unscheduled',
      title: 'Unscheduled',
      status: 'in-progress',
      tags: ['backend'],
      scheduledDate: '',
      scheduledStart: ''
    }),
    makeTask({
      id: 'backlog-plan',
      title: 'Backlog candidate',
      status: 'backlog',
      tags: ['backend'],
      urgency: 9,
      scheduledDate: '',
      scheduledStart: ''
    })
  ]);
  render(<App />);

  await user.click(screen.getByRole('button', { name: /plan day/i }));
  expect(screen.getByRole('region', { name: /focus planning/i })).toBeInTheDocument();
  expect(screen.getByText(/role balance: senior backend 2/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /apply focus plan/i }));
  await waitFor(() => {
    expect(screen.getByTestId('timeline-task-Unscheduled')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-task-Backlog candidate')).toBeInTheDocument();
  });
});

it('opens keyboard shortcut help with question mark', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('?');

  const dialog = screen.getByRole('dialog', { name: /keyboard shortcuts/i });
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getByText(/plan day/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/command palette/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/ctrl\+k/i)).toBeInTheDocument();
});

it('uses a modal command palette backdrop and closes cleanly with Escape', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.keyboard('{Control>}k{/Control}');
  expect(screen.getByTestId('command-palette-overlay')).toHaveClass('modal-overlay');

  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.getByTestId('command-palette-overlay')).toHaveClass('hidden'));
  expect(screen.queryByRole('dialog', { name: /keyboard shortcuts/i })).not.toBeInTheDocument();
});

it('shows weekly role balance insight', async () => {
  const user = userEvent.setup();
  seedSettings({
    roles: [
      {
        id: 'role-python',
        name: 'Python',
        tags: ['python'],
        dailyTargetHours: 0,
        weeklyTargetHours: 5,
        monthlyTargetHours: 0
      }
    ]
  });
  seedTasks([
    makeTask({
      id: 'tracked',
      title: 'Tracked',
      tags: ['python'],
      logs: [{ start: new Date(Date.now() - 3600000).toISOString(), end: new Date().toISOString() }]
    })
  ]);
  render(<App />);

  await user.click(screen.getByRole('button', { name: /analytics/i }));

  expect(await screen.findByText(/weekly role balance/i)).toBeInTheDocument();
  expect(screen.getByText(/4.0h left/i)).toBeInTheDocument();
});

it('stores local backup history from settings backup', async () => {
  const user = userEvent.setup();
  seedTasks([makeTask({ title: 'Backup me' })]);
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(await screen.findByRole('button', { name: /^tasks data$/i }));
  await user.click(screen.getByRole('button', { name: /^backup$/i }));

  expect(screen.getByText(/local backup history/i)).toBeInTheDocument();
  expect(screen.getByText(/1 tasks/i)).toBeInTheDocument();
}, 20_000);

it('auto-promotes the next backlog task when completing current work', async () => {
  const user = userEvent.setup();
  seedSettings({ autoPromoteNextTask: true });
  seedTasks([
    makeTask({ id: 'active', title: 'Active task', status: 'in-progress' }),
    makeTask({ id: 'next', title: 'Next high urgency', status: 'backlog', urgency: 9 }),
    makeTask({ id: 'later', title: 'Later low urgency', status: 'backlog', urgency: 2 })
  ]);
  render(<App />);

  const pin = screen.getByTestId('current-task-pin');
  expect(pin).toHaveTextContent('Active task');

  await user.click(within(pin).getByRole('button', { name: /^done$/i }));

  await waitFor(() => expect(screen.getByTestId('current-task-pin')).toHaveTextContent('Next high urgency'));
  expect(screen.getByTestId('board-column-in-progress')).toHaveTextContent('Next high urgency');
});

it('shows mobile board controls that persist layout and compact lane order', async () => {
  const user = userEvent.setup();
  render(<App />);

  const controls = screen.getByTestId('mobile-board-controls');
  await user.click(within(controls).getByText(/board layout/i));
  await user.selectOptions(within(controls).getByLabelText(/mobile board layout/i), 'full');

  expect(screen.getByTestId('kanban-board')).toHaveAttribute('data-layout-preset', 'full');

  await user.click(within(controls).getByRole('button', { name: /customize lane order/i }));
  await user.selectOptions(within(controls).getByLabelText(/compact active top lane/i), 'in-progress');
  await user.selectOptions(within(controls).getByLabelText(/mobile board layout/i), 'compact');

  const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
  expect(headings.slice(0, 2)).toEqual(['In-Progress', 'Backlog']);
});

it('uses the mobile shell for focus, tasks, and task creation', async () => {
  const user = userEvent.setup();
  render(<App />);

  const shell = screen.getByTestId('mobile-shell');
  await user.click(within(shell).getByRole('button', { name: 'Focus' }));
  expect(screen.getByTestId('mobile-focus-view')).toBeInTheDocument();

  await user.click(within(shell).getByRole('button', { name: 'Tasks' }));
  expect(screen.queryByTestId('mobile-focus-view')).not.toBeInTheDocument();
  expect(screen.getByTestId('kanban-board')).toBeInTheDocument();

  await user.click(within(shell).getByRole('button', { name: 'Create task' }));
  expect(screen.getByTestId('task-modal')).toBeInTheDocument();
});

it('shows a recovery notice when backend sync is unavailable', async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.getByTestId('sync-recovery-notice')).toHaveTextContent(/local mode/i);
  });
});

it('adds a backlog task to the board', async () => {
  const user = userEvent.setup();
  render(<App />);

  await clickNewTask(user);

  expect(screen.getAllByText(/untitled task/i).length).toBeGreaterThan(0);
});

it('deletes a task from the task modal', async () => {
  const user = userEvent.setup();
  seedTasks();
  render(<App />);

  await user.click(screen.getAllByText(/design database schema/i)[0]);
  await user.click(screen.getByRole('button', { name: /delete task/i }));
  await user.click(screen.getByRole('button', { name: /^delete$/i }));

  expect(screen.queryByText(/design database schema/i)).not.toBeInTheDocument();
});

it('saves task edits from the modal', async () => {
  const user = userEvent.setup();
  seedTasks();
  render(<App />);

  await user.click(screen.getAllByText(/design database schema/i)[0]);
  const titleInput = screen.getByDisplayValue(/design database schema/i);
  await user.clear(titleInput);
  await user.type(titleInput, 'Build API');
  expect(screen.getByTestId('task-save-state')).toHaveTextContent(/unsaved changes/i);
  await user.click(screen.getByRole('button', { name: /save task/i }));

  expect(screen.getAllByText(/build api/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/design database schema/i)).not.toBeInTheDocument();
});

it('creates a task from smart quick add input', async () => {
  const user = userEvent.setup();
  seedSettings({
    roles: [
      {
        id: 'role-cloud',
        name: 'Cloud Architect',
        tags: ['gcp', 'gke', 'networking'],
        dailyTargetHours: 0,
        weeklyTargetHours: 3,
        monthlyTargetHours: 0
      }
    ]
  });
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText(/quick add/i), {
    target: { value: 'GKE migration tomorrow 9-10 #cloud !7 https://example.com/course' }
  });
  await user.click(screen.getByRole('button', { name: /^add$/i }));

  expect(screen.getByDisplayValue(/gke migration/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/backend, high priority/i)).toHaveValue(
    'cloud, gke, migration, gcp, networking'
  );
  expect(screen.getByLabelText(/start/i)).toHaveValue('09:00');
  expect(screen.getByLabelText(/^end$/i)).toHaveValue('10:00');
  await user.click(screen.getByRole('button', { name: /activity/i }));
  expect(screen.getByText('https://example.com/course')).toBeInTheDocument();
});

it('autosaves task title edits without pressing save', async () => {
  const user = userEvent.setup();
  seedTasks();
  render(<App />);

  await user.click(screen.getAllByText(/design database schema/i)[0]);
  const titleInput = screen.getByDisplayValue(/design database schema/i);
  await user.clear(titleInput);
  await user.type(titleInput, 'Autosaved API Design');

  await waitFor(
    () => {
      expect(screen.getByTestId('task-save-state')).toHaveTextContent(/^Saved/i);
    },
    { timeout: 2500 }
  );
  await user.click(screen.getByTitle(/close/i));

  expect(screen.getAllByText(/autosaved api design/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/design database schema/i)).not.toBeInTheDocument();
});

it('prompts before closing dirty modal edits and can discard them', async () => {
  const user = userEvent.setup();
  seedTasks();
  render(<App />);

  await user.click(screen.getAllByText(/design database schema/i)[0]);
  await user.click(screen.getByRole('button', { name: /^notes$/i }));
  await user.type(screen.getByPlaceholderText(/add a note/i), 'Unsaved note');
  await user.click(screen.getByRole('button', { name: /^discard$/i }));

  expect(screen.getByText(/save changes\?/i)).toBeInTheDocument();
  expect(screen.getByTestId('task-save-state')).toHaveTextContent(/unsaved changes/i);
  await user.click(screen.getAllByRole('button', { name: /^discard$/i }).at(-1)!);

  expect(screen.getAllByText(/design database schema/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/unsaved note/i)).not.toBeInTheDocument();
});

it('filters tasks by tag', () => {
  seedTasks([makeTask(), makeTask({ id: 'frontend-task', title: 'Frontend polish', tags: ['Frontend'] })]);
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /filters/i }));
  fireEvent.click(screen.getByRole('option', { name: /^frontend$/i }));

  expect(screen.getAllByText(/frontend polish/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/design database schema/i)).not.toBeInTheDocument();
});

it('adds task tags from the fuzzy tag pool', async () => {
  const user = userEvent.setup();
  render(<App />);

  await clickNewTask(user);
  await user.type(screen.getByLabelText(/title/i), 'Python study');
  await user.click(screen.getByRole('button', { name: /add suggested tag python/i }));
  await user.type(screen.getByRole('textbox', { name: /find tag/i }), 'py');
  await user.click(screen.getByRole('button', { name: /^pytorch$/i }));
  await user.click(screen.getByRole('button', { name: /save task/i }));

  await user.click(screen.getByRole('button', { name: /filters/i }));
  await user.click(screen.getByRole('option', { name: /^python$/i }));

  expect(screen.getAllByText(/python study/i).length).toBeGreaterThan(0);
}, 15_000);

it('persists a custom task tag in the known tag inventory', async () => {
  const user = userEvent.setup();
  render(<App />);

  await clickNewTask(user);
  const tagsInput = screen.getByPlaceholderText(/backend, high priority/i);
  await user.clear(tagsInput);
  await user.type(tagsInput, 'architecture-review');
  fireEvent.blur(tagsInput);
  await user.click(screen.getByRole('button', { name: /save task/i }));

  await user.click(screen.getByRole('button', { name: /filters/i }));
  await user.type(screen.getByRole('combobox', { name: /search known tags/i }), 'architecture');
  expect(screen.getByRole('option', { name: 'architecture-review' })).toBeInTheDocument();
});

it('shows only current and in-progress work in mobile focus mode', async () => {
  const user = userEvent.setup();
  seedSettings({ mobileFocusMode: true });
  seedTasks([
    makeTask({
      id: 'current',
      title: 'Current migration',
      status: 'in-progress',
      activeLogStart: '2026-06-28T08:00:00.000Z'
    }),
    makeTask({ id: 'next', title: 'Next migration', status: 'in-progress' }),
    makeTask({ id: 'backlog', title: 'Later migration', status: 'backlog' })
  ]);
  render(<App />);

  const focusView = screen.getByTestId('mobile-focus-view');
  expect(within(focusView).getByText('Current migration')).toBeInTheDocument();
  expect(within(focusView).getByText('Next migration')).toBeInTheDocument();
  expect(within(focusView).queryByText('Later migration')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /show full mobile board/i }));
  expect(screen.getByTestId('mobile-board-controls')).toBeInTheDocument();
});

it('controls current work from the mobile focus surface', async () => {
  const user = userEvent.setup();
  seedSettings({ mobileFocusMode: true });
  seedTasks([
    makeTask({ id: 'current', title: 'Current focus', status: 'in-progress' }),
    makeTask({ id: 'next', title: 'Next focus', status: 'in-progress' })
  ]);
  render(<App />);

  await user.click(screen.getByRole('button', { name: /start current task/i }));
  expect(screen.getByRole('button', { name: /stop current task/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /start next task/i }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /open current task next focus/i })).toBeInTheDocument();
  });

  await user.click(screen.getByRole('button', { name: /reject current task/i }));
  await waitFor(() => {
    expect(screen.getByTestId('board-column-rejected')).toHaveTextContent('Next focus');
  });

  await user.click(screen.getByRole('button', { name: /complete current task/i }));
  await waitFor(() => {
    expect(screen.getByTestId('board-column-done')).toHaveTextContent('Current focus');
  });
});

it('canonicalizes task tag aliases when saving', async () => {
  const user = userEvent.setup();
  seedSettings({
    tagInventory: ['observability'],
    tagAliases: { otel: 'observability' }
  });
  render(<App />);

  await clickNewTask(user);
  await user.type(screen.getByLabelText(/title/i), 'Trace API');
  const tagsInput = screen.getByPlaceholderText(/backend, high priority/i);
  await user.clear(tagsInput);
  await user.type(tagsInput, 'otel');
  await user.click(screen.getByRole('button', { name: /save task/i }));

  await user.click(screen.getAllByText('Trace API')[0]);
  expect(screen.getByPlaceholderText(/backend, high priority/i)).toHaveValue('observability');
});

it('opens the keyboard-focused board task with j and Enter', async () => {
  const user = userEvent.setup();
  seedTasks([
    makeTask({ id: 'first-task', title: 'First task' }),
    makeTask({ id: 'second-task', title: 'Second task' })
  ]);
  render(<App />);

  await user.keyboard('j');
  await user.keyboard('{Enter}');

  expect(screen.getByDisplayValue(/second task/i)).toBeInTheDocument();
});

it('shows role and tag analytics from tracked tag time', async () => {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  seedTasks([
    makeTask({
      id: 'tracked-python',
      title: 'Python study',
      status: 'done',
      urgency: 5,
      tags: ['python'],
      logs: [{ start: oneHourAgo, end: new Date().toISOString() }]
    })
  ]);
  seedSettings({
    roles: [
      {
        id: 'role-devops',
        name: 'DevOps',
        tags: ['python'],
        dailyTargetHours: 0,
        weeklyTargetHours: 5,
        monthlyTargetHours: 0
      },
      {
        id: 'role-backend',
        name: 'Backend',
        tags: ['python'],
        dailyTargetHours: 0,
        weeklyTargetHours: 5,
        monthlyTargetHours: 0
      }
    ]
  });

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByTestId('view-switch-dashboard'));

  expect(screen.getByText(/role radar/i)).toBeInTheDocument();
  expect(screen.getByText(/tag hours/i)).toBeInTheDocument();
  expect(screen.getAllByText(/^python$/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/^devops$/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/^backend$/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/1\.00h/i).length).toBeGreaterThanOrEqual(3);
});

it('searches tasks and supports the mobile list view', async () => {
  const user = userEvent.setup();
  render(<App />);

  await clickNewTask(user);
  const titleInput = screen.getByLabelText(/title/i);
  await user.type(titleInput, 'Frontend polish');
  await user.click(screen.getByRole('button', { name: /save task/i }));

  await user.click(screen.getByRole('button', { name: /list/i }));
  await user.type(
    screen.getAllByRole('textbox', { name: /search tasks, notes, roles, and projects/i }).at(-1)!,
    'frontend'
  );

  const taskList = screen.getByRole('list', { name: /task list/i });
  expect(within(taskList).getByText(/frontend polish/i)).toBeInTheDocument();
  expect(within(taskList).queryByText(/design database schema/i)).not.toBeInTheDocument();

  await user.click(within(taskList).getByRole('button', { name: /start frontend polish/i }));
  await waitFor(() => expect(screen.getByTestId('current-task-pin')).toHaveTextContent('Frontend polish'));

  await user.click(within(taskList).getByRole('button', { name: /complete frontend polish/i }));
  await waitFor(() =>
    expect(screen.getByTestId('current-task-pin')).toHaveTextContent('No active task pinned')
  );
});

it('creates the next instance when a recurring task is completed', async () => {
  const user = userEvent.setup();
  render(<App />);

  await clickNewTask(user);
  const titleInput = screen.getByLabelText(/title/i);
  await user.type(titleInput, 'Daily practice');
  await user.selectOptions(screen.getByLabelText(/status/i), 'done');
  await user.selectOptions(screen.getByLabelText(/repeat/i), 'daily');
  await user.click(screen.getByRole('button', { name: /save task/i }));

  await waitFor(() => {
    expect(screen.getAllByText(/daily practice/i).length).toBeGreaterThanOrEqual(2);
  });
});

it('adds a manual time log from the task modal', async () => {
  const user = userEvent.setup();
  seedTasks();
  render(<App />);

  await user.click(screen.getAllByText(/design database schema/i)[0]);
  await user.click(screen.getByRole('button', { name: /timer/i }));
  await user.click(screen.getByRole('button', { name: /add log/i }));

  expect(screen.getByTitle(/delete log/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /save task/i }));
  await user.click(screen.getByTestId('view-switch-dashboard'));

  expect(screen.getByText(/total tracked/i)).toBeInTheDocument();
  expect(screen.getAllByText(/30m/i).length).toBeGreaterThan(0);
});

it('previews imported task conflicts before merging', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(await screen.findByRole('button', { name: /^tasks data$/i }));

  const importFile = new File(
    [
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        tasks: [
          {
            id: 'imported-task',
            title: 'Imported task',
            status: 'backlog',
            urgency: 4,
            tags: ['imported'],
            scheduledDate: '',
            scheduledStart: '',
            scheduledEnd: '',
            recurrence: 'none',
            recurrenceRootId: null,
            subtasks: [],
            logs: [],
            activeLogStart: null,
            activity: []
          }
        ]
      })
    ],
    'tasks.json',
    { type: 'application/json' }
  );
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;

  await user.upload(input, importFile);

  expect(screen.getByText(/import preview/i)).toBeInTheDocument();
  expect(screen.getByText(/imported task/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /merge import/i }));

  expect(screen.getAllByText(/imported task/i).length).toBeGreaterThan(0);
});
