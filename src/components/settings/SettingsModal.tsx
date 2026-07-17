import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import {
  Calendar,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Download,
  FileJson,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  Upload,
  UserPlus,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeGallery } from './ThemeGallery';
import { VisualSystemPreview } from './VisualSystemPreview';
import { TagPicker } from '../tag-picker/TagPicker';
import { SettingSection } from './SettingSection';
import { RegisteredSettingsSection } from './RegisteredSettingsSection';
import { themedSurfaceClassName } from '../ui/themedSurfaceStyles';
import { createRoleFromPreset, rolePresets } from '../../domain/rolePresets';
import { parseTagString } from '../../domain/tags';
import { createThemeRecipe, themeRecipeSchema } from '../../domain/themeStudio';
import { generateId } from '../../domain/tasks';
import { useThemeStyle } from '../../hooks/useThemeStyle';
import { themeChoiceOptions } from '../../domain/themeGallery';

import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useProfileContext } from '../../contexts/ProfileContext';

const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const appBuildRef = typeof __APP_BUILD_REF__ === 'string' ? __APP_BUILD_REF__ : 'local';
const appBuildDate = typeof __APP_BUILD_DATE__ === 'string' ? __APP_BUILD_DATE__ : 'unknown';

const sectionIds = [
  'appearance',
  'main',
  'time',
  'board',
  'tags',
  'roles',
  'projects',
  'sidebar',
  'profiles',
  'integrations',
  'data'
] as const;

const sectionNavigation = [
  ['appearance', 'Appearance', 'Theme, type, and motion'],
  ['main', 'Main view', 'Four dashboard quarters'],
  ['time', 'Time', 'Clock and timeline'],
  ['board', 'Board', 'Layout and task cards'],
  ['tags', 'Tags', 'Inventory and relationships'],
  ['roles', 'Roles', 'Responsibilities and goals'],
  ['projects', 'Projects', 'Workspaces and milestones'],
  ['sidebar', 'Sidebar', 'Focus widgets'],
  ['profiles', 'Profiles', 'People and workspaces'],
  ['integrations', 'Integrations', 'Alerts and automation'],
  ['data', 'Data', 'Import, export, and backup']
] as const;

