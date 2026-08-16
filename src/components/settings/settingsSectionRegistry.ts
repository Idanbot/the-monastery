export const settingsSectionRegistry = [
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme, type, and motion',
    load: () => import('./registered/AppearanceRegisteredSection')
  },
  {
    id: 'main',
    label: 'Main view',
    description: 'Four dashboard quarters',
    load: () => import('./registered/MainViewRegisteredSection')
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Playback and focus audio',
    load: () => import('./registered/MediaRegisteredSection')
  },
  {
    id: 'time',
    label: 'Time',
    description: 'Clock and timeline',
    load: () => import('./registered/TimeRegisteredSection')
  },
  {
    id: 'board',
    label: 'Board',
    description: 'Layout and task cards',
    load: () => import('./registered/BoardRegisteredSection')
  },
  {
    id: 'tags',
    label: 'Tags',
    description: 'Inventory and relationships',
    load: () => import('./registered/TagsRegisteredSection')
  },
  {
    id: 'roles',
    label: 'Roles',
    description: 'Responsibilities and goals',
    load: () => import('./registered/RolesRegisteredSection')
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Workspaces and milestones',
    load: () => import('./registered/ProjectsRegisteredSection')
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    description: 'Focus widgets',
    load: () => import('./registered/SidebarRegisteredSection')
  },
  {
    id: 'profiles',
    label: 'Profiles',
    description: 'People and workspaces',
    load: () => import('./registered/ProfilesRegisteredSection')
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Alerts and automation',
    load: () => import('./registered/IntegrationsRegisteredSection')
  },
  {
    id: 'data',
    label: 'Data',
    description: 'Import, export, and backup',
    load: () => import('./registered/DataRegisteredSection')
  }
] as const;

export type RegisteredSettingsSectionId = (typeof settingsSectionRegistry)[number]['id'];
export const settingsSectionIds = settingsSectionRegistry.map((section) => section.id);
export const findSettingsSection = (id: string) =>
  settingsSectionRegistry.find((section) => section.id === id);
