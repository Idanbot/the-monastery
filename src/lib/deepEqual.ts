/**
 * Structural deep-equal that short-circuits early instead of serialising both
 * sides to strings. Used by the sync layer to decide whether a tasks/settings
 * snapshot changed since the last persisted baseline.
 *
 * `JSON.stringify(a) === JSON.stringify(b)` is O(n) over the whole object on
 * every comparison and is fragile to key-order differences. This walks
 * references and returns false as soon as a divergence is found, so a single
 * field change on a large array is detected without serialising the rest.
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object') {
    if (typeof b !== 'object' || Array.isArray(b)) return false;
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    for (const key of aKeys) {
      if (!(key in bRecord)) return false;
      if (!deepEqual(aRecord[key], bRecord[key])) return false;
    }
    return true;
  }

  return false;
};
