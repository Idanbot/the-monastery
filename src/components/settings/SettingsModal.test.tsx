import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../domain/tasks';
import { SettingsModal } from './SettingsModal';

const renderSettings = (overrides = {}) => {
  const props = {
    initialSection: 'appearance',
    settings: { ...defaultSettings, animationsEnabled: false },
    setSettings: vi.fn(),
    addRole: vi.fn(),
    updateRole: vi.fn(),
    removeRole: vi.fn(),
    isBackendAvailable: true,
    profiles: [],
    activeProfileId: 'profile-1',
    selectProfile: vi.fn(),
    newProfileName: '',
    setNewProfileName: vi.fn(),
    createProfile: vi.fn(),
    setProfileAction: vi.fn(),
    profileError: '',
    exportTasks: vi.fn(),
    backupData: vi.fn(),
    exportThemeRecipe: vi.fn(),
    createRoleRoutineTasks: vi.fn(),
    exportActiveProfile: vi.fn(),
    importProfileInputRef: { current: null },
    importActiveProfile: vi.fn(),
    exportTaskSchema: vi.fn(),
    importInputRef: { current: null },
    importTasks: vi.fn(),
    importCalendarInputRef: { current: null },
    importCalendarTasks: vi.fn(),
    importPlanningInputRef: { current: null },
    importPlanningData: vi.fn(),
    localBackups: [],
    restoreLocalBackup: vi.fn(),
    removeLocalBackup: vi.fn(),
    tagPool: [],
    isDarkMode: false,
    onClose: vi.fn(),
    ...overrides
  };
  render(<SettingsModal {...props} />);
  return props;
};

describe('SettingsModal', () => {
  it('updates appearance colors, modal effects, and closes from the header', async () => {
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'appearance' });

    fireEvent.change(screen.getByLabelText(/main color/i), { target: { value: '#123456' } });
    expect(props.setSettings).toHaveBeenLastCalledWith({
      ...props.settings,
      colorScheme: { ...props.settings.colorScheme, main: '#123456' }
    });

    fireEvent.change(screen.getByLabelText(/modal blur/i), { target: { value: '12' } });
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, modalBlur: 12 });

    await user.click(screen.getByRole('button', { name: /close settings/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('updates compact time and clock controls', async () => {
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'time' });

    await user.click(screen.getByLabelText(/show seconds/i));
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, showSeconds: false });

    await user.click(screen.getByRole('button', { name: /analog clock/i }));
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, clockDisplayMode: 'analog' });

    fireEvent.change(screen.getByLabelText(/clock text color/i), { target: { value: '#abcdef' } });
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, clockTextColor: '#abcdef' });

    await user.click(screen.getByRole('button', { name: /increase clock size/i }));
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, clockTextScale: 1.1 });
  });

  it('updates board lane order controls', () => {
    const props = renderSettings({ initialSection: 'board' });

    fireEvent.change(screen.getByLabelText(/compact active top lane/i), { target: { value: 'in-progress' } });
    expect(props.setSettings).toHaveBeenLastCalledWith({
      ...props.settings,
      boardColumnOrder: {
        ...props.settings.boardColumnOrder,
        compactActive: ['in-progress', 'backlog']
      }
    });

    fireEvent.click(screen.getByRole('button', { name: /move backlog right/i }));
    expect(props.setSettings).toHaveBeenLastCalledWith({
      ...props.settings,
      boardColumnOrder: {
        ...props.settings.boardColumnOrder,
        full: ['in-progress', 'backlog', 'done', 'rejected']
      }
    });
  });

  it('updates board resize controls with bounded values', async () => {
    const props = renderSettings({ initialSection: 'board' });

    fireEvent.change(screen.getByLabelText(/resize bar thickness/i), { target: { value: '0' } });
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, resizeHandleThickness: 4 });

    fireEvent.change(screen.getByLabelText(/resize bar length/i), { target: { value: '999' } });
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, resizeHandleLength: 160 });

    fireEvent.change(screen.getByLabelText(/resize bar color/i), { target: { value: '#ff2d55' } });
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, resizeHandleColor: '#ff2d55' });

    fireEvent.click(screen.getByLabelText(/auto-start next backlog/i));
    expect(props.setSettings).toHaveBeenLastCalledWith({ ...props.settings, autoPromoteNextTask: true });
  });
});
