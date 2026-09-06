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

| Route          | Page                                                          |
| -------------- | ------------------------------------------------------------- |
| `/`            | Landing / navigation hub                                       |
| `/arcade`      | Arcade walk-through scene                                      |
| `/leaderboard` | **Leaderboards** — site-wide standings for both games          |
| `/board`       | **The Board** — cork notice board with team announcements      |
| `/cabin`       | **SEAT AIRWAYS** — flight-sim cabin driven by one market number |
| `/mint`        | Dedicated on-site LaunchMyNFT mint controls                    |
| `/whitelist`   | Whitelist signup                                               |

## NFT mint embed and countdown

The landing page and `/mint` route share one persistent LaunchMyNFT widget for
the [Sweetardio collection](https://launchmynft.io/collections/Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo/W9rwP1XQQpeD2xl1cTtK)
(owner `Hn1i…nELo`, collection `W9rwP1XQQpeD2xl1cTtK`). LaunchMyNFT remains
authoritative for price, supply, eligibility, start/end state, and the
transaction itself.

The countdown defaults to the launch instant scheduled on that collection —
`2026-09-14T12:00:09.509Z` (`DEFAULT_MINT_START_AT` in
`src/components/MintSection.tsx`). Update that constant when LaunchMyNFT's
launch date changes, or override it per deployment without a code change:

```bash
VITE_MINT_START_AT=2026-09-14T12:00:00Z
```

Use ISO-8601 with `Z` or an explicit UTC offset. If the override is invalid, the
widget stays available and the timer safely displays `TBA`.

For the GitHub Pages deployment, create an Actions repository variable named
`VITE_MINT_START_AT` under **Settings → Secrets and variables → Actions**. The
Pages workflow passes that value into the production build on each `main` push.

## SEAT AIRWAYS (`/cabin`)

A flight simulator where the aircraft is flown by a single number. The premise
is the seat ladder: **your bag is your seat, bigger bag better seat**, seats are
finite, and a bigger bag can take yours.

### What drives it

| Input | Becomes |
| ----- | ------- |
| 24h price change | Pitch attitude, and its rate of change becomes bank |
| Market cap | Altitude, in feet, read straight off the number |
| Holder count | Souls on board |
| Attitude | The overhead annunciators, and the PA announcements they trigger |

**Altitude bands.** Market cap is altitude, so the milestones are literal:
below $1M you are in the weather with terrain underneath; **$1M** breaks you out
on top of the cloud deck; **$10M** turns the sky black and curves the horizon;
**$50M** is the lunar surface. Thresholds live in `src/lib/flightModel.ts`
(`BAND_CLOUDS` / `BAND_SPACE` / `BAND_MOON`).

### Views

The page opens **in a seat, looking forward**. From there you can turn your
head, walk the aircraft, or zoom out of it entirely.

| Camera | What it is |
| ------ | ---------- |
| Seat · forward | The default. The row ahead, its passengers, and your seat-back screen. |
| Seat · look left / right | Your head turned. What you see depends on where you sit. |
| Flight deck | The cockpit, for the top two holders. |
| Outside | The whole aircraft. Zoom out past 1× from any view to get here. |

**Turning your head is seat-specific.** From 8A the window is one turn to the
left and fills the frame; from 8F that same window is the far side of the
cabin — two seats, the aisle, three more seats and a porthole the size of a
coin. `lookFrom` in `src/content/cabin.ts` models the row as it physically is
(port window, left bank, aisle, right bank, starboard window) and reads it
outward from your seat, so every seat gets the right answer without any
per-letter special-casing.

Every view supports zoom and pan (wheel, pinch, buttons, or `+` / `-` / `0`
and the arrow keys). Zooming out at the minimum leaves the aircraft.

- `FlightDeck.tsx` — the cockpit: overhead panel, windshield, MCP, PFD and
  navigation display, throttle quadrant
- `CabinView.tsx` — a seat looking forward: the rows ahead and who is in them
- `CabinSideView.tsx` — a seat with your head turned, across the cabin
- `ExteriorView.tsx` — the whole aircraft, its windows lit by real occupancy
  and your own seat marked
- `OutsideWorld.tsx` — everything outside, shared by all of them so they are
  unmistakably the same flight

**The occupancy is one roll.** The seat map, the passengers in the rows ahead,
the people beside you when you turn your head, and the lit windows on the
exterior all read the same seeded set — so a window lit from outside is a row
somebody has genuinely booked.

### The sky is live

Time of day comes from the visitor's own clock: solar elevation is computed for
the date and latitude, so the cabin is dark at midnight and golden at 7pm, with
no network needed. Weather comes from [Open-Meteo](https://open-meteo.com/)
(no key, CORS-enabled), with coordinates derived from the browser's IANA
timezone rather than a location permission prompt. If the request fails or the
zone is unknown, a modelled sky stands in — the page never waits on it. All of
this is `src/lib/sky.ts`.

### The market feed is simulated

`src/lib/flightFeed.ts` is the **only** file that has to change to go live.
Implement the `FlightFeed` interface against your indexer and hand it to
`CabinPage`; the horizon, tapes, annunciators, seat ladder and radio log all
keep working untouched. The file documents the swap. The **Market cap** buttons
under the view (Ground / Above the clouds / Space / The moon) call the
simulator's optional `jumpTo` and hide themselves automatically against a feed
that does not implement it.

### Where things live

```
src/lib/flightFeed.ts     the data seam + the simulator
src/lib/flightModel.ts    pure derivations: pitch, bank, bands, occupancy
src/lib/useAttitude.ts    one rAF loop, shared by every view
src/lib/sky.ts            solar position, weather, palettes
src/lib/useSky.ts         the live sky as React state
src/content/cabin.ts      seat layout, zone copy, radio chatter
src/components/cabin/     the views and their chrome
```

Seat occupancy is seeded (`CABIN_SEED` in `src/pages/Cabin.tsx`), so the cabin
is the same aircraft on every visit rather than reshuffling per render, and the
forward cabin runs fuller than the back — which is the premise, made visible.

## Wallets, credits & leaderboards

- **Wallet connect** (top nav + in-game) uses the Solana wallet adapter with
  Phantom, Solflare and Nightly registered explicitly, plus auto-detection of
  any Wallet Standard wallet the visitor has installed (Backpack, etc.).
  Connecting is optional and used **only as identity** — the games are
  off-chain and free.
- **SWEET credits**: every player starts with `STARTING_CREDITS` (10,000, see
  `src/lib/credits.ts`) — one shared stack across both games, persisted per
  player (wallet address when connected, anonymous handle otherwise). Busted
  stacks refill for free; refills never improve Net Profit, so the boards stay
  fair.
- **Leaderboards** (`/leaderboard`, plus in-game modals) are Firestore-backed:
  `leaderboard_slots` / `leaderboard_coinpusher`, one doc per player. Slots
  ranks Net Profit / Biggest Win / Credits; Coinpusher ranks Coins Pushed /
  Net Profit / Credits. Standings keyed to a wallet are the basis for perks
  when the NFT collection launches.

### Anti-tamper posture (read before paying out rewards)

The games run entirely in the browser, so scores can never be fully
tamper-proof without a server. The damage is bounded instead:

- Balances/credits in localStorage are HMAC-wrapped (`localStorageIntegrity`);
  editing them in DevTools invalidates the value.
- `firestore.rules` enforce document shape, server-timestamp-only writes,
  hard value caps (1e12), a 2-second minimum interval between writes,
  per-write movement caps (±50 M) and monotonic scores. The file is the
  complete ruleset for the project and is wired for deployment: run
  `npm run deploy:rules` locally (after `npx firebase-tools login`), or add
  the `FIREBASE_SERVICE_ACCOUNT` repo secret and the
  `.github/workflows/firestore-rules.yml` workflow deploys automatically
  whenever the rules change on `main`. (Pasting the file into the Firebase
  console works too.)
- The client throttles submissions (trailing flush) to stay inside the rules.

**Always manually review top standings before granting NFT-launch rewards** —
a determined cheater can still inch numbers up within the caps.

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
