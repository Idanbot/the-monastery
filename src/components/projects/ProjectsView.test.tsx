import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { normalizeTask } from '../../domain/tasks';
import { ProjectsView } from './ProjectsView';

it('shows project progress and opens its next action', async () => {
  const onOpenTask = vi.fn();
  render(
    <ProjectsView
      projects={[
        {
          id: 'cloud',
          name: 'Cloud Architect',
          description: 'Migration practice',
          status: 'active',
          tags: ['cloud'],
          taskIds: ['done', 'next'],
          milestones: [{ id: 'm1', title: 'Review', completed: true }]
        }
      ]}
      tasks={[
        normalizeTask({ id: 'done', title: 'Done', status: 'done' }),
        normalizeTask({ id: 'next', title: 'Present migration plan', status: 'in-progress' })
      ]}
      now={Date.now()}
      onOpenTask={onOpenTask}
      onOpenSettings={vi.fn()}
    />
  );
  expect(screen.getByRole('heading', { name: 'Cloud Architect' })).toBeInTheDocument();
  expect(screen.getByText('67%')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /present migration plan/i }));
  expect(onOpenTask).toHaveBeenCalledWith('next');
});
