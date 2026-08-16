import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import { ChevronsDown, ChevronsUp, Settings2, X } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useThemeStyle } from '../../hooks/useThemeStyle';
import { Button } from '../ui/Button';
import { themedSurfaceClassName } from '../ui/themedSurfaceStyles';
import { RegisteredSettingsSection } from './RegisteredSettingsSection';
import {
  settingsSectionIds,
  settingsSectionRegistry,
  type RegisteredSettingsSectionId
} from './settingsSectionRegistry';

const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const appBuildRef = typeof __APP_BUILD_REF__ === 'string' ? __APP_BUILD_REF__ : 'local';
const appBuildDate = typeof __APP_BUILD_DATE__ === 'string' ? __APP_BUILD_DATE__ : 'unknown';

const isRegisteredSection = (value: string | null): value is RegisteredSettingsSectionId =>
  Boolean(value && settingsSectionIds.includes(value as RegisteredSettingsSectionId));

export function SettingsModal({
  initialSection = null,
  onClose
}: {
  initialSection?: string | null;
  onClose: () => void;
}) {
  const { settings, isDarkMode } = useSettingsContext();
  const scopedSection = isRegisteredSection(initialSection) ? initialSection : null;
  const isScopedSettings = scopedSection !== null;
  const visibleSectionIds = scopedSection ? [scopedSection] : settingsSectionIds;
  const {
    animationsEnabled,
    motionDuration,
    motionEase,
    themeStyle: resolvedThemeStyle,
    modalEffectStyle
  } = useThemeStyle(settings, isDarkMode);
  const themeStyle = useMemo(
    () => ({ ...resolvedThemeStyle, ...modalEffectStyle }),
    [resolvedThemeStyle, modalEffectStyle]
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(settingsSectionIds.map((id) => [id, id === scopedSection]))
  );

  useEffect(() => {
    setOpenSections(Object.fromEntries(settingsSectionIds.map((id) => [id, id === scopedSection])));
  }, [scopedSection]);

  const toggleSection = (id: string) => setOpenSections((previous) => ({ ...previous, [id]: !previous[id] }));
  const setAllSections = (isOpen: boolean) =>
    setOpenSections(Object.fromEntries(settingsSectionIds.map((id) => [id, isOpen])));
  const openOnlySection = (id: RegisteredSettingsSectionId) =>
    setOpenSections(Object.fromEntries(settingsSectionIds.map((sectionId) => [sectionId, sectionId === id])));
  const registeredSectionProps = { openSections, toggleSection, motionDuration, motionEase, onClose };

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
        <Dialog.Content asChild onInteractOutside={(event) => event.preventDefault()}>
          <motion.div
            data-visual-theme={settings.visualTheme}
            data-animations-enabled={animationsEnabled ? 'true' : 'false'}
            style={themeStyle}
            className={themedSurfaceClassName(
              'modal',
              `${isDarkMode ? 'dark' : ''} fixed left-1/2 top-[53vh] z-[101] flex h-[min(78vh,780px)] max-h-[78vh] w-[calc(100vw-1rem)] ${isScopedSettings ? 'max-w-3xl' : 'max-w-5xl'} flex-col overflow-hidden rounded-2xl border shadow-2xl`
            )}
            initial={{ opacity: 0, scale: 0.97, x: '-50%', y: '-48%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            transition={{ duration: motionDuration, ease: motionEase }}
          >
            <div
              className={themedSurfaceClassName(
                'panel',
                'flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40'
              )}
            >
              <Dialog.Title className="flex items-center gap-2 text-lg font-bold">
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
                  {settingsSectionRegistry.map(({ id, label, description }) => (
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
                {visibleSectionIds.map((id) => (
                  <RegisteredSettingsSection key={id} id={id} {...registeredSectionProps} />
                ))}
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
