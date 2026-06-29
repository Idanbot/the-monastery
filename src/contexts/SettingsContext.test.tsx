import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SettingsProvider, useSettingsContext } from './SettingsContext';

const TestComponent = () => {
  const { settings, toggleSidebarVisible, addRole } = useSettingsContext();
  return (
    <div>
      <span data-testid="sidebar-visible">{settings.sidebarVisible !== false ? 'true' : 'false'}</span>
      <span data-testid="roles-count">{settings.roles?.length || 0}</span>
      <button onClick={toggleSidebarVisible}>Toggle Sidebar</button>
      <button onClick={addRole}>Add Role</button>
    </div>
  );
};

describe('SettingsContext', () => {
  it('provides settings state and update functions', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(screen.getByTestId('sidebar-visible')).toHaveTextContent('true');
    expect(screen.getByTestId('roles-count')).toHaveTextContent('0');

    await act(async () => {
      screen.getByText('Toggle Sidebar').click();
    });
    expect(screen.getByTestId('sidebar-visible')).toHaveTextContent('false');

    await act(async () => {
      screen.getByText('Add Role').click();
    });
    expect(screen.getByTestId('roles-count')).toHaveTextContent('1');
  });
});
