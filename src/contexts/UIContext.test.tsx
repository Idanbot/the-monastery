import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SettingsProvider } from './SettingsContext';
import { TaskProvider } from './TaskContext';
import { ProfileProvider } from './ProfileContext';
import { UIProvider, useUIContext } from './UIContext';

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
});
