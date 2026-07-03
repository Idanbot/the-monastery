import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useProfileContext } from '../../../contexts/ProfileContext';
import { useTaskContext } from '../../../contexts/TaskContext';
import { IntegrationSettingsSection } from '../IntegrationSettingsSection';
import { SettingSection } from '../SettingSection';
import type { RegisteredSectionProps } from './types';
export default function IntegrationsRegisteredSection(props: RegisteredSectionProps) {
  const { settings, setSettings } = useSettingsContext();
  const { tasks } = useTaskContext();
  const { setImportPreview, isBackendAvailable } = useProfileContext();
  return (
    <SettingSection id="integrations" title="Integrations" {...props}>
      <IntegrationSettingsSection
        settings={settings}
        setSettings={setSettings}
        tasks={tasks}
        setImportPreview={setImportPreview}
        isBackendAvailable={isBackendAvailable}
      />
    </SettingSection>
  );
}
