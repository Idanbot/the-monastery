import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../domain/tasks';
import { SettingsModal } from './SettingsModal';

const contextMocks = vi.hoisted(() => ({
  settingsContext: {
    settings: {},
    setSettings: vi.fn(),
    addRole: vi.fn(),
    updateRole: vi.fn(),
    removeRole: vi.fn(),
    isDarkMode: false
  },
  taskContext: {
    tasks: [],
    tagPool: [],
    runTagTaxonomyCommand: vi.fn(),
    createRoleRoutineTasks: vi.fn()
  },
  profileContext: {
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
    exportActiveProfile: vi.fn(),
    importProfileInputRef: { current: null },
    importActiveProfile: vi.fn(),
    exportTaskSchema: vi.fn(),
    importInputRef: { current: null },
    importTasks: vi.fn(),
    setImportPreview: vi.fn(),
    importCalendarInputRef: { current: null },
    importCalendarTasks: vi.fn(),
    importPlanningInputRef: { current: null },
    importPlanningData: vi.fn(),
    localBackups: [],
    restoreLocalBackup: vi.fn(),
    removeLocalBackup: vi.fn()
  }
}));

vi.mock('../../contexts/SettingsContext', () => ({
  useSettingsContext: () => contextMocks.settingsContext
}));

vi.mock('../../contexts/TaskContext', () => ({
  useTaskContext: () => contextMocks.taskContext
}));

vi.mock('../../contexts/ProfileContext', () => ({
  useProfileContext: () => contextMocks.profileContext
}));

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
    setImportPreview: vi.fn(),
    importCalendarInputRef: { current: null },
    importCalendarTasks: vi.fn(),
    importPlanningInputRef: { current: null },
    importPlanningData: vi.fn(),
    localBackups: [],
    restoreLocalBackup: vi.fn(),
    removeLocalBackup: vi.fn(),
    tasks: [],
    tagPool: [],
    onTagCommand: vi.fn(),
    isDarkMode: false,
    onClose: vi.fn(),
    ...overrides
  };
  contextMocks.settingsContext.settings = props.settings;
  contextMocks.settingsContext.setSettings = props.setSettings;
  contextMocks.settingsContext.addRole = props.addRole;
  contextMocks.settingsContext.updateRole = props.updateRole;
  contextMocks.settingsContext.removeRole = props.removeRole;
  contextMocks.settingsContext.isDarkMode = props.isDarkMode;
  contextMocks.taskContext.tasks = props.tasks;
  contextMocks.taskContext.tagPool = props.tagPool;
  contextMocks.taskContext.runTagTaxonomyCommand = props.onTagCommand;
  contextMocks.taskContext.createRoleRoutineTasks = props.createRoleRoutineTasks;
  contextMocks.profileContext.isBackendAvailable = props.isBackendAvailable;
  contextMocks.profileContext.profiles = props.profiles;
  contextMocks.profileContext.activeProfileId = props.activeProfileId;
  contextMocks.profileContext.selectProfile = props.selectProfile;
  contextMocks.profileContext.newProfileName = props.newProfileName;
  contextMocks.profileContext.setNewProfileName = props.setNewProfileName;
  contextMocks.profileContext.createProfile = props.createProfile;
  contextMocks.profileContext.setProfileAction = props.setProfileAction;
  contextMocks.profileContext.profileError = props.profileError;
  contextMocks.profileContext.exportTasks = props.exportTasks;
  contextMocks.profileContext.backupData = props.backupData;
  contextMocks.profileContext.exportThemeRecipe = props.exportThemeRecipe;
  contextMocks.profileContext.exportActiveProfile = props.exportActiveProfile;
  contextMocks.profileContext.importProfileInputRef = props.importProfileInputRef;
  contextMocks.profileContext.importActiveProfile = props.importActiveProfile;
  contextMocks.profileContext.exportTaskSchema = props.exportTaskSchema;
  contextMocks.profileContext.importInputRef = props.importInputRef;
  contextMocks.profileContext.importTasks = props.importTasks;
  contextMocks.profileContext.setImportPreview = props.setImportPreview;
  contextMocks.profileContext.importCalendarInputRef = props.importCalendarInputRef;
  contextMocks.profileContext.importCalendarTasks = props.importCalendarTasks;
  contextMocks.profileContext.importPlanningInputRef = props.importPlanningInputRef;
  contextMocks.profileContext.importPlanningData = props.importPlanningData;
  contextMocks.profileContext.localBackups = props.localBackups;
  contextMocks.profileContext.restoreLocalBackup = props.restoreLocalBackup;
  contextMocks.profileContext.removeLocalBackup = props.removeLocalBackup;
  render(<SettingsModal initialSection={props.initialSection} onClose={props.onClose} />);
  return props;
};

