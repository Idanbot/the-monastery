# Activity pet sprite sheets

The activity pet component ships with vector fallbacks and exposes its current state through
`data-activity` and `data-sprite-row`. A custom sprite renderer can replace those fallbacks with
transparent PNG or WebP sheets using this contract:

- Cell size: 64 x 64 pixels, no gutter or padding.
- Sheet size: 512 x 320 pixels (8 columns x 5 rows).
- Rows: idle, look, stretch, celebrate, sleepy.
- Frames: 8 left-to-right frames per row; use the first sleepy frame as the static no-streak pose.
- Playback: 120 ms per active frame with `steps(8)`; never animate the sleepy row.
- File names: `cat.webp`, `owl.webp`, and `rabbit.webp` under this directory.

Use lossless WebP or indexed PNG with a transparent background. Keep the subject inside a 56 x 56
pixel safe area so animation does not clip at module edges.
