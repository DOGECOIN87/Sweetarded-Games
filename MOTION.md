# Motion — Theatre.js pipeline

The landing hero runs an "arcade power-on" sequence choreographed with
[Theatre.js](https://www.theatrejs.com/): the panel fades up, the badge drops in,
the SWEETARDIO wordmark neon-flickers alive, then the copy and the three arrows
ignite in order. ~2.6 s, plays **once per session**, and is skipped entirely under
`prefers-reduced-motion`.

## How it's wired

| Piece | Role |
| ----- | ---- |
| `@theatre/core` (dependency) | Runtime playback. Ships in its own `chunk-motion` bundle. |
| `@theatre/studio` (devDependency) | Visual timeline editor. Loaded **only** in `npm run dev` (see `src/index.tsx`); eliminated from production builds. |
| `src/motion/sweetardio-motion.json` | The committed animation state (keyframes). This is the source of truth. |
| `src/motion/heroPowerOn.ts` | Project/sheet/objects + the `useHeroPowerOn` hook. Writes styles straight to element refs — zero React re-renders during playback. |
| `scripts/generate-motion-state.mjs` | Regenerates the initial JSON from code, for reproducibility. You normally edit visually instead. |

## Editing the choreography (the fun way)

1. `npm run dev` and open the site — the Studio overlay appears (outline + timeline UI).
2. Select the **Sweetardio → Hero** sheet. Every hero element is an object
   (Panel, Badge, Chip, Wordmark, Fun, Tagline, Kicker, ArrowL/C/R) with
   `opacity` / `y` (and `scale` on Panel) tracks.
3. Scrub, drag keyframes, retime, add flicker spikes — changes preview live.
   Studio stores your edits in localStorage while you work.
4. When happy: click the project name in the Studio outline → **Export Sweetardio to JSON**,
   and replace `src/motion/sweetardio-motion.json` with the download.
5. Commit. Production plays the new state; localStorage edits never affect prod.

## Adding motion elsewhere

Create a new sheet on the same project (e.g. `project.sheet('RareWall')`), register
objects, and drive whatever you like — DOM styles, three.js objects in the arcade
scenes, audio params. Keep Studio dev-only and keep state committed as JSON.

## Guardrails already in place

- `prefers-reduced-motion: reduce` → sequence never plays; hero renders instantly.
- Session guard → replays only on a fresh session, not every route return.
- Font race → playback waits for `document.fonts.ready` (max 600 ms) so the
  wordmark doesn't flicker in a fallback font.
- Unmount mid-play → sequence pauses and inline styles are cleared.
