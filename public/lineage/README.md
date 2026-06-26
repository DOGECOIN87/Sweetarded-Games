# Lineage video — collection artwork

The renderer (`scripts/lineage_video.py`) looks here for one square image per
collection and frames it as the on-screen avatar. **Missing files degrade
gracefully** — that beat just renders text-only.

## Drop these files here

| File | Collection | Status |
| ---- | ---------- | ------ |
| `milady.png`      | Milady Maker        | ⬜ needed |
| `radbro.png`      | Radbro (Webring)    | ⬜ needed |
| `remilio.png`     | Remilio / Remilia   | ⬜ needed |
| `schizo.png`      | Schizoposters       | ⬜ needed |
| `sweetardios.png` | Sweetardios (finale)| ✅ added (your own mascot art) |

> Gorbagana and Retardio Cousins intentionally stay **text-only**: Gorbagana's
> look derives from Oscar the Grouch (Sesame Workshop trademark), and Retardio
> has no clear public license. The four above are **Viral Public License**
> (Remilia's CC0-ShareAlike), so homage use is in-bounds.

## Specs

- **Square**, ideally **512×512 or larger**, PNG.
- **Opaque PFP** → rendered as a framed portrait (accent border + glow).
- **Transparent cut-out** (like your own characters) → rendered as a glowing
  silhouette, no box.
- Use one clean, iconic token per collection.

## Why they aren't already here

This session's network egress policy blocks the collection image hosts
(`miladymaker.net`, `remilio.org`, `schizoposters.xyz`, …), so they can't be
fetched automatically. Provide them by either:

1. committing the PNGs to `public/lineage/` on the working branch, or
2. sharing them in chat, or
3. pointing to a reachable raw URL (e.g. `raw.githubusercontent.com`).

Then re-run `bash scripts/render_lineage.sh`.
