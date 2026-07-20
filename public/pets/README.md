# Activity pet system

Activity pets are fixed, framed spritesheet avatars that react to activity, streaks, milestones,
inactivity, and future interaction events without moving across the application. The frame remains
anchored; only the sprite inside it changes.

## Pets

- `aurelius/aurelius-spritesheet.png` — marble bust.
- `kitten/kitten-spritesheet.png` — ginger kitten.
- `puppy/puppy-spritesheet.png` — golden retriever puppy.

All atlases are true transparent 2048 x 2048 PNGs generated from the raw exports in `assets/pets/`
by `scripts/normalize-pet-atlas.py`. Never edit the generated atlases by hand; change the raw export
or the animation mapping and regenerate.

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

Every pet atlas is a lossless transparent PNG:

- 2048 x 2048 atlas, 16 columns x 16 rows, 128 x 128 cells with no gutter.
- One animation per row, frames compacted from column 0, unused cells fully transparent.
- Consistent bottom-center pivot, resting pose, and scale across all rows.

Because the contract is enforced at build time, the runtime uses plain grid math
(`x = frame / 15`, `y = row / 15` as percentages) and never sees slices of neighboring sprites.

The runtime appends the manifest's content-hash `version` to the atlas URL
(`/pets/<id>/<id>-spritesheet.png?v=<hash>`): the PWA serves `/pets/*` cache-first, so regenerating
an atlas without a new URL would keep showing the stale cached sheet (misaligned frames, neighbor
slices, baked background) for weeks. The normalizer rehashes on every run, so always regenerate the
manifest together with the PNG and commit both.

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

1. Save the raw export (an unevenly packed AI sheet on a light background is fine) as
   `assets/pets/<pet-id>.png`.
2. Map the standard animations to its rows in `assets/pets/<pet-id>.animations.json`
   (`{"name", "row", "startFrame", "frameCount"}` per animation; several animations may share one
   source row). Rows and frames index the auto-detected grid, top to bottom, left to right.
3. Regenerate the atlas and manifest:

   ```sh
   python3 scripts/normalize-pet-atlas.py assets/pets/<pet-id>.png \
     --pet <pet-id> --animations assets/pets/<pet-id>.animations.json \
     --out public/pets/<pet-id>/<pet-id>-spritesheet.png \
     --manifest src/domain/generated/<pet-id>Atlas.json
   ```

4. Extend `ActivityPetId` in `src/domain/types.ts`, the settings schema in `server/validation.ts`,
   the merge allow-list in `src/domain/tasks.ts`, and the registry in `src/domain/activityPets.ts`.
   Unknown stored IDs keep migrating to `aurelius`.
5. Add manifest, frame progression, reduced-motion, and visual framing tests.
6. Verify the desktop 80 px and mobile 56 px frames without clipping or layout overlap.
