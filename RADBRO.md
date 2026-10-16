# Radbro builds

The existing `npm run build` output remains the Sweetardio website. Radbro gets
two separate, wallet-free builds with basic platform-native scoring:

```bash
npm run build:radbro
```

Outputs:

- `dist-radbro/slots/`
- `dist-radbro/coinpusher/`

The GitHub Pages workflow also stages those directories at these stable hosted
paths, which can be supplied to Radbro as `playableUrl` builds:

- `https://sweetardio.fun/radbro/slots/`
- `https://sweetardio.fun/radbro/coinpusher/`

Each directory has `index.html` at its root, uses relative asset paths, and is
kept below Radbro's production upload limits. Zip the *contents* of each folder
so `index.html` remains at the ZIP root.

## Scoring contract

- Slots sends `run` when a spin starts, `clear` with the win amount on a win,
  and `gameover` with zero on a loss.
- Coinpusher sends the current coins-collected score as it changes and sends a
  final `clear` when the player resets a non-empty run.

The builds answer `radbro:game-ready-request` and send `radbro:game-ready` on
load. They do not bundle wallet adapters, Solana clients, Firebase scoring, or
the full Sweetardio website shell.

## Radbro domains (radbro.fun, radbro.gg)

Nothing in the builds is tied to Radbro's domain, so they work unchanged under
radbro.fun, radbro.gg, or any other host that embeds them:

- Messages go to `window.parent` with target origin `'*'`, and
  `radbro:game-ready-request` is answered whatever origin sends it
  (`src/radbro/bridge.ts`). Don't pin these to one domain.
- Every asset path is relative to the game's own `index.html`, so the same
  build works from `sweetardio.fun/radbro/...` or unpacked from the ZIP on
  Radbro's own CDN.
- GitHub Pages sends no `X-Frame-Options` / `frame-ancestors`, so any domain
  can iframe the hosted builds.

Both games show a small "by Sweetardio · sweetardio.fun" link in the
bottom-left corner (`RadbroGameShell.tsx`), and their pages carry
`sweetardio.fun` as author / site name.