describe('SettingsModal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('updates appearance colors, modal effects, and closes from the header', async () => {
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'appearance' });
    const dialog = screen.getByRole('dialog', { name: /preferences/i });

    expect(dialog.style.getPropertyValue('--modal-surface-alpha')).toBe('0.72');
    expect(dialog.style.getPropertyValue('--modal-surface-blur')).toBe('1px');

    fireEvent.change(screen.getByLabelText(/main color/i), { target: { value: '#123456' } });
    const colorUpdate = props.setSettings.mock.lastCall?.[0];
    expect(colorUpdate(props.settings)).toEqual({
      ...props.settings,
      colorScheme: { ...props.settings.colorScheme, main: '#123456' }
    });

    fireEvent.change(screen.getByLabelText(/modal blur/i), { target: { value: '12' } });
    const blurUpdate = props.setSettings.mock.lastCall?.[0];
    expect(blurUpdate(props.settings)).toEqual({ ...props.settings, modalBlur: 12 });

    await user.click(screen.getByRole('button', { name: /close settings/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('updates compact time and clock controls', async () => {
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'time' });

    await user.click(await screen.findByLabelText(/show seconds/i));
    const secondsUpdate = props.setSettings.mock.lastCall?.[0];
    expect(secondsUpdate(props.settings)).toEqual({ ...props.settings, showSeconds: false });

    await user.click(screen.getByRole('button', { name: /analog clock/i }));
    const clockModeUpdate = props.setSettings.mock.lastCall?.[0];
    expect(clockModeUpdate(props.settings)).toEqual({ ...props.settings, clockDisplayMode: 'analog' });

    fireEvent.change(screen.getByLabelText(/clock text color/i), { target: { value: '#abcdef' } });
    const clockColorUpdate = props.setSettings.mock.lastCall?.[0];
    expect(clockColorUpdate(props.settings)).toEqual({ ...props.settings, clockTextColor: '#abcdef' });

    await user.click(screen.getByRole('button', { name: /increase clock size/i }));
    const sizeUpdate = props.setSettings.mock.lastCall?.[0];
    expect(sizeUpdate(props.settings)).toEqual({ ...props.settings, clockTextScale: 1.1 });
  });

  it('requests permission before enabling browser notifications', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal(
      'Notification',
      class NotificationMock {
        static permission = 'default';
        static requestPermission = requestPermission;
      }
    );
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'time' });

    await user.click(await screen.findByLabelText('Browser notifications'));

    expect(requestPermission).toHaveBeenCalledOnce();
    const notificationUpdate = props.setSettings.mock.lastCall?.[0];
    expect(notificationUpdate(props.settings)).toEqual({ ...props.settings, notificationsEnabled: true });
  });

  it('adds a project and edits linked project data', async () => {
    const user = userEvent.setup();
    const props = renderSettings({
      initialSection: 'projects',
      tasks: [{ id: 'task-a', title: 'Migration lab' }]
    });
    await user.click(await screen.findByRole('button', { name: 'Add project' }));
    const addUpdate = props.setSettings.mock.lastCall?.[0];
    const added = addUpdate(props.settings);
    expect(added.projects[0]).toMatchObject({ name: 'New project', status: 'active', taskIds: [] });
  });

  it('renames a known tag from tag management', async () => {
    const user = userEvent.setup();
    const props = renderSettings({
      initialSection: 'tags',
      tagPool: ['observability', 'otel'],
      settings: {
        ...defaultSettings,
        tagInventory: ['observability', 'otel'],
        animationsEnabled: false
      }
    });

    await user.selectOptions(await screen.findByLabelText(/manage tag/i), 'otel');
    await user.clear(screen.getByLabelText(/rename selected tag/i));
    await user.type(screen.getByLabelText(/rename selected tag/i), 'telemetry');
    await user.click(screen.getByRole('button', { name: /^rename tag$/i }));

    expect(props.onTagCommand).toHaveBeenCalledWith({
      type: 'rename',
      source: 'otel',
      target: 'telemetry'
    });
  });

  it('manages merges, aliases, role links, goals, and deletion', async () => {
    const user = userEvent.setup();
    const props = renderSettings({
      initialSection: 'tags',
      tagPool: ['observability', 'otel'],
      settings: {
        ...defaultSettings,
        tagInventory: ['observability', 'otel'],
        roles: [
          {
            id: 'sre',
            name: 'SRE',
            tags: [],
            dailyTargetHours: 0,
            weeklyTargetHours: 0,
            monthlyTargetHours: 0
          }
        ],
        animationsEnabled: false
      }
    });

    await user.selectOptions(await screen.findByLabelText(/manage tag/i), 'otel');
    await user.selectOptions(screen.getByLabelText(/merge selected tag into/i), 'observability');
    await user.click(screen.getByRole('button', { name: /^merge tags$/i }));
    await user.type(screen.getByLabelText(/new alias/i), 'open-telemetry');
    await user.click(screen.getByRole('button', { name: /^add alias$/i }));
    await user.click(screen.getByLabelText(/connect sre/i));
    fireEvent.change(screen.getByLabelText(/weekly goal for otel/i), { target: { value: '5' } });
    await user.click(screen.getByRole('button', { name: /delete selected tag/i }));

    expect(props.onTagCommand.mock.calls.map(([command]) => command)).toEqual([
      { type: 'merge', source: 'otel', target: 'observability' },
      { type: 'set-alias', alias: 'open-telemetry', target: 'otel' },
      { type: 'toggle-role', tag: 'otel', roleId: 'sre' },
      { type: 'set-goal', tag: 'otel', goal: 'weeklyTargetHours', hours: 5 },
      { type: 'delete', tag: 'otel' }
    ]);
  });

  it('updates board lane order controls', async () => {
    const props = renderSettings({ initialSection: 'board' });

    fireEvent.change(await screen.findByLabelText(/compact active top lane/i), {
      target: { value: 'in-progress' }
    });
    const compactUpdate = props.setSettings.mock.lastCall?.[0];
    expect(compactUpdate(props.settings)).toEqual({
      ...props.settings,
      boardColumnOrder: {
        ...props.settings.boardColumnOrder,
        compactActive: ['in-progress', 'backlog']
      }
    });

    fireEvent.click(screen.getByRole('button', { name: /move backlog right/i }));
    const fullUpdate = props.setSettings.mock.lastCall?.[0];
    expect(fullUpdate(props.settings)).toEqual({
      ...props.settings,
      boardColumnOrder: {
        ...props.settings.boardColumnOrder,
        full: ['in-progress', 'backlog', 'done', 'rejected']
      }
    });
  });

  it('updates board resize controls with bounded values', async () => {
    const props = renderSettings({ initialSection: 'board' });

    fireEvent.change(await screen.findByLabelText(/resize bar thickness/i), { target: { value: '0' } });
    const thicknessUpdate = props.setSettings.mock.lastCall?.[0];
    expect(thicknessUpdate(props.settings)).toEqual({ ...props.settings, resizeHandleThickness: 1 });

    fireEvent.change(screen.getByLabelText(/resize bar length/i), { target: { value: '999' } });
    const lengthUpdate = props.setSettings.mock.lastCall?.[0];
    expect(lengthUpdate(props.settings)).toEqual({ ...props.settings, resizeHandleLength: 160 });

    fireEvent.change(screen.getByLabelText(/resize bar color/i), { target: { value: '#ff2d55' } });
    const colorUpdate = props.setSettings.mock.lastCall?.[0];
    expect(colorUpdate(props.settings)).toEqual({ ...props.settings, resizeHandleColor: '#ff2d55' });

    fireEvent.click(screen.getByLabelText(/auto-start next backlog/i));
    const promoteUpdate = props.setSettings.mock.lastCall?.[0];
    expect(promoteUpdate(props.settings)).toEqual({ ...props.settings, autoPromoteNextTask: true });
  });
  it('persists per-lane collapse settings', async () => {
    const props = renderSettings({ initialSection: 'board' });

    fireEvent.click(await screen.findByLabelText(/collapse done lane/i));
    const collapseUpdate = props.setSettings.mock.lastCall?.[0];
    expect(collapseUpdate(props.settings)).toEqual({
      ...props.settings,
      collapsedBoardLanes: ['done']
    });
  });

  it('shows exact build metadata at the end of settings', () => {
    renderSettings({ initialSection: 'data' });

    const metadata = screen.getByTestId('settings-build-metadata');
    expect(metadata).toHaveTextContent('Version: ' + __APP_VERSION__);
    expect(metadata).toHaveTextContent(/Commit: /);
    expect(metadata).toHaveTextContent(/Built: /);
  });

  it('uses category navigation to keep the full preferences workspace scannable', async () => {
    const user = userEvent.setup();
    renderSettings({ initialSection: null });

    const categories = screen.getByRole('navigation', { name: 'Settings categories' });
    await user.click(within(categories).getByRole('button', { name: 'Open Appearance settings' }));
    expect(screen.getByText(/modal transparency/i)).toBeInTheDocument();

    await user.click(within(categories).getByRole('button', { name: 'Open Board settings' }));
    expect(await screen.findByLabelText('Board layout')).toBeInTheDocument();
    expect(screen.queryByText(/modal transparency/i)).not.toBeInTheDocument();
  });
});
