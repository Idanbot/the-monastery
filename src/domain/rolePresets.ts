import type { RoleDefinition } from './types';
import { generateId } from './tasks';

export type RolePreset = {
  id: string;
  name: string;
  tags: string[];
  weeklyTargetHours: number;
};

export const rolePresets: RolePreset[] = [
  {
    id: 'backend',
    name: 'Backend',
    tags: ['backend', 'api', 'database', 'node', 'python'],
    weeklyTargetHours: 5
  },
  {
    id: 'frontend',
    name: 'Frontend',
    tags: ['frontend', 'react', 'css', 'ui', 'typescript'],
    weeklyTargetHours: 5
  },
  {
    id: 'devops',
    name: 'DevOps',
    tags: ['devops', 'docker', 'kubernetes', 'ci', 'terraform'],
    weeklyTargetHours: 4
  },
  {
    id: 'cloud',
    name: 'Cloud',
    tags: ['aws', 'gcp', 'azure', 'networking', 'infrastructure'],
    weeklyTargetHours: 4
  },
  {
    id: 'security',
    name: 'Security',
    tags: ['security', 'auth', 'threat-modeling', 'vulnerability', 'hardening'],
    weeklyTargetHours: 3
  },
  {
    id: 'data',
    name: 'Data',
    tags: ['sql', 'analytics', 'etl', 'warehouse', 'python'],
    weeklyTargetHours: 4
  },
  { id: 'ai-ml', name: 'AI/ML', tags: ['ml', 'ai', 'llm', 'pytorch', 'python'], weeklyTargetHours: 4 },
  {
    id: 'qa',
    name: 'QA',
    tags: ['testing', 'e2e', 'playwright', 'automation', 'quality'],
    weeklyTargetHours: 3
  },
  {
    id: 'mobile',
    name: 'Mobile',
    tags: ['mobile', 'ios', 'android', 'react-native', 'swift'],
    weeklyTargetHours: 3
  },
  {
    id: 'product',
    name: 'Product',
    tags: ['product', 'planning', 'ux', 'research', 'strategy'],
    weeklyTargetHours: 3
  }
];

export const createRoleFromPreset = (preset: RolePreset): RoleDefinition => ({
  id: generateId(),
  name: preset.name,
  tags: [...preset.tags],
  dailyTargetHours: 0,
  weeklyTargetHours: preset.weeklyTargetHours,
  monthlyTargetHours: 0
});
