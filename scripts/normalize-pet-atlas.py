#!/usr/bin/env python3
"""Normalize an AI-generated activity-pet export into the atlas contract.

Raw exports (see assets/pets/) pack sprites unevenly on a baked light
checkerboard. The runtime frame window then shows slices of neighboring
sprites ("multiple heads at once") and the pet drifts instead of staying
anchored. This script:

1. Keys the baked light background into real transparency (flood fill from
   the borders so enclosed whites such as eyes and marble survive).
2. Finds every sprite as a connected component, auto-detects the uneven
   grid from the sprite centroids, and assigns strays (sparkles, "Z"s) to
   the nearest body cell so straddling sprites stay whole.
3. Re-renders each animation onto its own row of a 2048x2048 atlas
   (16x16 grid of 128x128 cells), anchored bottom-center at a shared
   baseline with per-row scale normalization.

Usage:
    python3 scripts/normalize-pet-atlas.py assets/pets/kitten.png \
        --pet kitten --animations assets/pets/kitten.animations.json \
        --out public/pets/kitten/kitten-spritesheet.png \
        --manifest src/domain/generated/kittenAtlas.json

`--animations` maps animation names to
{"row": int, "startFrame": int, "frameCount": int} where row/frame index
the auto-detected source grid. Without it the script emits one atlas row
per detected source row.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

CELL = 128
GRID = 16
ATLAS = CELL * GRID
PIVOT_X = 64
BASELINE_Y = 116
MAX_SPRITE_W = 122
MAX_SPRITE_H = 110
BG_LUMINANCE = 222
MIN_BODY_AREA = 400
MIN_PART_AREA = 24

FOUR_WAY = np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]])
EIGHT_WAY = np.ones((3, 3))


def _label(mask: np.ndarray, structure: np.ndarray) -> tuple[np.ndarray, int]:
    labels, count = ndimage.label(mask, structure=structure)  # pyright: ignore[reportGeneralTypeIssues]
    return labels, int(count)


def key_background(rgb: np.ndarray) -> np.ndarray:
    """Return a soft alpha mask (0..1) with the baked light background removed."""
    bg_like = rgb.mean(axis=2) > BG_LUMINANCE

    # Flood the background from the borders through background-like pixels so
    # enclosed whites (eyes, marble highlights) stay opaque.
    labels, _ = _label(bg_like, FOUR_WAY)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, border[border != 0])
    foreground = ~background

    # Drop dust and fill pinholes.
    foreground = ndimage.binary_opening(foreground, structure=np.ones((2, 2)))
    foreground = ndimage.binary_closing(foreground, structure=np.ones((3, 3)))

    # Soft edges: blur the hard mask a little; the light fringe is later
    # decontaminated so no checker halo survives.
    return np.clip(ndimage.gaussian_filter(foreground.astype(np.float64), 1.1), 0.0, 1.0)


def defringe(rgb: np.ndarray, alpha: np.ndarray, bg: float = 248.0) -> np.ndarray:
    a = alpha[..., None]
    return np.where(a > 0.02, np.clip((rgb - (1 - a) * bg) / np.maximum(a, 0.05), 0, 255), rgb)


def find_components(alpha: np.ndarray):
    mask = alpha > 0.35
    labels, count = _label(mask, EIGHT_WAY)
    parts = []
    for index in range(1, count + 1):
        ys, xs = np.nonzero(labels == index)
        area = len(ys)
        if area < MIN_PART_AREA:
            continue
        parts.append(
            {
                "label": index,
                "area": area,
                "cx": float(xs.mean()),
                "cy": float(ys.mean()),
                "bbox": (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1),
            }
        )
    return labels, parts


def detect_cells(parts: list[dict]) -> tuple[dict[tuple[int, int], list[dict]], int]:
    """Group components into (row, col) cells.

    AI exports pack every row independently, so rows are clustered by y first
    and frames are the row's bodies ordered left to right. Small attachments
    (sparkles, "Z"s) join the nearest body so straddling pieces stay whole.
    """
    bodies = sorted((p for p in parts if p["area"] >= MIN_BODY_AREA), key=lambda p: p["cy"])
    attachments = [p for p in parts if p["area"] < MIN_BODY_AREA]

    rows: list[list[dict]] = []
    for body in bodies:
        # Hop rows spread their bodies vertically; 45px stays well below the
        # ~85px row pitch these exports use.
        if rows and body["cy"] - float(np.mean([b["cy"] for b in rows[-1]])) < 45:
            rows[-1].append(body)
        else:
            rows.append([body])

    cells: dict[tuple[int, int], list[dict]] = {}
    ordered_bodies: list[dict] = []
    for row_index, row_bodies in enumerate(rows):
        for col_index, body in enumerate(sorted(row_bodies, key=lambda p: p["cx"])):
            body["cell"] = (row_index, col_index)
            cells[(row_index, col_index)] = [body]
            ordered_bodies.append(body)

    for part in attachments:
        nearest = min(ordered_bodies, key=lambda b: (b["cx"] - part["cx"]) ** 2 + (b["cy"] - part["cy"]) ** 2)
        cells[nearest["cell"]].append(part)
    return cells, len(rows)


def render_atlas(rgb, alpha, labels, cells, animations):
    atlas_image = Image.new("RGBA", (ATLAS, ATLAS), (0, 0, 0, 0))
    manifest = {}

    # Per-source-row scale normalization: the median body height of the row
    # defines 100% scale; individual frames are clamped so bounce rows keep a
    # hint of squash without the head sliding around.
    row_median_h: dict[int, float] = {}
    for (row, _col), parts in cells.items():
        bodies = [p for p in parts if p["area"] >= MIN_BODY_AREA]
        if bodies:
            row_median_h[row] = float(np.median([p["bbox"][3] - p["bbox"][1] for p in bodies]))

    for anim_index, anim in enumerate(animations):
        src_row = anim["row"]
        start = anim.get("startFrame", 0)
        count = anim.get("frameCount", GRID)
        median_h = row_median_h.get(src_row)
        placed = 0
        for frame in range(count):
            parts = cells.get((src_row, start + frame))
            bodies = [p for p in parts or [] if p["area"] >= MIN_BODY_AREA]
            if not bodies:
                continue
            member_labels = {p["label"] for p in parts}
            x0 = min(p["bbox"][0] for p in parts)
            y0 = min(p["bbox"][1] for p in parts)
            x1 = max(p["bbox"][2] for p in parts)
            y1 = max(p["bbox"][3] for p in parts)
            pad = 3
            x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
            x1, y1 = min(rgb.shape[1], x1 + pad), min(rgb.shape[0], y1 + pad)

            member_mask = np.isin(labels[y0:y1, x0:x1], list(member_labels))
            region_alpha = np.where(member_mask, alpha[y0:y1, x0:x1], 0.0)
            region_rgb = defringe(rgb[y0:y1, x0:x1].astype(np.float64), region_alpha)

            # Scale and anchor from the largest body only (the character
            # itself). Secondary bodies (dust clouds, debris) and attachments
            # (sparkles, "Z"s) ride along and are clipped to the frame cell so
            # they can never pull the character off-center or bleed into a
            # neighbor frame.
            main_body = max(bodies, key=lambda b: b["area"])
            body_h = main_body["bbox"][3] - main_body["bbox"][1]
            body_w = main_body["bbox"][2] - main_body["bbox"][0]
            scale = 1.0 if not median_h else float(np.clip(median_h / body_h, 0.78, 1.28))
            fit = min(MAX_SPRITE_H / body_h, MAX_SPRITE_W / body_w) * scale
            h, w = region_alpha.shape
            new_w = max(1, int(round(w * fit)))
            new_h = max(1, int(round(h * fit)))

            sprite = np.dstack([region_rgb, region_alpha[..., None] * 255.0]).astype(np.uint8)
            image = Image.fromarray(sprite, "RGBA").resize((new_w, new_h), Image.LANCZOS)
            tile = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
            # Anchor: main body bbox center lands on the pivot; the lowest
            # body bottom stays on the baseline so hops rise off the ground.
            body_cx = (main_body["bbox"][0] + main_body["bbox"][2]) / 2
            body_bottom = max(b["bbox"][3] for b in bodies)
            px = PIVOT_X - int(round((body_cx - x0) * fit))
            py = BASELINE_Y - int(round((body_bottom - y0) * fit))
            tile.paste(image, (px, py), image)
            atlas_image.paste(tile, (frame * CELL, anim_index * CELL), tile)
            placed += 1
        if placed:
            manifest[anim["name"]] = {"row": anim_index, "frameCount": placed}
    return atlas_image, manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input", type=Path)
    parser.add_argument("--pet", required=True)
    parser.add_argument("--animations", type=Path, default=None, help="JSON animation-to-source-row mapping.")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGB")
    rgb = np.asarray(source).astype(np.float64)

    alpha = key_background(rgb)
    labels, parts = find_components(alpha)
    cells, row_count = detect_cells(parts)

    if args.animations:
        animations = json.loads(args.animations.read_text())
    else:
        animations = [{"name": f"row_{row}", "row": row, "frameCount": GRID} for row in range(row_count)]

    atlas_image, manifest_anims = render_atlas(rgb, alpha, labels, cells, animations)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    atlas_image.save(args.out, optimize=True)

    # Content-hash the atlas so the runtime can version the URL and bypass
    # stale caches (the PWA serves /pets/* cache-first for 30 days).
    version = hashlib.sha256(args.out.read_bytes()).hexdigest()[:12]

    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest = {
        "frameWidth": CELL,
        "frameHeight": CELL,
        "columns": GRID,
        "rows": GRID,
        "pivot": {"x": PIVOT_X, "y": BASELINE_Y},
        "version": version,
        "animations": manifest_anims,
    }
    args.manifest.write_text(json.dumps(manifest, indent=2) + "\n")

    used = {(a["row"], c) for a in animations for c in range(a.get("startFrame", 0), a.get("startFrame", 0) + a.get("frameCount", GRID))}
    unused = sorted((r, c) for (r, c) in cells if (r, c) not in used and any(p["area"] >= MIN_BODY_AREA for p in cells[(r, c)]))
    body_count = sum(1 for parts_in_cell in cells.values() for p in parts_in_cell if p["area"] >= MIN_BODY_AREA)
    print(f"{args.pet}: {row_count} rows, {body_count} bodies -> {args.out} ({args.out.stat().st_size // 1024} kB)")
    print(f"  animations: {json.dumps(manifest_anims)}")
    if unused:
        print(f"  note: {len(unused)} detected sprites not referenced by any animation: {unused[:12]}")


if __name__ == "__main__":
    main()
