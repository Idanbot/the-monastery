import type { CSSProperties } from 'react';

/**
 * Build a React style object that may include CSS custom properties (--foo).
 * React's CSSProperties type does not allow arbitrary custom properties, so
 * callers previously cast with `as any` / `as CSSProperties`. This helper
 * centralises the cast so the rest of the codebase stays type-clean.
 */
export function cssVars(vars: Record<string, string | number | undefined>): CSSProperties {
  return vars as CSSProperties;
}
