#!/usr/bin/env python3
"""
Sweetardios — "The Lineage" brand title sequence.

Renders a 1:1, transparent-background, text-only kinetic-typography video that
traces the on-chain lineage:  Milady -> Remilia -> Retardios -> Gorbagios -> Sweetardios.

Output is an RGBA PNG frame sequence (encoded to WebM/MOV/MP4 by render_lineage.sh).
Everything is driven by the Sweetardios palette (see BRAND.md) and the brand
display face "Pusia Bold", with Liberation Mono for the technical labels.

Pure Pillow + numpy, deterministic, headless.
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ----------------------------------------------------------------------------
# Canvas / timing
# ----------------------------------------------------------------------------
W = H = 1080
FPS = 30
OUT_DIR = os.environ.get("FRAMES_DIR", "/tmp/lineage_frames")
LIMIT = int(os.environ.get("LIMIT", "0"))  # >0 renders only first N frames (preview)

# ----------------------------------------------------------------------------
# Palette (Sweetardios NFT collection — BRAND.md)
# ----------------------------------------------------------------------------
OXFORD = (7, 15, 52)
ZAFFRE = (3, 19, 166)
VIOLET = (146, 1, 203)
CERISE = (247, 21, 171)
CYAN = (52, 237, 243)
WHITE = (235, 244, 255)
MUTE = (150, 173, 214)  # cool muted slate for secondary text

# ----------------------------------------------------------------------------
# Fonts
# ----------------------------------------------------------------------------
PUSIA = "/home/user/Sweetarded-Games/public/fonts/Pusia Bold.otf"
MONO_B = "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf"
MONO_R = "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"

_font_cache = {}
def font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]

# ----------------------------------------------------------------------------
# Easing
# ----------------------------------------------------------------------------
def clamp01(x):
    return 0.0 if x < 0 else (1.0 if x > 1 else x)

def ease_out_cubic(t):
    t = clamp01(t)
    return 1 - (1 - t) ** 3

def ease_in_cubic(t):
    t = clamp01(t)
    return t ** 3

def ease_in_out_cubic(t):
    t = clamp01(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2

def ease_out_expo(t):
    t = clamp01(t)
    return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)

# ----------------------------------------------------------------------------
# Text stamp builders  (each returns an RGBA image sized to its content)
# ----------------------------------------------------------------------------
def _advances(fnt, text):
    return [fnt.getlength(c) for c in text]

def measure(fnt, text, tracking=0.0):
    adv = _advances(fnt, text)
    total = sum(adv) + tracking * max(0, len(text) - 1)
    asc, desc = fnt.getmetrics()
    return total, asc + desc

def stamp_solid(text, fnt, fill, tracking=0.0, glow_color=None, glow_radius=0, glow_alpha=255, pad=120):
    """Self-illuminated text stamp: soft colored glow halo under crisp fill."""
    total, h = measure(fnt, text, tracking)
    size = (int(total) + pad * 2, int(h) + pad * 2)
    adv = _advances(fnt, text)

    def draw_into(img, color, with_alpha=255):
        d = ImageDraw.Draw(img)
        x = pad
        col = color if len(color) == 4 else color + (with_alpha,)
        for c, a in zip(text, adv):
            d.text((x, pad), c, font=fnt, fill=col)
            x += a + tracking

    base = Image.new("RGBA", size, (0, 0, 0, 0))
    if glow_color and glow_radius > 0:
        glow = Image.new("RGBA", size, (0, 0, 0, 0))
        draw_into(glow, glow_color, glow_alpha)
        glow = glow.filter(ImageFilter.GaussianBlur(glow_radius))
        base = Image.alpha_composite(base, glow)
    sharp = Image.new("RGBA", size, (0, 0, 0, 0))
    draw_into(sharp, fill)
    base = Image.alpha_composite(base, sharp)
    return base

def _h_gradient(size, stops):
    """stops: list of (pos0-1, (r,g,b)). Returns RGB array image."""
    w, h = size
    xs = np.linspace(0, 1, w)
    cols = np.zeros((w, 3), dtype=np.float64)
    stops = sorted(stops, key=lambda s: s[0])
    for i in range(len(stops) - 1):
        p0, c0 = stops[i]
        p1, c1 = stops[i + 1]
        m = (xs >= p0) & (xs <= p1 + 1e-9)
        if p1 > p0:
            t = (xs[m] - p0) / (p1 - p0)
        else:
            t = np.zeros(m.sum())
        for k in range(3):
            cols[m, k] = c0[k] + (c1[k] - c0[k]) * t
    cols[xs < stops[0][0]] = stops[0][1]
    cols[xs > stops[-1][0]] = stops[-1][1]
    band = np.tile(cols[np.newaxis, :, :], (h, 1, 1)).astype(np.uint8)
    return Image.fromarray(band, "RGB")

def stamp_gradient(text, fnt, stops, tracking=0.0, glow_color=None, glow_radius=0, glow_alpha=255, pad=140):
    """Text filled with a horizontal gradient, with optional glow halo."""
    total, h = measure(fnt, text, tracking)
    size = (int(total) + pad * 2, int(h) + pad * 2)
    adv = _advances(fnt, text)

    mask = Image.new("L", size, 0)
    md = ImageDraw.Draw(mask)
    x = pad
    for c, a in zip(text, adv):
        md.text((x, pad), c, font=fnt, fill=255)
        x += a + tracking

    grad = _h_gradient(size, stops).convert("RGBA")
    grad.putalpha(mask)

    base = Image.new("RGBA", size, (0, 0, 0, 0))
    if glow_color and glow_radius > 0:
        glow = Image.new("RGBA", size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        x = pad
        gcol = glow_color + (glow_alpha,)
        for c, a in zip(text, adv):
            gd.text((x, pad), c, font=fnt, fill=gcol)
            x += a + tracking
        glow = glow.filter(ImageFilter.GaussianBlur(glow_radius))
        base = Image.alpha_composite(base, glow)
    base = Image.alpha_composite(base, grad)
    return base

# ----------------------------------------------------------------------------
# Compositing helper
# ----------------------------------------------------------------------------
def place(canvas, stamp, cx, cy, opacity=1.0, blur=0.0, dy=0.0, dx=0.0, scale=1.0):
    if opacity <= 0.001:
        return
    s = stamp
    if scale != 1.0:
        s = s.resize((max(1, int(s.width * scale)), max(1, int(s.height * scale))), Image.LANCZOS)
    if blur > 0.25:
        s = s.filter(ImageFilter.GaussianBlur(blur))
    if opacity < 0.999:
        r, g, b, a = s.split()
        a = a.point(lambda p: int(p * opacity))
        s = Image.merge("RGBA", (r, g, b, a))
    px = int(round(cx - s.width / 2 + dx))
    py = int(round(cy - s.height / 2 + dy))
    canvas.alpha_composite(s, (px, py))

# ----------------------------------------------------------------------------
# Script / storyboard
# ----------------------------------------------------------------------------
# Each generation: kicker (era label), hero (the name), sub (one connective line),
# and an accent. Heroes with `grad` use a gradient fill.
CHAPTERS = [
    dict(kind="intro", dur=3.2,
         kicker="T H E   L I N E A G E",
         sub="Every dynasty begins with a single muse.",
         accent=CYAN),
    dict(kind="gen", dur=4.7, pip=0,
         kicker="2021  /  THE ORIGIN",
         hero="MILADY",
         sub="In the beginning, there was the muse.",
         accent=CERISE),
    dict(kind="gen", dur=4.7, pip=1,
         kicker="2022  /  THE COLLECTIVE",
         hero="REMILIA",
         sub="From the muse, a movement was born.",
         accent=VIOLET),
    dict(kind="gen", dur=4.7, pip=2,
         kicker="2024  /  THE FERAL TURN",
         hero="RETARDIOS",
         sub="The bloodline broke free and ran wild.",
         accent=CYAN),
    dict(kind="gen", dur=4.7, pip=3,
         kicker="2025  /  THE TRASH THRONE",
         hero="GORBAGIOS",
         grad=[(0.0, CYAN), (1.0, CERISE)],
         sub="The degenerates made the garbage a kingdom.",
         accent=CERISE),
    dict(kind="gen", dur=5.4, pip=4,
         kicker="MMXXVI  /  THE HEIR",
         hero="SWEETARDIOS",
         grad=[(0.0, CYAN), (0.5, CERISE), (1.0, VIOLET)],
         sub="From all who came before — the sweetest of them all.",
         accent=CERISE, finale=True),
    dict(kind="outro", dur=5.0,
         kicker="THE LINEAGE CONTINUES",
         hero="SWEETARDED GAMES",
         grad=[(0.0, CYAN), (0.5, CERISE), (1.0, VIOLET)],
         sub="est. on-chain",
         accent=CYAN),
]

# ----------------------------------------------------------------------------
# Pre-build stamps
# ----------------------------------------------------------------------------
HERO_SIZE = 150
WORDMARK_SIZE = 96
KICKER_SIZE = 30
SUB_SIZE = 30
KTRACK = 8.0  # kicker letter tracking

def fit_hero_font(text, target_w, start=HERO_SIZE):
    """Shrink the hero face so very long names still fit the canvas width."""
    size = start
    while size > 60:
        f = font(PUSIA, size)
        w, _ = measure(f, text)
        if w <= target_w:
            return f
        size -= 4
    return font(PUSIA, size)

print("Pre-building text stamps...")
for ch in CHAPTERS:
    ch["_kicker"] = stamp_solid(ch["kicker"], font(MONO_B, KICKER_SIZE), CYAN,
                                tracking=KTRACK, glow_color=CYAN, glow_radius=10, glow_alpha=120, pad=70)
    if ch.get("sub"):
        ch["_sub"] = stamp_solid(ch["sub"], font(MONO_R, SUB_SIZE), WHITE, tracking=1.0, pad=60)
    hero = ch.get("hero")
    if hero:
        is_word = ch["kind"] == "outro"
        base_size = WORDMARK_SIZE if is_word else HERO_SIZE
        hf = fit_hero_font(hero, W - 150, start=base_size)
        if ch.get("grad"):
            ch["_hero"] = stamp_gradient(hero, hf, ch["grad"], tracking=2.0,
                                         glow_color=ch["accent"], glow_radius=44, glow_alpha=130)
        else:
            ch["_hero"] = stamp_solid(hero, hf, WHITE, tracking=2.0,
                                      glow_color=ch["accent"], glow_radius=44, glow_alpha=150)

# Cumulative chapter timing (frames)
for ch in CHAPTERS:
    ch["frames"] = max(1, int(round(ch["dur"] * FPS)))
TOTAL = sum(ch["frames"] for ch in CHAPTERS)
starts = []
acc = 0
for ch in CHAPTERS:
    starts.append(acc)
    acc += ch["frames"]

# ----------------------------------------------------------------------------
# Persistent motif: bottom lineage track of 5 diamonds
# ----------------------------------------------------------------------------
PIP_Y = 980
PIP_N = 5
PIP_GAP = 92
PIP_X0 = W / 2 - PIP_GAP * (PIP_N - 1) / 2

def draw_diamond(d, cx, cy, r, fill):
    d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=fill)

def lineage_track(lit_count, current=-1, pulse=0.0, master=1.0):
    """Render the 5-diamond progress rail. `lit_count` already-lit, `current` igniting."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    # connector hairline
    for i in range(PIP_N - 1):
        x0 = PIP_X0 + i * PIP_GAP
        x1 = PIP_X0 + (i + 1) * PIP_GAP
        on = i < lit_count
        col = CYAN + (170 if on else 40,)
        d.line([(x0 + 10, PIP_Y), (x1 - 10, PIP_Y)], fill=col, width=2)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(PIP_N):
        cx = PIP_X0 + i * PIP_GAP
        if i < lit_count:
            draw_diamond(gd, cx, PIP_Y, 9, CERISE + (200,))
            draw_diamond(d, cx, PIP_Y, 6, WHITE + (255,))
        elif i == current:
            r = 9 + 4 * pulse
            draw_diamond(gd, cx, PIP_Y, int(14 + 8 * pulse), CERISE + (220,))
            draw_diamond(d, cx, PIP_Y, int(r), WHITE + (255,))
        else:
            d.polygon([(cx, PIP_Y - 6), (cx + 6, PIP_Y), (cx, PIP_Y + 6), (cx - 6, PIP_Y)],
                      outline=MUTE + (150,), width=2)
    glow = glow.filter(ImageFilter.GaussianBlur(7))
    out = Image.alpha_composite(glow, layer)
    if master < 0.999:
        r, g, b, a = out.split()
        a = a.point(lambda p: int(p * master))
        out = Image.merge("RGBA", (r, g, b, a))
    return out

