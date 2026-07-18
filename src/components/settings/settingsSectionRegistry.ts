export const settingsSectionRegistry = [
  { id: 'main', load: () => import('./registered/MainViewRegisteredSection') },
  { id: 'media', load: () => import('./registered/MediaRegisteredSection') },
  { id: 'time', load: () => import('./registered/TimeRegisteredSection') },
  { id: 'board', load: () => import('./registered/BoardRegisteredSection') },
  { id: 'tags', load: () => import('./registered/TagsRegisteredSection') },
  { id: 'projects', load: () => import('./registered/ProjectsRegisteredSection') },
  { id: 'sidebar', load: () => import('./registered/SidebarRegisteredSection') },
  { id: 'integrations', load: () => import('./registered/IntegrationsRegisteredSection') }
] as const;

export type RegisteredSettingsSectionId = (typeof settingsSectionRegistry)[number]['id'];
export const settingsSectionIds = settingsSectionRegistry.map((section) => section.id);
export const findSettingsSection = (id: string) =>
  settingsSectionRegistry.find((section) => section.id === id);
