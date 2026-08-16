import { describe, expect, it } from 'vitest';
import { activityPetCatalog, activityPetIds, isActivityPetId } from './activityPets.js';

describe('activity pet catalog', () => {
  it('provides one unique canonical entry for every supported companion', () => {
    expect(activityPetCatalog).toHaveLength(14);
    expect(new Set(activityPetIds).size).toBe(activityPetCatalog.length);
    expect(activityPetCatalog.map(({ id }) => id)).toEqual(activityPetIds);
  });

  it('exposes safe runtime membership checks', () => {
    expect(isActivityPetId('hypatia')).toBe(true);
    expect(isActivityPetId('hamster')).toBe(false);
    expect(isActivityPetId(null)).toBe(false);
  });
});
