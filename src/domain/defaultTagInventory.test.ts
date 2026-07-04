import { describe, expect, it } from 'vitest';
import { defaultTagInventory } from './defaultTagInventory';

describe('default tag inventory', () => {
  it('provides a broad, unique catalog for task classification', () => {
    expect(defaultTagInventory).toHaveLength(500);
    expect(defaultTagInventory).toEqual(
      expect.arrayContaining([
        'kubernetes',
        'idempotency',
        'incident-response',
        'deep-work',
        'cloud-run',
        'azure-functions',
        'eventbridge',
        'crossplane',
        'react',
        'spring-boot'
      ])
    );
    expect(new Set(defaultTagInventory.map((tag) => tag.toLowerCase())).size).toBe(
      defaultTagInventory.length
    );
  });
});
