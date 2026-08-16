import type { AppSettings, Task } from '../domain/types';

export const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'seed-task',
  title: 'Design Database Schema',
  createdAt: '2026-06-23T09:00:00.000Z',
  status: 'backlog',
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

export const seedTasks = (tasks = [makeTask()]) => {
  localStorage.setItem('the-monastery_tasks_v1', JSON.stringify(tasks));
};

export const seedSettings = (settings: Partial<AppSettings>) => {
  localStorage.setItem('the-monastery_settings_v1', JSON.stringify(settings));
};

export const clickNewTask = async (user: { click: (element: Element) => Promise<unknown> }) => {
  const { screen } = await import('@testing-library/react');
  await user.click(screen.getAllByRole('button', { name: /backlog task/i })[0]);
};

export const mockMedia = (matches: (query: string) => boolean) => {
  const matchMedia = vi.mocked(window.matchMedia);
  matchMedia.mockReset();
  matchMedia.mockImplementation((query) => ({
    matches: matches(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
};

export const mockDesktopMedia = () => mockMedia((query) => query === '(min-width: 768px)');

export const resetAppTestState = () => {
  localStorage.clear();
  mockMedia(() => false);
};
