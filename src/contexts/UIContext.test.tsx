import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SettingsProvider } from './SettingsContext';
import { TaskProvider } from './TaskContext';
import { ProfileProvider } from './ProfileContext';
import { UIProvider, useUIContext } from './UIContext';
import { useTaskContext } from './TaskContext';

const TestComponent = () => {
  const { view, setView, isOnline } = useUIContext();
  return (
    <div>
      <span data-testid="current-view">{view}</span>
      <span data-testid="online-status">{isOnline ? 'online' : 'offline'}</span>
      <button onClick={() => setView('dashboard')}>Go to Dashboard</button>
    </div>
  );
};

const CommandIntegrationProbe = () => {
  const { commandPaletteGroups } = useUIContext();
  const { tasks, addTask } = useTaskContext();
  const taskCommands = commandPaletteGroups.find((group) => group.heading === 'Tasks')?.commands || [];
  const navigationCommands =
    commandPaletteGroups.find((group) => group.heading === 'Navigation')?.commands || [];

  return (
    <div>
      <button onClick={() => addTask('backlog', { title: 'Palette integration task' })}>Seed task</button>
      <span data-testid="probe-status">{tasks[0]?.status || 'empty'}</span>
      <span data-testid="probe-date">{tasks[0]?.scheduledDate || 'unscheduled'}</span>
      {taskCommands.map((command) => (
        <button key={command.value} onClick={command.onSelect}>
          {command.label}
        </button>
      ))}
      {navigationCommands.map((command) => (
        <button key={command.value} onClick={command.onSelect}>
          {command.label}
        </button>
      ))}
    </div>
  );
};

describe('UIContext', () => {
  it('provides UI state and view updates', async () => {
    render(
      <SettingsProvider>
        <TaskProvider>
          <ProfileProvider>
            <UIProvider>
              <TestComponent />
            </UIProvider>
          </ProfileProvider>
        </TaskProvider>
      </SettingsProvider>
    );

    expect(screen.getByTestId('current-view')).toHaveTextContent('board');
    expect(screen.getByTestId('online-status')).toHaveTextContent('online');

    await act(async () => {
      screen.getByText('Go to Dashboard').click();
    });

    expect(screen.getByTestId('current-view')).toHaveTextContent('dashboard');
  });

  it('integrates task status, scheduling, timer, and navigation commands', async () => {
    render(
      <SettingsProvider>
        <TaskProvider>
          <ProfileProvider>
            <UIProvider>
              <CommandIntegrationProbe />
            </UIProvider>
          </ProfileProvider>
        </TaskProvider>
      </SettingsProvider>
    );

    await act(async () => screen.getByRole('button', { name: 'Seed task' }).click());
    await act(async () =>
      screen.getByRole('button', { name: 'Move Palette integration task to Done' }).click()
    );
    expect(screen.getByTestId('probe-status')).toHaveTextContent('done');

    await act(async () =>
      screen.getByRole('button', { name: 'Schedule today: Palette integration task' }).click()
    );
    expect(screen.getByTestId('probe-date')).not.toHaveTextContent('unscheduled');

    expect(screen.getByRole('button', { name: 'Start timer: Palette integration task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to main' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to calendar' })).toBeInTheDocument();
  });
});
