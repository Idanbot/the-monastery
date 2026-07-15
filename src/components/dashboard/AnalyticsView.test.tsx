import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../../domain/tasks';
import { AnalyticsView } from './AnalyticsView';

it('uses a concise analytics summary instead of wide charts on a phone', () => {
  const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query === '(max-width: 639px)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
  const currentTask = normalizeTask({
    id: 'current',
    title: 'Review platform boundary',
    status: 'in-progress',
    tags: ['platform'],
    logs: [{ start: '2026-07-15T08:00:00.000Z', end: '2026-07-15T09:00:00.000Z' }]
  });

  render(
    <AnalyticsView
      tasks={[currentTask, normalizeTask({ id: 'done', title: 'Done', status: 'done' })]}
      settings={{
        ...defaultSettings,
        roles: [
          {
            id: 'platform-role',
            name: 'Platform',
            tags: ['platform'],
            dailyTargetHours: 0,
            weeklyTargetHours: 5,
            monthlyTargetHours: 0
          }
        ]
      }}
      now={new Date('2026-07-15T10:00:00.000Z').getTime()}
      activeProfile={null}
      currentTask={currentTask}
      openRoleSettings={vi.fn()}
    />
  );

  expect(screen.getByTestId('mobile-analytics-view')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
  expect(screen.getByText('Review platform boundary')).toBeInTheDocument();
  expect(screen.getByText('Role progress')).toBeInTheDocument();
  expect(screen.getByText('Tag progress')).toBeInTheDocument();
  expect(screen.queryByTestId('analytics-status-chart')).not.toBeInTheDocument();
  matchMedia.mockRestore();
});
