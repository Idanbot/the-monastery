import type { ActivityPetId } from './types';

export const activityPetOptions = [
  { id: 'cat', label: 'Cat' },
  { id: 'owl', label: 'Owl' },
  { id: 'rabbit', label: 'Rabbit' }
] as const satisfies readonly { id: ActivityPetId; label: string }[];
