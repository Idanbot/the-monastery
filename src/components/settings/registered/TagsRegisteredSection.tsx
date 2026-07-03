import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useTaskContext } from '../../../contexts/TaskContext';
import { TagManagementSection } from '../TagManagementSection';
import type { RegisteredSectionProps } from './types';
export default function TagsRegisteredSection(props: RegisteredSectionProps) {
  const { settings } = useSettingsContext();
  const { tagPool, runTagTaxonomyCommand } = useTaskContext();
  return (
    <TagManagementSection
      {...props}
      settings={settings}
      knownTags={tagPool}
      onCommand={runTagTaxonomyCommand}
    />
  );
}
