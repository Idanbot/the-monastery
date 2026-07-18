# Activity pet system

Activity pets are fixed, framed spritesheet avatars that react to activity, streaks, milestones,
inactivity, and future interaction events without moving across the application. The frame remains
anchored; only the sprite inside it changes.

## Current pet

`aurelius/aurelius-spritesheet.png` is the only supported pet. The application renders it through a
data-driven manifest in `src/domain/activityPets.ts` and migrates the removed `cat`, `owl`, and
`rabbit` settings to `aurelius`.

The current Aurelius source is a 1254 x 1254 RGB export with 16 columns and 15 physical rows. The
runtime maps the 16 logical animations onto those rows (the ready and focused loops share source row 8) and records explicit vertical offsets because the rows are unevenly packed. Horizontal cells use
percentage positions so their fractional widths stay aligned. Its checkerboard is baked into the
image. Replace it with a true transparent 2048 x 2048 PNG when the source artwork is available; do
not flatten a transparency preview into the exported image.

## Display contract

- Desktop avatar frame: 80 x 80 CSS px.
- Mobile avatar frame: 56 x 56 CSS px.
- Source frame: 128 x 128 px.
- Anchor and pivot: bottom-center, nominally `(64, 116)` in each source cell.
- Container overflow: hidden.
- Every frame must keep the pet at the same scale and anchor.
- The pet may move inside its frame but must never translate across the screen.
- The frame must not block controls or carry information available only through animation.

## Atlas contract

Future sheets must use:

- Lossless transparent PNG or WebP.
- 2048 x 2048 atlas.
- 16 columns x 16 rows.
- 128 x 128 cells with no gutter.
- One animation per row and transparent unused cells.
- Consistent bottom-center pivot, resting pose, and scale.

| Row | Animation          | Frames | FPS | Playback         |
| --: | ------------------ | -----: | --: | ---------------- |
|   0 | `idle_breathe`     |      8 |   6 | loop             |
|   1 | `idle_blink`       |      6 |   8 | one-shot ambient |
|   2 | `look_left_right`  |      8 |   8 | one-shot ambient |
|   3 | `idle_fidget`      |      8 |   6 | one-shot ambient |
|   4 | `yawn`             |     10 |   8 | one-shot ambient |
|   5 | `sleep`            |      8 |   5 | loop             |
|   6 | `wake_up`          |     10 |  10 | transition       |
|   7 | `streak_lost`      |     12 |  10 | transition       |
|   8 | `ready_bounce`     |      8 |  10 | loop             |
|   9 | `focused_idle`     |      8 |   8 | loop             |
|  10 | `energized_bounce` |     10 |  12 | loop             |
|  11 | `small_success`    |      8 |  12 | one-shot         |
|  12 | `big_success`      |     14 |  14 | one-shot         |
|  13 | `power_up`         |     14 |  16 | transition       |
|  14 | `powered_idle`     |      8 |  10 | loop             |
|  15 | `celebrate`        |     14 |  14 | one-shot         |

Do not hard-code these ranges in UI components. Add each pet's source and manifest to the domain
registry, then add its ID to `ActivityPetId`.

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

1. Export a transparent 2048 x 2048 atlas that follows the row table and pivot contract.
2. Add it under `public/pets/<pet-id>/<pet-id>-spritesheet.png`.
3. Add a typed manifest and option in `src/domain/activityPets.ts`.
4. Extend `ActivityPetId` and preserve migration behavior for removed IDs.
5. Add manifest, frame progression, reduced-motion, and visual framing tests.
6. Verify the desktop 80 px and mobile 56 px frames without clipping or layout overlap.