export function SettingsModal({
  initialSection = null,
  onClose
}: {
  initialSection?: string | null;
  onClose: () => void;
}) {
  const { settings, setSettings, addRole, updateRole, removeRole, isDarkMode } = useSettingsContext();

  const { tagPool = [], createRoleRoutineTasks } = useTaskContext();

  const {
    isBackendAvailable,
    profiles,
    activeProfileId,
    selectProfile,
    newProfileName,
    setNewProfileName,
    createProfile,
    setProfileAction,
    profileError,
    exportTasks,
    backupData,
    exportThemeRecipe,
    exportActiveProfile,
    importProfileInputRef,
    importActiveProfile,
    exportTaskSchema,
    importInputRef,
    importTasks,
    importCalendarInputRef,
    importCalendarTasks,
    importPlanningInputRef,
    importPlanningData,
    localBackups = [],
    restoreLocalBackup,
    removeLocalBackup
  } = useProfileContext();

  const isScopedSettings = Boolean(initialSection);
  const visibleSectionIds = isScopedSettings ? [initialSection] : sectionIds;
  const defaultThemeChoice = `${settings.theme}:${settings.visualTheme}`;
  const themeChoice =
    settings.visualTheme === 'default' ? defaultThemeChoice : `theme:${settings.visualTheme}`;
  const normalizedThemeChoice = themeChoiceOptions.some((option) => option.value === themeChoice)
    ? themeChoice
    : 'system:default';
  const themeScopeClassName = isDarkMode ? 'dark' : '';
  const {
    animationsEnabled,
    motionDuration,
    motionEase,
    themeStyle: resolvedThemeStyle,
    modalEffectStyle,
    effectiveMainColor,
    effectiveSecondaryColor,
    effectiveTextColor
  } = useThemeStyle(settings, isDarkMode);
  const themeStyle = useMemo(
    () => ({ ...resolvedThemeStyle, ...modalEffectStyle }),
    [resolvedThemeStyle, modalEffectStyle]
  );
  const themeRecipeForm = useForm({
    resolver: zodResolver(themeRecipeSchema),
    values: createThemeRecipe(settings),
    mode: 'onChange'
  });
  const themeNameField = themeRecipeForm.register('name', {
    onChange: (event) => updateSetting('customThemeName', event.target.value)
  });
  const roleTagValues = useMemo(
    () => Object.fromEntries((settings.roles || []).map((role) => [role.id, (role.tags || []).join(', ')])),
    [settings.roles]
  );
  const [roleTagDrafts, setRoleTagDrafts] = useState(roleTagValues);
  const [selectedRolePresetId, setSelectedRolePresetId] = useState(rolePresets[0].id);
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(sectionIds.map((id) => [id, isScopedSettings && id === initialSection]))
  );

  useEffect(() => {
    setRoleTagDrafts(roleTagValues);
  }, [roleTagValues]);

  useEffect(() => {
    setOpenSections(
      Object.fromEntries(sectionIds.map((id) => [id, Boolean(initialSection) && id === initialSection]))
    );
  }, [initialSection]);

  const toggleSection = (id) => {
    setOpenSections((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const setAllSections = (isOpen) => {
    setOpenSections(Object.fromEntries(sectionIds.map((id) => [id, isOpen])));
  };

  const openOnlySection = (id: (typeof sectionIds)[number]) => {
    setOpenSections(Object.fromEntries(sectionIds.map((sectionId) => [sectionId, sectionId === id])));
  };

  const patchSettings = (partial: Partial<typeof settings>) => {
    setSettings((previous) => ({ ...previous, ...partial }));
  };

  const updateSetting = (key: keyof typeof settings, value: unknown) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const updateColorScheme = (key: 'main' | 'secondary' | 'text', value: string) => {
    setSettings((previous) => ({
      ...previous,
      colorScheme: {
        ...(previous.colorScheme || { main: '', secondary: '', text: '' }),
        [key]: value
      }
    }));
  };

  const setThemeChoice = (value: string) => {
    const option = themeChoiceOptions.find((item) => item.value === value) || themeChoiceOptions[0];
    patchSettings({
      theme: option.theme,
      visualTheme: option.visualTheme,
      colorScheme: { main: '', secondary: '', text: '' },
      fontMain: '',
      fontSecondary: '',
      clockTextColor: '',
      clockBackgroundColor: ''
    });
  };

  const setThemeColor = (key: 'main' | 'secondary' | 'text', value: string) => {
    updateColorScheme(key, value);
  };

  const addRolePreset = () => {
    const preset = rolePresets.find((item) => item.id === selectedRolePresetId) || rolePresets[0];
    setSettings((previous) => ({
      ...previous,
      roles: [...(previous.roles || []), createRoleFromPreset(preset)]
    }));
  };

  const commitRoleTags = (roleId, nextValue = roleTagDrafts[roleId] || '') => {
    updateRole(roleId, { tags: parseTagString(nextValue) });
  };

  const registeredSectionProps = { openSections, toggleSection, motionDuration, motionEase };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            data-testid="settings-modal-overlay"
            data-visual-theme={settings.visualTheme}
            data-animations-enabled={animationsEnabled ? 'true' : 'false'}
            style={themeStyle}
            className={themedSurfaceClassName(
              'overlay',
              'fixed inset-0 z-[100] flex items-center justify-center p-4'
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            data-visual-theme={settings.visualTheme}
            data-animations-enabled={animationsEnabled ? 'true' : 'false'}
            style={themeStyle}
            className={themedSurfaceClassName(
              'modal',
              `${themeScopeClassName} fixed left-1/2 top-[53vh] z-[101] flex h-[min(78vh,780px)] max-h-[78vh] w-[calc(100vw-1rem)] ${isScopedSettings ? 'max-w-3xl' : 'max-w-5xl'} flex-col overflow-hidden rounded-2xl border shadow-2xl`
            )}
            initial={{ opacity: 0, scale: 0.97, x: '-50%', y: '-48%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            transition={{ duration: motionDuration, ease: motionEase }}
          >
            <div
              className={themedSurfaceClassName(
                'panel',
                'px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40 shrink-0'
              )}
            >
              <Dialog.Title className="font-bold text-lg flex items-center gap-2">
                <Settings2 size={18} /> Preferences
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Configure profile settings, appearance, roles, profiles, and task data.
              </Dialog.Description>
              <div className="flex items-center gap-1.5">
                {!isScopedSettings && (
                  <>
                    <Button
                      aria-label="Expand all settings sections"
                      title="Expand all"
                      onClick={() => setAllSections(true)}
                      variant="ghost"
                      size="icon"
                    >
                      <ChevronsDown size={16} />
                    </Button>
                    <Button
                      aria-label="Collapse all settings sections"
                      title="Collapse all"
                      onClick={() => setAllSections(false)}
                      variant="ghost"
                      size="icon"
                    >
                      <ChevronsUp size={16} />
                    </Button>
                  </>
                )}
                <Button aria-label="Close settings" onClick={onClose} variant="ghost" size="icon">
                  <X size={20} />
                </Button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1">
              {!isScopedSettings && (
                <nav
                  aria-label="Settings categories"
                  className="settings-navigation hidden w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r p-3 md:flex"
                >
                  {sectionNavigation.map(([id, label, description]) => (
                    <button
                      key={id}
                      type="button"
                      aria-label={`Open ${label} settings`}
                      aria-current={openSections[id] ? 'page' : undefined}
                      onClick={() => openOnlySection(id)}
                      className={`settings-navigation-item ui-focus-ring rounded-xl px-3 py-2.5 text-left ${openSections[id] ? 'settings-navigation-item-active' : ''}`}
                    >
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--ui-text-secondary)]">
                        {description}
                      </span>
                    </button>
                  ))}
                </nav>
              )}
              <div
                data-testid="settings-content"
                className="custom-scrollbar min-w-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
              >
                {visibleSectionIds.includes('appearance') && (
                  <SettingSection
                    id="appearance"
                    title="Appearance"
                    openSections={openSections}
                    toggleSection={toggleSection}
                    motionDuration={motionDuration}
                    motionEase={motionEase}
                  >
                    <ThemeGallery
                      options={themeChoiceOptions}
                      normalizedThemeChoice={normalizedThemeChoice}
                      setThemeChoice={setThemeChoice}
                    />

                    <VisualSystemPreview />

                    <div className="mt-8 mb-4 border-t border-slate-200 dark:border-slate-700"></div>

                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Typography
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-xs">Base text size</span>
                        <select
                          value={settings.textSize}
                          onChange={(e) => updateSetting('textSize', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        >
                          <option value="small">Small text</option>
                          <option value="medium">Medium text</option>
                          <option value="large">Large text</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-xs">Main Text Font</span>
                        <select
                          value={settings.fontMain || ''}
                          onChange={(e) => updateSetting('fontMain', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        >
                          <option value="">Default Main Font</option>
                          <option value="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Inter, sans-serif">
                            Apple Inspired
                          </option>
                          <option value="'FiraCode Nerd Font', 'Fira Code', monospace">
                            Terminal Nerd Font
                          </option>
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Outfit, sans-serif">Outfit</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Lato, sans-serif">Lato</option>
                          <option value="Merriweather, serif">Merriweather</option>
                          <option value="'Playfair Display', serif">Playfair Display</option>
                          <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-xs">Secondary / Headers Font</span>
                        <select
                          value={settings.fontSecondary || ''}
                          onChange={(e) => updateSetting('fontSecondary', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        >
                          <option value="">Default Heading Font</option>
                          <option value="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Inter, sans-serif">
                            Apple Inspired
                          </option>
                          <option value="'FiraCode Nerd Font', 'Fira Code', monospace">
                            Terminal Nerd Font
                          </option>
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Outfit, sans-serif">Outfit</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Lato, sans-serif">Lato</option>
                          <option value="Merriweather, serif">Merriweather</option>
                          <option value="'Playfair Display', serif">Playfair Display</option>
                          <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-xs">UI & Monospace Elements</span>
                        <select
                          value={settings.fontUI || ''}
                          onChange={(e) => updateSetting('fontUI', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        >
                          <option value="">Default UI Font</option>
                          <option value="'FiraCode Nerd Font', 'Fira Code', ui-monospace, monospace">
                            Terminal Nerd Font
                          </option>
                          <option value="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Inter, sans-serif">
                            Apple Inspired
                          </option>
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Outfit, sans-serif">Outfit</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Lato, sans-serif">Lato</option>
                          <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-8 mb-4 border-t border-slate-200 dark:border-slate-700"></div>

                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Colors
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Main color</span>
                        <input
                          type="color"
                          value={effectiveMainColor}
                          onChange={(e) => setThemeColor('main', e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Secondary color</span>
                        <input
                          type="color"
                          value={effectiveSecondaryColor}
                          onChange={(e) => setThemeColor('secondary', e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Text color</span>
                        <input
                          type="color"
                          value={effectiveTextColor}
                          onChange={(e) => setThemeColor('text', e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1"
                        />
                      </label>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Theme Studio
                        </div>
                        <button
                          type="button"
                          onClick={exportThemeRecipe}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-xs font-medium"
                        >
                          Export
                        </button>
                      </div>
                      <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>Recipe name</span>
                        <input
                          aria-label="Custom theme name"
                          {...themeNameField}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ['Calm', 'zen', 'light', '#5e7c67', '#9aa891', '#26312a'],
                          ['Glass', 'liquid-glass', 'light', '#007aff', '#af52de', '#152033'],
                          ['Mono', 'terminal-white', 'dark', '#ffffff', '#b8b8b8', '#ffffff']
                        ].map(([label, visualTheme, theme, main, secondary, text]) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() =>
                              patchSettings({
                                visualTheme: visualTheme as any,
                                theme: theme as any,
                                colorScheme: { main, secondary, text },
                                fontMain: '',
                                fontSecondary: '',
                                clockTextColor: '',
                                clockBackgroundColor: ''
                              })
                            }
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2 text-xs font-medium"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="rounded-lg border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-3 text-[color:var(--theme-text)]">
                        <div className="mb-2 text-xs font-semibold text-[color:var(--theme-muted-text)]">
                          Preview
                        </div>
                        <div className="rounded-md bg-[color:var(--theme-muted-surface)] px-3 py-2 text-sm">
                          Cards, clock, and modals inherit these three colors.
                        </div>
                        <button
                          type="button"
                          className="mt-2 rounded-md bg-[color:var(--theme-main)] px-3 py-1.5 text-xs font-semibold text-[color:var(--theme-main-contrast)]"
                        >
                          Action
                        </button>
                      </div>
                    </div>

                    <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="flex items-center justify-between">
                        <span>Modal transparency</span>
                        <span className="font-mono text-xs text-slate-500">
                          {settings.modalTransparency}%
                        </span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.modalTransparency}
                        onChange={(e) => {
                          const transparency = Math.max(0, Math.min(100, Number(e.target.value)));
                          setSettings((previous) => ({ ...previous, modalTransparency: transparency }));
                        }}
                        className="accent-indigo-600"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="flex items-center justify-between">
                        <span>Modal blur</span>
                        <span className="font-mono text-xs text-slate-500">{settings.modalBlur}px</span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="64"
                        value={settings.modalBlur}
                        onChange={(e) => {
                          const blur = Math.max(0, Math.min(64, Number(e.target.value)));
                          setSettings((previous) => ({ ...previous, modalBlur: blur }));
                        }}
                        className="accent-indigo-600"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <span>Monk Mode</span>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.monkMode)}
                        onChange={(e) => updateSetting('monkMode', e.target.checked)}
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <span>Animations</span>
                      <input
                        type="checkbox"
                        checked={settings.animationsEnabled !== false}
                        onChange={(e) => updateSetting('animationsEnabled', e.target.checked)}
                        className="h-4 w-4 accent-indigo-600"
                      />
                    </label>
                  </SettingSection>
                )}

                {visibleSectionIds.includes('time') && (
                  <RegisteredSettingsSection id="time" {...registeredSectionProps} />
                )}

                {visibleSectionIds.includes('main') && (
                  <RegisteredSettingsSection id="main" {...registeredSectionProps} />
                )}

                {visibleSectionIds.includes('board') && (
                  <RegisteredSettingsSection id="board" {...registeredSectionProps} />
                )}

                {visibleSectionIds.includes('tags') && (
                  <RegisteredSettingsSection id="tags" {...registeredSectionProps} />
                )}

                {visibleSectionIds.includes('roles') && (
                  <SettingSection
                    id="roles"
                    title="Roles"
                    openSections={openSections}
                    toggleSection={toggleSection}
                    motionDuration={motionDuration}
                    motionEase={motionEase}
                  >
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Select.Root value={selectedRolePresetId} onValueChange={setSelectedRolePresetId}>
                        <Select.Trigger
                          aria-label="Role preset"
                          className="min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 flex items-center justify-between gap-2"
                        >
                          <Select.Value />
                          <Select.Icon>
                            <ChevronDown size={14} />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content
                            data-visual-theme={settings.visualTheme}
                            data-animations-enabled={animationsEnabled ? 'true' : 'false'}
                            style={themeStyle}
                            position="popper"
                            sideOffset={6}
                            className={themedSurfaceClassName(
                              'menu',
                              `${themeScopeClassName} z-[90] min-w-[14rem] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-1`
                            )}
                          >
                            <Select.Viewport>
                              {rolePresets.map((preset) => (
                                <Select.Item
                                  key={preset.id}
                                  value={preset.id}
                                  className="px-3 py-2 text-sm rounded-lg outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
                                >
                                  <Select.ItemText>{preset.name}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                      <Button onClick={addRolePreset} variant="secondary">
                        <Plus size={13} /> Preset
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={addRole}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-xs font-medium flex items-center gap-1.5"
                      >
                        <Plus size={13} /> Add
                      </button>
                      <button
                        onClick={createRoleRoutineTasks}
                        disabled={(settings.roles || []).length === 0}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-xs font-medium disabled:opacity-50"
                      >
                        Create routines
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(settings.roles || []).map((role) => (
                        <div
                          key={role.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/60 space-y-2"
                        >
                          <div className="flex gap-2">
                            <input
                              aria-label={`Role name ${role.name}`}
                              value={role.name}
                              onChange={(e) => updateRole(role.id, { name: e.target.value })}
                              className="min-w-0 flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                            />
                            <button
                              onClick={() => removeRole(role.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              title="Remove role"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <TagPicker
                            value={roleTagDrafts[role.id] ?? ''}
                            onChange={(nextValue) =>
                              setRoleTagDrafts((previous) => ({ ...previous, [role.id]: nextValue }))
                            }
                            onCommit={(nextValue) => commitRoleTags(role.id, nextValue)}
                            placeholder="python, docker, backend"
                            tagPool={tagPool}
                            className="text-slate-600 dark:text-slate-300"
                            inputClassName="bg-white dark:bg-slate-950"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              ['Daily', 'dailyTargetHours'],
                              ['Weekly', 'weeklyTargetHours'],
                              ['Monthly', 'monthlyTargetHours']
                            ].map(([label, key]) => (
                              <label
                                key={key}
                                className="flex flex-col gap-1 text-xs font-medium text-slate-500"
                              >
                                {label} h
                                <input
                                  type="number"
                                  min="0"
                                  step="0.25"
                                  value={role[key] || 0}
                                  onChange={(e) =>
                                    updateRole(role.id, {
                                      [key]: Math.max(0, Number(e.target.value) || 0)
                                    })
                                  }
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Tag goals
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings((previous) => ({
                                ...previous,
                                tagGoals: [
                                  ...(previous.tagGoals || []),
                                  {
                                    id: generateId(),
                                    tag: '',
                                    dailyTargetHours: 0,
                                    weeklyTargetHours: 0,
                                    monthlyTargetHours: 0
                                  }
                                ]
                              }))
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        {(settings.tagGoals || []).map((goal) => (
                          <div
                            key={goal.id}
                            className="grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-white dark:bg-slate-950 p-2"
                          >
                            <div className="space-y-2">
                              <input
                                aria-label="Tag goal"
                                value={goal.tag}
                                placeholder="tag"
                                onChange={(e) => {
                                  const tag = e.target.value;
                                  setSettings((previous) => ({
                                    ...previous,
                                    tagGoals: (previous.tagGoals || []).map((item) =>
                                      item.id === goal.id ? { ...item, tag } : item
                                    )
                                  }));
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                              />
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  ['D', 'dailyTargetHours'],
                                  ['W', 'weeklyTargetHours'],
                                  ['M', 'monthlyTargetHours']
                                ].map(([label, key]) => (
                                  <label
                                    key={key}
                                    className="flex flex-col gap-1 text-[10px] font-medium text-slate-500"
                                  >
                                    {label}
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.25"
                                      value={goal[key] || 0}
                                      onChange={(e) => {
                                        const amount = Math.max(0, Number(e.target.value) || 0);
                                        setSettings((previous) => ({
                                          ...previous,
                                          tagGoals: (previous.tagGoals || []).map((item) =>
                                            item.id === goal.id ? { ...item, [key]: amount } : item
                                          )
                                        }));
                                      }}
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSettings((previous) => ({
                                  ...previous,
                                  tagGoals: (previous.tagGoals || []).filter((item) => item.id !== goal.id)
                                }))
                              }
                              className="self-start p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                        {(settings.tagGoals || []).length === 0 && (
                          <div className="text-xs text-slate-400">No tag goals.</div>
                        )}
                      </div>
                      {(settings.roles || []).length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center text-sm text-slate-400">
                          No roles defined
                        </div>
                      )}
                    </div>
                  </SettingSection>
                )}

                {visibleSectionIds.includes('projects') && (
                  <RegisteredSettingsSection id="projects" {...registeredSectionProps} />
                )}

                {visibleSectionIds.includes('sidebar') && (
                  <RegisteredSettingsSection id="sidebar" {...registeredSectionProps} />
                )}

                {visibleSectionIds.includes('profiles') && (
                  <SettingSection
                    id="profiles"
                    title="Profiles"
                    openSections={openSections}
                    toggleSection={toggleSection}
                    motionDuration={motionDuration}
                    motionEase={motionEase}
                  >
                    {isBackendAvailable ? (
                      <div className="space-y-3">
                        <select
                          value={activeProfileId}
                          onChange={(e) => selectProfile(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        >
                          {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name} ({profile.taskCount ?? 0})
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-2">
                          <input
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                createProfile();
                              }
                            }}
                            placeholder="New profile name"
                            className="min-w-0 flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                          />
                          <button
                            onClick={createProfile}
                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-2"
                          >
                            <UserPlus size={14} /> Create
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={exportActiveProfile}
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Download size={14} /> Export profile
                          </button>
                          <button
                            onClick={() => importProfileInputRef.current?.click()}
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Upload size={14} /> Import profile
                          </button>
                        </div>
                        <input
                          ref={importProfileInputRef}
                          data-testid="profile-import-input"
                          type="file"
                          accept="application/json,.json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            importActiveProfile(file);
                          }}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setProfileAction('reset')}
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-amber-300 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <RotateCcw size={14} /> Reset
                          </button>
                          <button
                            onClick={() => setProfileAction('remove')}
                            disabled={profiles.length <= 1}
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-rose-300 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>

                        {profileError && <p className="text-xs text-rose-500">{profileError}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Server sync is unavailable. This browser is using local fallback storage.
                      </p>
                    )}
                  </SettingSection>
                )}

                {visibleSectionIds.includes('integrations') && (
                  <RegisteredSettingsSection id="integrations" {...registeredSectionProps} />
                )}

                {visibleSectionIds.includes('data') && (
                  <SettingSection
                    id="data"
                    title="Tasks Data"
                    openSections={openSections}
                    toggleSection={toggleSection}
                    motionDuration={motionDuration}
                    motionEase={motionEase}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={exportTasks}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Download size={14} /> Export
                      </button>
                      <button
                        onClick={backupData}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Download size={14} /> Backup
                      </button>
                      <button
                        onClick={() => importInputRef.current?.click()}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Upload size={14} /> Import
                      </button>
                      <button
                        onClick={() => importCalendarInputRef.current?.click()}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Calendar size={14} /> Import ICS
                      </button>
                      <button
                        onClick={() => importPlanningInputRef.current?.click()}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Upload size={14} /> Import planning
                      </button>
                      <button
                        onClick={exportTaskSchema}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <FileJson size={14} /> Schema
                      </button>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Local backup history
                      </div>
                      {localBackups.length === 0 && (
                        <div className="text-xs text-slate-400">No local backups yet.</div>
                      )}
                      {localBackups.map((backup) => (
                        <div
                          key={backup.id}
                          className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-xs"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">{backup.profileName || backup.label}</div>
                            <div className="text-slate-400">
                              {new Date(backup.createdAt).toLocaleString()} · {backup.taskCount || 0} tasks
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => restoreLocalBackup?.(backup.id)}
                            className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 font-medium"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLocalBackup?.(backup.id)}
                            className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 font-medium text-rose-600"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      ref={importInputRef}
                      data-testid="tasks-import-input"
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onClose();
                        importTasks(file);
                      }}
                    />
                    <input
                      ref={importCalendarInputRef}
                      data-testid="ics-import-input"
                      type="file"
                      accept="text/calendar,.ics"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onClose();
                        importCalendarTasks(file);
                      }}
                    />
                    <input
                      ref={importPlanningInputRef}
                      data-testid="planning-import-input"
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onClose();
                        importPlanningData(file);
                      }}
                    />
                  </SettingSection>
                )}
                <div
                  data-testid="settings-build-metadata"
                  className="mt-4 border-t border-[var(--ui-border-subtle)] pt-3 text-[11px] text-[var(--ui-text-secondary)]"
                >
                  <div className="mb-1 font-semibold uppercase tracking-wider">Build</div>
                  <div className="grid gap-1 font-mono">
                    <div>Version: {appVersion}</div>
                    <div>Commit: {appBuildRef}</div>
                    <div>Built: {appBuildDate}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
