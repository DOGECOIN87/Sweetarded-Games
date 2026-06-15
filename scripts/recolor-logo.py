#!/usr/bin/env python3
"""Recolor an SVG into the Sweetardios brand palette.

Maps every hex color in the source SVG to the brand palette by hue family while
preserving each color's lightness (so shading/gradients survive):

  reds / pinks      -> cerise   (#F715AB)
  yellows / greens  -> deep blue (oxford/zaffre family)
  cyans / blues     -> cyan     (#34EDF3)
  purples / magentas-> cerise/violet
  neutrals (low sat)-> cool blue-grey tint (darks pulled toward Oxford Blue)

Usage: python3 scripts/recolor-logo.py [source.svg] [output.svg]
"""
import re
import sys
import colorsys

SRC = sys.argv[1] if len(sys.argv) > 1 else "brand/logo-source.svg"
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/sweetardios-logo.svg"

HEX_RE = re.compile(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b')


def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(r, g, b):
    clamp = lambda v: max(0, min(255, int(round(v * 255))))
    return '#%02x%02x%02x' % (clamp(r), clamp(g), clamp(b))


def map_color(hx):
    r, g, b = hex_to_rgb(hx)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)

    if s < 0.18:  # neutral / greyscale -> cool tint
        if l < 0.22:                       # deep shadows -> Oxford Blue
            out_h, out_s = 0.62, 0.55
        else:                              # mid/light -> icy cool grey
            out_h, out_s = 0.55, 0.16
        out_l = l
    else:  # chromatic -> bucket by hue
        if h < 0.06 or h >= 0.92:          # reds / pinks
            out_h, out_s = 0.90, 0.85      # cerise
        elif h < 0.45:                     # yellows / greens
            out_h, out_s = 0.62, 0.82      # deep blue (oxford/zaffre)
        elif h < 0.75:                     # cyans / blues
            out_h, out_s = 0.50, 0.82      # cyan
        else:                              # purples / magentas
            out_h, out_s = 0.86, 0.85      # cerise-violet
        # slight contrast lift so it pops on dark UI
        out_l = min(1.0, max(0.0, (l - 0.5) * 1.08 + 0.5))

    return rgb_to_hex(*colorsys.hls_to_rgb(out_h, out_l, out_s))


def main():
    src = open(SRC, encoding='utf-8').read()
    uniq = set(HEX_RE.findall(src))
    cmap = {h: map_color(h) for h in uniq}
    out = HEX_RE.sub(lambda m: cmap.get(m.group(0), m.group(0)), src)
    open(OUT, 'w', encoding='utf-8').write(out)

    print(f"recolored {len(uniq)} unique colors -> {OUT}")
    sample = ['#06150c', '#103928', '#ce0a06', '#ab0403', '#f7f1f2',
              '#e79696', '#726a67', '#030303', '#f16869']
    print("sample mappings:")
    for h in sample:
        if h in cmap:
            print(f"  {h} -> {cmap[h]}")


if __name__ == '__main__':
    main()
