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
  },
  uiContext: {
    isMediaPlayerActive: false,
    activateMediaPlayer: vi.fn(),
    openMediaPlayer: vi.fn(),
    stopMediaPlayer: vi.fn()
  },
  mediaPlayback: {
    playing: false,
    currentTime: 30,
    duration: 120,
    volume: 0.8,
    muted: false,
    setPlaying: vi.fn(),
    seekTo: vi.fn(),
    setVolume: vi.fn(),
    toggleMuted: vi.fn(),
    resetPlayback: vi.fn()
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

vi.mock('../../contexts/UIContext', () => ({
  useUIContext: () => contextMocks.uiContext
}));

vi.mock('../../contexts/MediaPlaybackContext', () => ({
  useMediaPlayback: () => contextMocks.mediaPlayback
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

const chooseOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string | RegExp,
  option: string
) => {
  await user.click(await screen.findByRole('combobox', { name: label }, { timeout: 5000 }));
  await user.click(screen.getByRole('option', { name: option }));
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

    await chooseOption(user, 'Base text size', 'Large text');
    const textSizeUpdate = props.setSettings.mock.lastCall?.[0];
    expect(textSizeUpdate(props.settings)).toEqual({ ...props.settings, textSize: 'large' });

    await user.click(screen.getByRole('button', { name: /close settings/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('updates compact time and clock controls', async () => {
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'time' });

    await chooseOption(user, 'Clock format', '12 hour');
    const formatUpdate = props.setSettings.mock.lastCall?.[0];
    expect(formatUpdate(props.settings)).toEqual({ ...props.settings, clockFormat: '12h' });

    await user.click(await screen.findByLabelText(/show seconds/i, {}, { timeout: 5000 }));
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

  it('controls the persistent media session from settings', async () => {
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'media' });

    await user.click(await screen.findByRole('button', { name: 'Play media' }));
    expect(contextMocks.uiContext.activateMediaPlayer).toHaveBeenCalledOnce();
    expect(contextMocks.mediaPlayback.setPlaying).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: 'Mute media' }));
    expect(contextMocks.mediaPlayback.toggleMuted).toHaveBeenCalledOnce();

    fireEvent.change(screen.getByRole('slider', { name: 'Settings media volume' }), {
      target: { value: '0.4' }
    });
    expect(contextMocks.mediaPlayback.setVolume).toHaveBeenCalledWith(0.4);

    fireEvent.change(screen.getByLabelText('Focus media URL'), {
      target: { value: 'https://media.example/focus.mp3' }
    });
    const sourceUpdate = props.setSettings.mock.lastCall?.[0];
    expect(sourceUpdate(props.settings)).toEqual({
      ...props.settings,
      focusMediaUrl: 'https://media.example/focus.mp3'
    });
  });

  it('replaces any main view quarter from settings', async () => {
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'main' });

    await user.click(await screen.findByRole('combobox', { name: 'Top left quarter' }, { timeout: 5000 }));
    await user.click(screen.getByRole('option', { name: 'Calendar' }));
    const slotUpdate = props.setSettings.mock.lastCall?.[0];
    expect(slotUpdate(props.settings)).toEqual({
      ...props.settings,
      mainViewSlots: { ...props.settings.mainViewSlots, topLeft: 'calendar' }
    });

    await user.click(screen.getByRole('button', { name: 'Move Top left later' }));
    const moveUpdate = props.setSettings.mock.lastCall?.[0];
    expect(moveUpdate(props.settings).mainViewSlots).toEqual({
      ...props.settings.mainViewSlots,
      topLeft: props.settings.mainViewSlots.topRight,
      topRight: props.settings.mainViewSlots.topLeft
    });

    await user.click(screen.getByRole('combobox', { name: 'Activity pet' }));
    await user.click(screen.getByRole('option', { name: 'Kitten' }));
    const petUpdate = props.setSettings.mock.lastCall?.[0];
    expect(petUpdate(props.settings)).toEqual({ ...props.settings, activityPetId: 'kitten' });

    await user.click(screen.getByLabelText('Animate streak flame'));
    const flameUpdate = props.setSettings.mock.lastCall?.[0];
    expect(flameUpdate(props.settings)).toEqual({
      ...props.settings,
      activityFlameAnimationEnabled: false
    });
  });

  it('clears dashboard activity without deleting task history', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const props = renderSettings({ initialSection: 'main' });
    const before = Date.now();

    await user.click(await screen.findByRole('button', { name: 'Clear activity' }));

    expect(confirm).toHaveBeenCalledWith(
      'Clear activity totals and streaks? Tasks, time logs, and completion history will be kept.'
    );
    const clearUpdate = props.setSettings.mock.lastCall?.[0];
    const cleared = clearUpdate(props.settings);
    expect(new Date(cleared.activityClearedBefore).getTime()).toBeGreaterThanOrEqual(before);
    expect(props.tasks).toEqual([]);
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

  it('updates project status and links a task through shared dropdowns', async () => {
    const user = userEvent.setup();
    const project = {
      id: 'project-a',
      name: 'Migration',
      description: '',
      status: 'active' as const,
      tags: [],
      taskIds: [],
      milestones: []
    };
    const props = renderSettings({
      initialSection: 'projects',
      tasks: [{ id: 'task-a', title: 'Migration lab' }],
      settings: { ...defaultSettings, projects: [project], animationsEnabled: false }
    });

    await chooseOption(user, 'Project status', 'Paused');
    const statusUpdate = props.setSettings.mock.lastCall?.[0];
    expect(statusUpdate(props.settings).projects[0].status).toBe('paused');

    await chooseOption(user, 'Link task to project', 'Migration lab');
    const taskUpdate = props.setSettings.mock.lastCall?.[0];
    expect(taskUpdate(props.settings).projects[0].taskIds).toEqual(['task-a']);
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

    await chooseOption(user, /manage tag/i, 'otel');
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

    await chooseOption(user, /manage tag/i, 'otel');
    await chooseOption(user, /merge selected tag into/i, 'observability');
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
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'board' });

    await chooseOption(user, /compact active top lane/i, 'In-Progress');
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

  it('selects a role preset through the shared settings dropdown', async () => {
    const user = userEvent.setup();
    const props = renderSettings({ initialSection: 'roles' });

    await chooseOption(user, 'Role preset', 'Cloud');
    await user.click(screen.getByRole('button', { name: 'Preset' }));

    const presetUpdate = props.setSettings.mock.lastCall?.[0];
    expect(presetUpdate(props.settings).roles.at(-1)).toMatchObject({
      name: 'Cloud',
      tags: ['aws', 'gcp', 'azure', 'networking', 'infrastructure']
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

  it('closes preferences before opening a destructive profile confirmation', async () => {
    const user = userEvent.setup();
    const props = renderSettings({
      initialSection: 'profiles',
      profiles: [
        { id: 'profile-1', name: 'Primary', taskCount: 1 },
        { id: 'profile-2', name: 'Secondary', taskCount: 0 }
      ]
    });

    await user.click(await screen.findByRole('button', { name: /^reset$/i }));
    expect(props.setProfileAction).toHaveBeenLastCalledWith('reset');
    expect(props.onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /^remove$/i }));
    expect(props.setProfileAction).toHaveBeenLastCalledWith('remove');
    expect(props.onClose).toHaveBeenCalledTimes(2);
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
