# Sweetardios — "The Lineage" title sequence

A 1:1 (1080×1080), ~32.4s, **transparent-background**, text-only kinetic-typography
video that traces the on-chain lineage down to Sweetardios. Built entirely from the
Sweetardios palette (see `../../BRAND.md`) in the brand display face *Pusia Bold*.

The narration (on-screen text):

> **THE LINEAGE** — *Every dynasty begins with a single muse.*
> **2021 / MILADY** — *In the beginning, there was the muse.*
> **2022 / REMILIA** — *From the muse, a movement was born.*
> **2024 / RETARDIOS** — *The bloodline broke free and ran wild.*
> **2025 / GORBAGIOS** — *The degenerates made the garbage a kingdom.*
> **MMXXVI / SWEETARDIOS** — *From all who came before — the sweetest of them all.*
> **SWEETARDED GAMES** — *the lineage continues.*

## Files

| File | Use | Notes |
| ---- | --- | ----- |
| `sweetardios-lineage.webm` | **Overlay deliverable** | VP9 + alpha. For web, OBS, social, editors. |
| `sweetardios-lineage.mov`  | Pro editing master | ProRes 4444 + alpha (~234 MB, git-ignored — regenerate below). |
| `sweetardios-lineage-preview.mp4` | Quick preview / approval | Composited over Oxford Blue (`#070F34`), no alpha. |

## Using the transparent WebM as an overlay

In a browser, just stack it over your content:

```html
<video src="/video/sweetardios-lineage.webm" autoplay muted loop playsinline
       style="position:absolute; inset:0; width:100%; height:100%;"></video>
```

> **ffmpeg note:** ffmpeg's *native* VP9 decoder drops the alpha plane. When
> compositing the webm with ffmpeg, force the libvpx decoder on input:
> `ffmpeg -c:v libvpx-vp9 -i sweetardios-lineage.webm ...`
> Browsers, OBS, and most NLEs handle the alpha automatically.

## Regenerate

```bash
# needs python3 (Pillow, numpy) + ffmpeg (libvpx-vp9 + prores_ks)
bash scripts/render_lineage.sh
```

Edit the storyboard (copy, timing, colors, generations) in
`scripts/lineage_video.py` → `CHAPTERS`.
