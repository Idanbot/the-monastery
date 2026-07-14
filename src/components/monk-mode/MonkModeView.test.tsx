import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings, normalizeTask } from '../../domain/tasks';
import { MonkModeView } from './MonkModeView';

describe('MonkModeView', () => {
  it('keeps secondary focus-map details hidden until requested', async () => {
    const user = userEvent.setup();
    const currentTask = normalizeTask({
      id: 'current',
      title: 'Design migration boundary',
      status: 'in-progress'
    });
    const nextTask = normalizeTask({ id: 'next', title: 'Review rollback plan', status: 'in-progress' });

    render(
      <MonkModeView
        settings={{ ...defaultSettings, animationsEnabled: false, monkMode: true }}
        setSettings={vi.fn()}
        tasks={[currentTask, nextTask]}
        currentTask={currentTask}
        now={Date.now()}
        isEnteringMonkMode={false}
        mantra="Do less, but do it better."
        onExit={vi.fn()}
        onIntroComplete={vi.fn()}
        onAddTask={vi.fn()}
        onPomodoroComplete={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Design migration boundary' })).toBeInTheDocument();
    expect(screen.queryByText(/review rollback plan/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show focus map' }));
    expect(screen.getByText(/review rollback plan/i)).toBeInTheDocument();
  });
});
