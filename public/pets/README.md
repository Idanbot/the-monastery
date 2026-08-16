# Activity pet system

Activity pets are fixed, framed spritesheet avatars that react to activity, streaks, milestones,
inactivity, and future interaction events without moving across the application. The frame remains
anchored; only the sprite inside it changes.

## Pets

- `aurelius/aurelius-spritesheet.webp` - marble bust.
- `plato/plato-spritesheet.webp` - Plato marble bust.
- `aristotle/aristotle-spritesheet.webp` - Aristotle marble bust.
- `diogenes/diogenes-spritesheet.webp` - Diogenes marble bust.
- `socrates/socrates-spritesheet.webp` - Socrates marble bust.
- `hypatia/hypatia-spritesheet.webp` - Hypatia marble bust.
- `kitten/kitten-spritesheet.webp` - ginger kitten.
- `puppy/puppy-spritesheet.webp` - golden retriever puppy.
- `red-panda/red-panda-spritesheet.webp` - red panda.
- `raven/raven-spritesheet.webp` - raven.
- `tortoise/tortoise-spritesheet.webp` - Mediterranean tortoise.
- `owl/owl-spritesheet.webp` - tawny owl.
- `fox/fox-spritesheet.webp` - red fox.
- `axolotl/axolotl-spritesheet.webp` - pink axolotl.

All runtime atlases are transparent, lossless 2048 x 2048 WebP images generated from the raw PNG
exports in `assets/pets/` by `scripts/normalize-pet-atlas.py`. WebP reduces the current atlas payloads
by 26-37% without changing pixels. Never edit generated atlases by hand; change the raw export or
animation mapping and regenerate.

## Display contract

- Desktop avatar frame: 80 x 80 CSS px.
- Mobile avatar frame: 56 x 56 CSS px.
- Source frame: 128 x 128 px.
- Anchor and pivot: bottom-center, `(64, 116)` in each source cell, baked in by the normalizer.
- Container overflow: hidden.
- Every frame keeps the pet at the same scale and anchor; animations read as pose changes, not
  sliding.
- The pet may move inside its frame but must never translate across the screen.
- The frame must not block controls or carry information available only through animation.

## Atlas contract

Every pet atlas is a lossless transparent WebP:

- 2048 x 2048 atlas, 16 columns x 16 rows, 128 x 128 cells with no gutter.
- One animation per row, frames compacted from column 0, unused cells fully transparent.
- Consistent bottom-center pivot, resting pose, and scale across all rows.

Because the contract is enforced at build time, the runtime uses plain grid math
(`x = frame / 15`, `y = row / 15` as percentages) and never sees slices of neighboring sprites.

The runtime appends the manifest's content-hash `version` to the atlas URL
(`/pets/<id>/<id>-spritesheet.webp?v=<hash>`): the PWA serves `/pets/*` cache-first, so regenerating
an atlas without a new URL would keep showing the stale cached sheet (misaligned frames, neighbor
slices, baked background) for weeks. The normalizer rehashes on every run, so always regenerate the
manifest together with the WebP and commit both.

`npm run pets:validate` is the CI contract gate. It verifies WebP structure and dimensions, content
hashes, file size, animation rows and frame counts, transparent corners, complete opaque frames,
and the normalizer's centroid and baseline drift limits.

| Row | Animation          | FPS | Playback         |
| --: | ------------------ | --: | ---------------- |
|   0 | `idle_breathe`     |   3 | loop             |
|   1 | `idle_blink`       |   4 | one-shot ambient |
|   2 | `look_left_right`  |   4 | one-shot ambient |
|   3 | `idle_fidget`      |   3 | one-shot ambient |
|   4 | `yawn`             |   4 | one-shot ambient |
|   5 | `sleep`            | 2.5 | loop             |
|   6 | `wake_up`          |   5 | transition       |
|   7 | `streak_lost`      |   5 | transition       |
|   8 | `ready_bounce`     |   5 | loop             |
|   9 | `focused_idle`     |   4 | loop             |
|  10 | `energized_bounce` |   6 | loop             |
|  11 | `small_success`    |   6 | one-shot         |
|  12 | `big_success`      |   7 | one-shot         |
|  13 | `power_up`         |   8 | transition       |
|  14 | `powered_idle`     |   5 | loop             |
|  15 | `celebrate`        |   7 | one-shot         |

Frame counts per pet live in the generated manifests (`src/domain/generated/*Atlas.json`), not in
UI components. Behavior (FPS, playback, priority, transitions) lives in `src/domain/activityPets.ts`.

## State model

Persistent state uses an activity score and hysteresis-ready thresholds:

| State       |                   Score | Default loop       |
| ----------- | ----------------------: | ------------------ |
| `dormant`   |                    0-15 | `sleep`            |
| `calm`      |                   16-39 | `idle_breathe`     |
| `engaged`   |                   40-69 | `focused_idle`     |
| `energized` |                   70-89 | `energized_bounce` |
| `powered`   | 90-100 or active streak | `powered_idle`     |

Temporary events map to reactions and then return to the current persistent loop:

- Task completed: `small_success`.
- Milestone reached: `big_success`.
- Streak started: `power_up`, then `powered_idle`.
- Streak lost: `streak_lost`, then `idle_breathe`.
- User returned: `wake_up`, then the current loop.

Priority order is state transitions, major milestones, streak events, task completions, interaction,
then ambient animation. High-priority reactions may interrupt lower-priority ones. Duplicate events
should collapse rather than queue indefinitely.

## Runtime rules

- Pause playback while the document is hidden.
- Respect the global animation setting and `prefers-reduced-motion`.
- Reduced motion uses the first frame of the selected loop.
- Keep animation definitions, priorities, categories, and transitions in the manifest.
- Cache one atlas per pet; do not decode individual frame files.
- Use only one ambient animation at a time.
- Keep sprite layers non-interactive. Add a separate hitbox if pet interaction is introduced.
- Avoid flashing, shaking, and continuous high-energy motion near reading surfaces.

## Adding a pet

1. Add the pet to `shared/activityPets.ts` and save its raw export (an unevenly packed AI sheet on a
   light background is fine) as
   `assets/pets/<pet-id>.png`.
2. Select the shared `thinker` or `creature` atlas preset in the catalog. Add a named preset under
   `assets/pets/presets/` only when the source layout genuinely differs, as Fox does.
3. Regenerate the atlas and manifest:

   ```sh
   npm run pets:build -- --pet <pet-id>
   ```

4. Import the generated manifest in `src/domain/activityPets.ts`. The catalog automatically drives
   the ID type, server validation, persistence allow-list, and settings picker. Unknown stored IDs
   keep migrating to `aurelius`.
5. Run `npm run pets:validate` and add manifest, frame progression, reduced-motion, and visual
   framing tests.
6. Verify the desktop 80 px and mobile 56 px frames without clipping or layout overlap.
