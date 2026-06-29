import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsProvider } from './SettingsContext';
import { TaskProvider } from './TaskContext';
import { ProfileProvider, useProfileContext } from './ProfileContext';

const TestComponent = () => {
  const { activeProfileId, persistenceStatus } = useProfileContext();
  return (
    <div>
      <span data-testid="profile-id">{activeProfileId || 'none'}</span>
      <span data-testid="persistence-status">{persistenceStatus}</span>
    </div>
  );
};

describe('ProfileContext', () => {
  it('provides profile state', () => {
    render(
      <SettingsProvider>
        <TaskProvider>
          <ProfileProvider>
            <TestComponent />
          </ProfileProvider>
        </TaskProvider>
      </SettingsProvider>
    );

    // Initial state check
    expect(screen.getByTestId('persistence-status')).toHaveTextContent('online');
  });
});
