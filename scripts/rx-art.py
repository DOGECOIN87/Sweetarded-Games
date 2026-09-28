#!/usr/bin/env python3
"""Build the web copies of the locked After Hours Rx art.

The files in public/rx/ are the locked originals and are never edited. This
script derives what the site actually serves, into public/rx/web/:

  * rooms      -> WebP at native size (the PNGs are 2+ MB each)
  * props      -> trimmed to their painted edge, WebP with alpha
  * papers     -> the black matte they were delivered on is keyed out so the
                  paper can sit on top of a room (the phone notice included);
                  the painting is untouched
  * street     -> 1200x630 link-preview card in public/

The favicons and app icons in public/ are the Sweetardio Collection badge and
are not generated here.

Keying: every paper was delivered composited onto near-black. Pixels that are
dark AND connected to the image border are background; their alpha ramps from
0 (at T_LO) to 1 (at T_HI) and their colour is un-premultiplied, so soft edges
and drop shadows survive instead of leaving a black fringe. Dark ink inside
the paper is never touched because it is not connected to the border.

Usage: python3 scripts/rx-art.py   (needs Pillow + numpy)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'rx'
OUT = SRC / 'web'
PUBLIC = ROOT / 'public'

T_LO, T_HI = 14, 46


def grow(region: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Flood `region` through `mask` (4-connected) until it stops changing."""
    while True:
        grown = region.copy()
        grown[1:, :] |= region[:-1, :]
        grown[:-1, :] |= region[1:, :]
        grown[:, 1:] |= region[:, :-1]
        grown[:, :-1] |= region[:, 1:]
        grown &= mask
        if (grown == region).all():
            return region
        region = grown


def border_connected(mask: np.ndarray) -> np.ndarray:
    """Pixels of `mask` reachable from the image border through `mask`."""
    seed = np.zeros_like(mask)
    seed[0, :], seed[-1, :], seed[:, 0], seed[:, -1] = mask[0, :], mask[-1, :], mask[:, 0], mask[:, -1]
    return grow(seed, mask)


def key_black_matte(img: Image.Image) -> Image.Image:
    """Return RGBA with the border-connected black matte keyed out."""
    rgb = np.asarray(img.convert('RGB')).astype(np.float32)
    peak = rgb.max(axis=2)
    matte = border_connected(peak < T_HI)

    alpha = np.ones(peak.shape, np.float32)
    ramp = np.clip((peak - T_LO) / (T_HI - T_LO), 0.0, 1.0)
    alpha[matte] = ramp[matte]

    safe = np.maximum(alpha, 1e-3)[..., None]
    unmult = np.where(matte[..., None] & (alpha[..., None] > 0.02), rgb / safe, rgb)
    unmult = np.clip(unmult, 0, 255)
    unmult[alpha < 0.02] = 0

    out = np.dstack([unmult, alpha * 255.0]).round().astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def key_inked_matte(img: Image.Image, outline: int) -> Image.Image:
    """Key art whose own ink outline is exactly as black as its matte.

    Keying alone would shave the outline off (the empty cup), so instead take
    every painted (non-black) region, drop stray specks, grow the union by the
    outline width with a near-round kernel and fill what it encloses. That is
    the silhouette; every visible pixel is still the original pixel.
    """
    rgb = np.asarray(img.convert('RGB'))
    peak = rgb.max(axis=2).astype(np.float32)
    lit = ~border_connected(peak < T_HI)

    shape = Image.fromarray(lit.astype(np.uint8) * 255, 'L')
    shape = shape.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))  # specks out
    for i in range(outline):
        if i % 2:
            shape = shape.filter(ImageFilter.MaxFilter(3))
        else:  # plus-shaped step; alternating with square gives an octagon, near-round
            m = np.asarray(shape) > 0
            g = m.copy()
            g[1:, :] |= m[:-1, :]
            g[:-1, :] |= m[1:, :]
            g[:, 1:] |= m[:, :-1]
            g[:, :-1] |= m[:, 1:]
            shape = Image.fromarray(g.astype(np.uint8) * 255, 'L')
    solid = np.asarray(shape) > 0
    solid |= ~border_connected(~solid)  # fill enclosed holes
    alpha = Image.fromarray(solid.astype(np.uint8) * 255, 'L').filter(ImageFilter.GaussianBlur(1.1))

    out = Image.fromarray(rgb, 'RGB').convert('RGBA')
    out.putalpha(alpha)
    return out


def trim(img: Image.Image, pad: int = 6) -> Image.Image:
    a = np.asarray(img.getchannel('A'))
    ys, xs = np.where(a > 8)
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0),
           min(xs.max() + pad + 1, img.width), min(ys.max() + pad + 1, img.height))
    return img.crop(box)


def fit(img: Image.Image, longest: int) -> Image.Image:
    scale = longest / max(img.size)
    if scale >= 1:
        return img
    return img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)


def save_webp(img: Image.Image, name: str, quality: int = 88) -> None:
    path = OUT / name
    img.save(path, 'WEBP', quality=quality, method=6, exact=img.mode == 'RGBA')
    print(f'{path.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  {path.stat().st_size // 1024} KB')


def main() -> None:
    OUT.mkdir(exist_ok=True)

    # Rooms: same pixels, web weight.
    save_webp(Image.open(SRC / 'room1-exterior.png').convert('RGB'), 'room1-exterior.webp')
    save_webp(Image.open(SRC / 'room2-counter.png').convert('RGB'), 'room2-counter.webp')

    # Props that already ship with alpha: trim to the painting.
    save_webp(fit(trim(Image.open(SRC / 'prop-bell.png').convert('RGBA')), 480), 'prop-bell.webp', 90)
    save_webp(fit(trim(Image.open(SRC / 'prop-trash.png').convert('RGBA')), 520), 'prop-trash.webp', 90)
    save_webp(fit(trim(Image.open(SRC / 'prop-cup-full.webp').convert('RGBA')), 420), 'prop-cup-full.webp', 90)
    save_webp(fit(trim(Image.open(SRC / 'seal-refused.webp').convert('RGBA')), 720), 'seal-refused.webp', 90)

    # Delivered on black: key the matte.
    # The full cup's outline is ~9-10 px on a 734 px cup; the empty cup is ~898 px.
    save_webp(fit(trim(key_inked_matte(Image.open(SRC / 'prop-cup-empty.png'), outline=11)), 420),
              'prop-cup-empty.webp', 90)
    for name in ('paper-rx-pad', 'paper-filled-receipt', 'paper-refused-bag', 'sticker-window-closed', 'overlay-mobile'):
        keyed = key_black_matte(Image.open(SRC / f'{name}.webp'))
        save_webp(keyed, f'{name}.webp', 90)

    # Link preview: the street, cropped to 1.91:1 around the door.
    street = Image.open(SRC / 'room1-exterior.png').convert('RGB')
    target_h = round(street.width / 1.905)
    top = max(0, min(street.height - target_h, 150))
    street.crop((0, top, street.width, top + target_h)).resize((1200, 630), Image.LANCZOS) \
        .save(PUBLIC / 'og-after-hours-rx.jpg', quality=86, optimize=True, progressive=True)
    print('og card written')


if __name__ == '__main__':
    main()
