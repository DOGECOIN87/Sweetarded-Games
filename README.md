# Sweetarded Games

Standalone front-end workspace for the two **trashmarket.fun** arcade games — the
**Slots** machine and the **Junk Pusher** (coin-pusher). This repo was extracted
from the main marketplace so the games can be redesigned in isolation.

> **Scope:** front-end only. The Solana on-chain program and any backend services
> are intentionally **not** included here — they will be reconfigured later. The
> on-chain client code (wallet hooks, program IDs, RPC endpoints) is kept intact
> so the app builds and runs, but treat those values as placeholders.

## Games

| Route          | Game        | Entry component                                  |
| -------------- | ----------- | ------------------------------------------------ |
| `/slots`       | Slots       | `src/components/slots/SkillGame.tsx`             |
| `/junk-pusher` | Junk Pusher | `src/components/junk-pusher/JunkPusherGame.tsx`  |

## Site pages

| Route        | Page                                                          |
| ------------ | ------------------------------------------------------------- |
| `/`          | Landing / navigation hub                                       |
| `/arcade`    | Arcade walk-through scene                                      |
| `/board`     | **The Board** — cork notice board with team announcements      |
| `/whitelist` | Whitelist signup                                               |

### Posting to The Board

The board renders notes from the `board_posts` Firestore collection
(publicly readable, client writes denied). To pin a new note, add a
document in the Firebase console (Firestore → Data → `board_posts`) with
the fields described in `src/services/boardService.ts` — or edit the
starter notes in `src/content/boardPosts.ts`, which show whenever the
collection is empty or unreachable.

The board also shows a **Whitelist** section of signups. It requires
public reads on the `whitelist` collection (see `firestore.rules`); until
those rules are applied in the Firebase console the section hides itself.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. (optional) configure environment
cp .env.local.example .env.local   # fill in values as needed

# 3. Run the dev server
npm run dev                        # http://localhost:3000

# Production build / preview
npm run build
npm run preview
```

The app defaults to the **Gorbagana** network, so both games render immediately
without a wallet connected. Leaderboards and on-chain actions need the env vars
in `.env.local` (Firebase + RPC/program config).

## Project structure

```
src/
├── App.tsx                 # router + landing page (Slots / Junk Pusher)
├── index.tsx               # entry point
├── index.css               # Tailwind + brand styles + Pusia font-face
├── components/
│   ├── slots/              # Slots game UI (SkillGame, BonusRound, leaderboard)
│   └── junk-pusher/        # Junk Pusher UI (game, overlays, wallet, audio)
├── pages/                  # route wrappers (Slots.tsx, JunkPusher.tsx)
├── contexts/               # Network / Wallet / connection providers
├── lib/                    # game engine, on-chain client, sound, scoring
├── services/               # Firebase-backed activity / game config / leaderboards
├── utils/                  # helpers (errors, decimals, tx confirm, integrity)
└── idl/                    # Anchor IDLs used by the wallet/anchor contexts

public/
├── symbols/                # slot reel symbols
├── audio/                  # game sound effects & music
├── assets/                 # backgrounds, logos, mascots
├── images/                 # backgrounds
└── fonts/                  # Pusia display font
```

## Tech stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4
- `three` + `@dimforge/rapier3d-compat` (Junk Pusher physics)
- Solana wallet adapter + `@coral-xyz/anchor` (on-chain client)
- Firebase (leaderboards / high scores)

## Notes for the redesign

- New art/assets drop into `public/` (`symbols/`, `audio/`, `assets/`, `images/`).
- The Slots reel symbols are defined in `src/lib/slots/symbols.ts`.
- Each game owns its own wallet-connect UI; the top nav also exposes a wallet button.
- Program IDs, treasury wallet, and RPC endpoints live in `.env.local` and
  `src/lib/` config files and will be re-pointed once the new programs are deployed.