# ----------------------------------------------------------------------------
# Per-element animation envelopes
# ----------------------------------------------------------------------------
def hero_anim(local, dur):
    """Return (opacity, blur, dy, scale) for a hero across its chapter."""
    t_in = local / 0.75
    op_in = ease_out_expo(t_in)
    dy_in = 46 * (1 - ease_out_cubic(t_in))
    bl_in = 18 * (1 - ease_out_cubic(min(1, local / 0.9)))
    sc_in = 0.965 + 0.035 * ease_out_cubic(t_in)
    out_start = dur - 0.6
    if local >= out_start:
        to = ease_in_cubic((local - out_start) / 0.6)
        op = (1 - to)
        dy = -28 * to
        bl = 14 * to
        return op, max(bl, 0), dy, 1.0
    return op_in, bl_in, dy_in, sc_in

def fade_in_out(local, dur, t_in=0.6, t_out=0.55, delay=0.0):
    if local < delay:
        return 0.0
    a = ease_out_cubic((local - delay) / t_in)
    out_start = dur - t_out
    if local >= out_start:
        a = min(a, 1 - ease_in_cubic((local - out_start) / t_out))
    return clamp01(a)

# ----------------------------------------------------------------------------
# Frame renderer
# ----------------------------------------------------------------------------
CENTER_Y = 500   # hero baseline-ish center
KICKER_Y = 360
SUB_Y = 628

