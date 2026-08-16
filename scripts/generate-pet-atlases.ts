import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { activityPetCatalog, isActivityPetId } from '../shared/activityPets.js';

const requestedIndex = process.argv.indexOf('--pet');
const requestedPet = requestedIndex >= 0 ? process.argv[requestedIndex + 1] : undefined;
if (requestedPet && !isActivityPetId(requestedPet)) {
  throw new Error(`Unknown activity pet: ${requestedPet}`);
}

const pets = requestedPet ? activityPetCatalog.filter(({ id }) => id === requestedPet) : activityPetCatalog;

for (const { id, atlasPreset } of pets) {
  const source = `assets/pets/${id}.png`;
  const animations = `assets/pets/presets/${atlasPreset}.json`;
  if (!existsSync(source)) throw new Error(`Missing pet source: ${source}`);
  if (!existsSync(animations)) throw new Error(`Missing animation preset: ${animations}`);

  const result = spawnSync(
    'python3',
    [
      'scripts/normalize-pet-atlas.py',
      source,
      '--pet',
      id,
      '--animations',
      animations,
      '--out',
      `public/pets/${id}/${id}-spritesheet.webp`,
      '--manifest',
      `src/domain/generated/${id}Atlas.json`
    ],
    { stdio: 'inherit' }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
