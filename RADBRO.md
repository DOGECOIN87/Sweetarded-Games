# Radbro builds

The existing `npm run build` output remains the Sweetardio website. Radbro gets
two separate, wallet-free builds with basic platform-native scoring:

```bash
npm run build:radbro
```

Outputs:

- `dist-radbro/slots/`
- `dist-radbro/coinpusher/`

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
