import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import type { AppSettings, Task } from './domain/types';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'seed-task',
  title: 'Design Database Schema',
  status: 'new',
  urgency: 8,
  tags: ['Backend', 'High Priority'],
  scheduledDate: '',
  scheduledStart: '',
  scheduledEnd: '',
  recurrence: 'none',
  recurrenceRootId: null,
  subtasks: [],
  logs: [],
  activeLogStart: null,
  activity: [],
  ...overrides
});

const seedTasks = (tasks = [makeTask()]) => {
  localStorage.setItem('the-monastery_tasks_v1', JSON.stringify(tasks));
};

const seedSettings = (settings: Partial<AppSettings>) => {
  localStorage.setItem('the-monastery_settings_v1', JSON.stringify(settings));
};

const clickNewTask = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getAllByRole('button', { name: /new task/i })[0]);
};

beforeEach(() => {
  localStorage.clear();
});

it('renders TheMonastery board', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /themonastery/i })).toBeInTheDocument();
  expect(screen.getByText('new')).toBeInTheDocument();
  expect(screen.getByText('done')).toBeInTheDocument();
  expect(screen.getByText('rejected')).toBeInTheDocument();
});

it('adds a new task to the board', async () => {
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
  await user.click(screen.getByRole('button', { name: /^delete$/i }));
  await user.click(screen.getByRole('button', { name: /delete task/i }));

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
  await user.click(screen.getByRole('button', { name: /save task/i }));

  expect(screen.getAllByText(/build api/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/design database schema/i)).not.toBeInTheDocument();
});

it('prompts before closing dirty modal edits and can discard them', async () => {
  const user = userEvent.setup();
  seedTasks();
  render(<App />);

  await user.click(screen.getAllByText(/design database schema/i)[0]);
  const titleInput = screen.getByDisplayValue(/design database schema/i);
  await user.clear(titleInput);
  await user.type(titleInput, 'Unsaved Title');
  await user.click(screen.getByRole('button', { name: /^discard$/i }));

  expect(screen.getByText(/save changes\?/i)).toBeInTheDocument();
  await user.click(screen.getAllByRole('button', { name: /^discard$/i }).at(-1)!);

  expect(screen.getAllByText(/design database schema/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/unsaved title/i)).not.toBeInTheDocument();
});

it('filters tasks by tag', async () => {
  const user = userEvent.setup();
  render(<App />);

  await clickNewTask(user);
  const titleInput = screen.getByLabelText(/title/i);
  await user.type(titleInput, 'Frontend polish');
  await user.clear(screen.getByPlaceholderText(/backend, high priority/i));
  await user.type(screen.getByPlaceholderText(/backend, high priority/i), 'Frontend');
  await user.click(screen.getByRole('button', { name: /save task/i }));

  await user.click(screen.getByRole('button', { name: /filters/i }));
  await user.click(screen.getByRole('button', { name: /^frontend$/i }));

  expect(screen.getAllByText(/frontend polish/i).length).toBeGreaterThan(0);
  expect(screen.queryByText(/design database schema/i)).not.toBeInTheDocument();
});

it('adds task tags from the fuzzy tag pool', async () => {
  const user = userEvent.setup();
  render(<App />);

  await clickNewTask(user);
  await user.type(screen.getByLabelText(/title/i), 'Python study');
  await user.type(screen.getByRole('textbox', { name: /find tag/i }), 'py');
  await user.click(screen.getByRole('button', { name: /^python$/i }));
  await user.click(screen.getByRole('button', { name: /save task/i }));

  await user.click(screen.getByRole('button', { name: /filters/i }));
  await user.click(screen.getByRole('button', { name: /^python$/i }));

  expect(screen.getAllByText(/python study/i).length).toBeGreaterThan(0);
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
      { id: 'role-devops', name: 'DevOps', tags: ['python'], weeklyTargetHours: 5 },
      { id: 'role-backend', name: 'Backend', tags: ['python'], weeklyTargetHours: 5 }
    ]
  });

  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /analytics/i }));

  expect(screen.getByText(/role radar/i)).toBeInTheDocument();
  expect(screen.getByText(/tag hours/i)).toBeInTheDocument();
  expect(screen.getAllByText(/^python$/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/^devops$/i)).toBeInTheDocument();
  expect(screen.getByText(/^backend$/i)).toBeInTheDocument();
  expect(screen.getAllByText(/1\.00h/i).length).toBeGreaterThanOrEqual(3);
});

it('adds a role definition in settings', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(screen.getByRole('button', { name: /^roles$/i }));
  await user.click(screen.getByRole('button', { name: /^add$/i }));
  await user.click(screen.getByRole('button', { name: /close settings/i }));
  await user.click(screen.getByRole('button', { name: /analytics/i }));

  const roleHours = screen.getByText(/role hours/i).closest('section')!;
  expect(within(roleHours).getByText(/new role/i)).toBeInTheDocument();
});

