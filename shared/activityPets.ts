export const activityPetCatalog = [
  { id: 'aurelius', label: 'Aurelius', group: 'Thinkers', atlasPreset: 'thinker' },
  { id: 'plato', label: 'Plato', group: 'Thinkers', atlasPreset: 'thinker' },
  { id: 'aristotle', label: 'Aristotle', group: 'Thinkers', atlasPreset: 'thinker' },
  { id: 'diogenes', label: 'Diogenes', group: 'Thinkers', atlasPreset: 'thinker' },
  { id: 'socrates', label: 'Socrates', group: 'Thinkers', atlasPreset: 'thinker' },
  { id: 'hypatia', label: 'Hypatia', group: 'Thinkers', atlasPreset: 'thinker' },
  { id: 'kitten', label: 'Kitten', group: 'Creatures', atlasPreset: 'creature' },
  { id: 'puppy', label: 'Puppy', group: 'Creatures', atlasPreset: 'creature' },
  { id: 'red-panda', label: 'Red Panda', group: 'Creatures', atlasPreset: 'creature' },
  { id: 'raven', label: 'Raven', group: 'Creatures', atlasPreset: 'creature' },
  { id: 'tortoise', label: 'Tortoise', group: 'Creatures', atlasPreset: 'creature' },
  { id: 'owl', label: 'Owl', group: 'Creatures', atlasPreset: 'creature' },
  { id: 'fox', label: 'Fox', group: 'Creatures', atlasPreset: 'fox' },
  { id: 'axolotl', label: 'Axolotl', group: 'Creatures', atlasPreset: 'creature' }
] as const;

export type ActivityPetId = (typeof activityPetCatalog)[number]['id'];
export type ActivityPetGroup = (typeof activityPetCatalog)[number]['group'];

export const activityPetIds = activityPetCatalog.map(({ id }) => id) as [ActivityPetId, ...ActivityPetId[]];

const activityPetIdSet = new Set<string>(activityPetIds);

export const isActivityPetId = (value: unknown): value is ActivityPetId =>
  typeof value === 'string' && activityPetIdSet.has(value);
