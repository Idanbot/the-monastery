import { useSettingsContext } from '../../../contexts/SettingsContext';
import { BoardSettingsSection } from '../BoardSettingsSection';
import type { RegisteredSectionProps } from './types';
export default function BoardRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings } = useSettingsContext();
  return <BoardSettingsSection {...props} settings={settings} setSettings={setSettings} />;
}
