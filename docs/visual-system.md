# Visual System

The Monastery separates content surfaces from navigation and controls. This keeps dense task information readable while allowing themes, including Liquid Glass, to give the application a distinct character.

## Semantic Tokens

Theme contracts in `src/domain/themes.ts` resolve these CSS properties:

- `--ui-canvas`
- `--ui-surface`, `--ui-surface-muted`, and `--ui-surface-raised`
- `--ui-control`
- `--ui-text-primary` and `--ui-text-secondary`
- `--ui-border-subtle` and `--ui-border-strong`
- `--ui-focus-ring`
- `--ui-success`, `--ui-warning`, `--ui-danger`, and `--ui-info`

Use the semantic classes in `src/index.css` rather than theme-specific color utilities for shared components. Add a token only when it represents a reusable visual role, not a single component value.

## Materials

Use standard semantic surfaces for task cards, lanes, settings content, forms, and other information-dense regions. Apply `data-material` only to functional chrome such as the app header, mobile navigation, sidebars, menus, widgets, and modals.

Liquid Glass styles explicit material layers. It must not make primary content translucent or apply blur to every rounded container.

## Components

- Use `Button` for commands and `ThemedSurface` for shared containers.
- Keep touch targets at least 44px on mobile.
- Expose icon-only controls with an accessible label and tooltip where context is not obvious.
- Respect reduced-motion, reduced-transparency, and increased-contrast preferences.
- Keep letter spacing at zero and use the native system font stack unless a theme intentionally overrides it.

## Adding A Theme

1. Add the theme contract and light/dark tokens in `src/domain/themes.ts`.
2. Add its gallery option and group classification in `src/domain/themeGallery.ts`.
3. Run the theme token, contrast, and gallery component tests.
4. Inspect both light and dark gallery snapshots and the settings modal snapshot.
5. Run `npm run test:e2e -- e2e/visual.spec.ts` before committing.