it('opens full settings collapsed and supports icon-only expand/collapse controls', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));

  expect(screen.getByRole('button', { name: /^appearance$/i })).toBeInTheDocument();
  expect(screen.queryByText(/modal transparency/i)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /expand all settings sections/i }));
  expect(screen.getByText(/modal transparency/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /backup/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /collapse all settings sections/i }));
  await waitFor(() => {
    expect(screen.queryByText(/modal transparency/i)).not.toBeInTheDocument();
  });
});

it('offers one default mode choice and one entry per custom theme', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(screen.getByRole('button', { name: /^appearance$/i }));

  const [themeSelect] = screen.getAllByRole('combobox');
  const optionLabels = within(themeSelect)
    .getAllByRole('option')
    .map((option) => option.textContent);

  expect(optionLabels).toEqual([
    'System Default',
    'Light',
    'Dark',
    'Zen',
    'Tokyo Night',
    'Liquid Glass',
    'Terminal',
    'Terminal Clean',
    'Terminal White',
    'Terminal Clean White'
  ]);
});

it('toggles the right container and clock widget from the header', async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  expect(screen.getByTestId('clock-time')).toBeInTheDocument();

  await user.click(screen.getByTitle(/hide clock/i));
  expect(screen.queryByTestId('clock-time')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /hide right container/i }));
  expect(screen.getByRole('button', { name: /show right container/i })).toBeInTheDocument();
});

it('shows an icon in the locate-current-time button', () => {
  render(<App />);

  const locateButton = screen.getByRole('button', { name: /locate current time/i });
  expect(locateButton.querySelector('svg')).toBeInTheDocument();
});

it('closes settings when clicking outside the modal surface', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  expect(screen.getByRole('heading', { name: /preferences/i })).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByTestId('settings-modal-overlay'));

  expect(screen.queryByRole('heading', { name: /preferences/i })).not.toBeInTheDocument();
});

it('opens board settings as a scoped section only', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /board settings/i }));

  expect(screen.getAllByRole('button', { name: /^board$/i }).length).toBeGreaterThan(0);
  expect(screen.getByDisplayValue(/compact split/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^appearance$/i })).not.toBeInTheDocument();
});

it('keeps comma-separated role tags editable while typing', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(screen.getByRole('button', { name: /^roles$/i }));
  await user.click(screen.getByRole('button', { name: /^add$/i }));

  const tagsInput = screen.getByPlaceholderText(/python, docker, backend/i);
  await user.type(tagsInput, 'python, docker,');

  expect(tagsInput).toHaveValue('python, docker,');
});

it('adds role tags from the fuzzy tag pool', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(screen.getByRole('button', { name: /^roles$/i }));
  await user.click(screen.getByRole('button', { name: /^add$/i }));
  await user.type(screen.getByRole('textbox', { name: /find tag/i }), 'dock');
  await user.click(screen.getByRole('button', { name: /^docker$/i }));

  expect(screen.getByPlaceholderText(/python, docker, backend/i)).toHaveValue('docker');
});

it('adds a customizable role preset in settings', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(screen.getByRole('button', { name: /^roles$/i }));
  await user.click(screen.getByRole('button', { name: /^preset$/i }));

  expect(screen.getAllByDisplayValue(/backend/i).length).toBeGreaterThan(0);
  const tagsInput = screen.getByPlaceholderText(/python, docker, backend/i);
  expect((tagsInput as HTMLInputElement).value).toContain('backend');

  await user.clear(tagsInput);
  await user.type(tagsInput, 'backend, graphql,');

  expect(tagsInput).toHaveValue('backend, graphql,');
});

it('searches tasks and supports the mobile list view', async () => {
  const user = userEvent.setup();
  render(<App />);

  await clickNewTask(user);
  const titleInput = screen.getByLabelText(/title/i);
  await user.type(titleInput, 'Frontend polish');
  await user.click(screen.getByRole('button', { name: /save task/i }));

  await user.click(screen.getByRole('button', { name: /list/i }));
  await user.type(screen.getAllByPlaceholderText(/search tasks/i).at(-1)!, 'frontend');

  const taskList = screen.getByRole('list', { name: /task list/i });
  expect(within(taskList).getByText(/frontend polish/i)).toBeInTheDocument();
  expect(within(taskList).queryByText(/design database schema/i)).not.toBeInTheDocument();
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
  await user.click(screen.getByRole('button', { name: /analytics/i }));

  expect(screen.getByText(/total tracked/i)).toBeInTheDocument();
  expect(screen.getAllByText(/30m/i).length).toBeGreaterThan(0);
});

it('previews imported task conflicts before merging', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(screen.getByRole('button', { name: /^tasks data$/i }));

  const importFile = new File(
    [
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        tasks: [
          {
            id: 'imported-task',
            title: 'Imported task',
            status: 'new',
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