def render_frame(fi):
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # locate chapter
    ci = 0
    for i, s in enumerate(starts):
        if fi >= s:
            ci = i
    ch = CHAPTERS[ci]
    local = (fi - starts[ci]) / FPS
    dur = ch["dur"]

    # ---- persistent lineage rail (fades in after intro, persists) ----
    if ch["kind"] == "intro":
        rail_master = fade_in_out(local, dur, t_in=1.0, t_out=0.4)
        rail = lineage_track(0, current=-1, master=0.5 * rail_master)
    elif ch["kind"] == "gen":
        pip = ch["pip"]
        ignite = clamp01(local / 0.6)
        rail = lineage_track(pip, current=pip, pulse=ease_out_cubic(ignite))
    else:  # outro
        pulse = 0.5 + 0.5 * math.sin(local * 2.2)
        rail = lineage_track(PIP_N, current=-1, pulse=pulse)
    canvas.alpha_composite(rail)

    # ---- intro ----
    if ch["kind"] == "intro":
        # growing vertical bloodline thread from top toward center
        grow = ease_in_out_cubic(clamp01((local - 0.2) / 1.6))
        fade = fade_in_out(local, dur, t_in=0.8, t_out=0.5)
        if grow > 0 and fade > 0:
            thread = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            td = ImageDraw.Draw(thread)
            y1 = 250 + (CENTER_Y - 120 - 250) * grow
            td.line([(W / 2, 250), (W / 2, y1)], fill=CYAN + (200,), width=2)
            draw_diamond(td, W / 2, 250, 7, CERISE + (230,))
            thread = thread.filter(ImageFilter.GaussianBlur(0.6))
            place(canvas, thread, W / 2, H / 2, opacity=fade)
        k_op = fade_in_out(local, dur, t_in=0.7, t_out=0.5, delay=0.15)
        place(canvas, ch["_kicker"], W / 2, KICKER_Y - 20, opacity=k_op, dy=8 * (1 - k_op))
        s_op = fade_in_out(local, dur, t_in=0.8, t_out=0.5, delay=0.5)
        place(canvas, ch["_sub"], W / 2, CENTER_Y + 10, opacity=s_op, dy=10 * (1 - s_op))
        return canvas

    # ---- generation + outro share the hero layout ----
    # kicker
    k_op = fade_in_out(local, dur, t_in=0.55, t_out=0.55, delay=0.05)
    place(canvas, ch["_kicker"], W / 2, KICKER_Y, opacity=k_op, dy=6 * (1 - k_op))
    # animated underline beneath the kicker
    if k_op > 0.01:
        uw = ease_out_cubic(clamp01((local - 0.12) / 0.6))
        out_start = dur - 0.55
        if local >= out_start:
            uw = min(uw, 1 - ease_in_cubic((local - out_start) / 0.55))
        half = (ch["_kicker"].width * 0.30) * uw
        if half > 1:
            ul = Image.new("RGBA", (W, 24), (0, 0, 0, 0))
            ImageDraw.Draw(ul).line([(W / 2 - half, 12), (W / 2 + half, 12)], fill=ch["accent"] + (220,), width=2)
            ul = ul.filter(ImageFilter.GaussianBlur(0.5))
            canvas.alpha_composite(ul, (0, KICKER_Y + 34))

    # hero
    if ch.get("_hero") is not None:
        op, bl, dy, sc = hero_anim(local, dur)
        # gentle breathing once settled
        if 0.9 < local < dur - 0.7:
            breath = 1.0 + 0.012 * math.sin((local - 0.9) * 1.6)
            sc *= breath
        place(canvas, ch["_hero"], W / 2, CENTER_Y, opacity=op, blur=bl, dy=dy, scale=sc)

    # sub
    if ch.get("_sub") is not None:
        y = SUB_Y if ch["kind"] == "gen" else SUB_Y + 8
        s_op = fade_in_out(local, dur, t_in=0.7, t_out=0.5, delay=0.28)
        place(canvas, ch["_sub"], W / 2, y, opacity=s_op, dy=10 * (1 - s_op))

    return canvas

# ----------------------------------------------------------------------------
# Drive
# ----------------------------------------------------------------------------
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for f in os.listdir(OUT_DIR):
        if f.endswith(".png"):
            os.remove(os.path.join(OUT_DIR, f))
    n = LIMIT if LIMIT > 0 else TOTAL
    print(f"Rendering {n}/{TOTAL} frames -> {OUT_DIR}  ({TOTAL/FPS:.1f}s @ {FPS}fps)")
    for fi in range(n):
        img = render_frame(fi)
        img.save(os.path.join(OUT_DIR, f"f{fi:05d}.png"))
        if fi % 30 == 0:
            print(f"  frame {fi:4d}/{n}", flush=True)
    print(f"Done. {n} frames. Duration {n/FPS:.2f}s")

if __name__ == "__main__":
    main()
