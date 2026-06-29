import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SettingsProvider } from './SettingsContext';
import { TaskProvider, useTaskContext } from './TaskContext';

const TestComponent = () => {
  const { tasks, addTask } = useTaskContext();
  return (
    <div>
      <span data-testid="tasks-count">{tasks.length}</span>
      <button onClick={() => addTask('backlog', { title: 'Test Task' })}>Add Task</button>
    </div>
  );
};

describe('TaskContext', () => {
  it('provides tasks state and addTask function', async () => {
    render(
      <SettingsProvider>
        <TaskProvider>
          <TestComponent />
        </TaskProvider>
      </SettingsProvider>
    );

    expect(screen.getByTestId('tasks-count')).toHaveTextContent('0');

    await act(async () => {
      screen.getByText('Add Task').click();
    });

    expect(screen.getByTestId('tasks-count')).toHaveTextContent('1');
  });
});
