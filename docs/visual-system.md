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
- `--ui-radius-control` and `--ui-radius-panel`
- `--ui-shadow-sm`, `--ui-shadow-md`, and `--ui-shadow-lg`
- `--ui-font-ui`, `--ui-font-heading`, and `--ui-font-mono`
- `--ui-leading-tight`, `--ui-leading-body`, and `--ui-motion-ease`

Use the semantic classes in `src/index.css` rather than theme-specific color utilities for shared components. Add a token only when it represents a reusable visual role, not a single component value.

## Materials

Use standard semantic surfaces for task cards, lanes, settings content, forms, and other information-dense regions. Apply `data-material` only to functional chrome such as the app header, mobile navigation, sidebars, menus, widgets, and modals.

Liquid Glass styles explicit material layers. It must not make primary content translucent or apply blur to every rounded container.

Glass themes use translucency for functional chrome, overlays, and the primary focus module. Task cards, forms, and other dense content resolve to opaque semantic surfaces. Obsidian Glass and Liquid Glass use the same material contract, so components do not need theme-specific branches.

## Components

- Use `Button` for commands and `ThemedSurface` for shared containers.
- Use `ThemedSurface` variants `modal` and `overlay` for every dialog pair; these provide the shared scrim, readable surface, radius, elevation, and motion contract.
- Keep touch targets at least 44px on mobile.
- Expose icon-only controls with an accessible label and tooltip where context is not obvious.
- Respect reduced-motion, reduced-transparency, and increased-contrast preferences.
- Keep letter spacing at zero and use the native system font stack unless a theme intentionally overrides it.

## Workspace Hierarchy

- Keep desktop navigation, search, status, and global actions in the single-row app toolbar.
- Treat the focus module as the visual anchor. Supporting modules use quieter opaque surfaces and lower elevation.
- Task cards lead with title and active state, then subtask progress, schedule metadata, and at most two visible tags.
- Mobile navigation exposes Focus, Tasks, Calendar, and More around the central create action. Secondary destinations live in the bottom sheet.

## Motion

Use short state transitions with `--ui-motion-ease`. Layout motion may clarify task reordering, while theme changes, dialogs, and hover states should remain under 200ms. Every animation must stop when animations are disabled or `prefers-reduced-motion` is active.

## Quality Gates

The in-app visual system preview under Appearance is the component gallery for functional chrome and content surfaces. Keep it updated when adding a shared primitive.

- `npm run test:ui` runs desktop/mobile snapshots, accessibility checks, touch-target checks, overflow checks, and reduced-motion/forced-color checks.
- `npm run test:e2e -- e2e/visual.spec.ts --update-snapshots` updates intentional visual baselines.
- The 1080px desktop header and 390px mobile shell are required responsive checkpoints.
- Do not relax screenshot thresholds to accept an unexplained visual change; inspect and update the baseline when the change is intentional.

## Adding A Theme

1. Add the theme contract and light/dark tokens in `src/domain/themes.ts`.
2. Add its gallery option and group classification in `src/domain/themeGallery.ts`.
3. Run the theme token, contrast, and gallery component tests.
4. Inspect both light and dark gallery snapshots and the settings modal snapshot.
5. Run `npm run test:e2e -- e2e/visual.spec.ts` before committing.
