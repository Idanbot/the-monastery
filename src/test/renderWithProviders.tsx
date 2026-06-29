import React from 'react';
import { render } from '@testing-library/react';
import { SettingsProvider } from '../contexts/SettingsContext';
import { TaskProvider } from '../contexts/TaskContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { UIProvider } from '../contexts/UIContext';

export function renderWithProviders(ui: React.ReactElement, { systemIsDark = false } = {}) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <SettingsProvider systemIsDark={systemIsDark}>
        <TaskProvider>
          <ProfileProvider>
            <UIProvider>
              {children}
            </UIProvider>
          </ProfileProvider>
        </TaskProvider>
      </SettingsProvider>
    );
  };

  return render(ui, { wrapper: Wrapper });
}
