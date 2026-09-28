# sweetardio.fun — AFTER HOURS RX / COUNTER 4444

The Sweetardio site is one closed night pharmacy, played point-and-click.
Sweetardio: 4,444 on Solana, Phase 1 at 0.0420 SOL, X [@Sweetardio](https://x.com/Sweetardio).

There is no homepage, no navbar and no mint button until you have earned one.

```
ROOM 1  street ──door──▶ ROOM 2  counter ──RING FOR SERVICE──▶ "the window is watching."
                                         ──UNOPENED SCRIPT──▶ ROOM 3A  the Rx pad
ROOM 3A  IDENTIFY YOURSELF (X) · 3 questions · notes · wallet · side effects ──SEND TO FILL──▶
ROOM 3B  the catch: cup on the tray, can on the floor
           TAKE THEM      ──▶ PATH A  empty cup, FILLED receipt, "you can go." ──mat──▶ ROOM 1
           SPIT THEM OUT  ──▶ PATH B  REFUSED, "good." ──▶ ROOM 4  the bag (the only mint)
```

- Only the trash path can mint. People who take the meds can come back and spit.
- Returning patients still walk in and ring; the window remembers them
  (filed → straight to the catch; spat → straight to the bag).
- Wording lock: *take the meds / take them / took the meds / spit them out /
  spit them into the trash.* All copy lives in `src/rx/copy.ts`.
- Phones get the `overlay-mobile` notice first. ENTER ANYWAY works — badly, on purpose.
- `?ref=` is captured silently (first touch wins), stripped from the address
  bar, and filed with the intake.

## Where things are

| Path | What |
| --- | --- |
| `src/rx/Pharmacy.tsx` | The rooms and the flow between them |
| `src/rx/rooms/` | Street, Counter (Room 2 / 3B / Path A), RxPad (3A), Papers (receipt, stamp), Bag (Room 4), PhoneGate |
| `src/rx/copy.ts` | Every word the pharmacy says |
| `src/rx/scenes.ts` | Hotspot / overlay rectangles, in each painting's own pixels |
| `src/rx/Stage.tsx`, `Hotspot.tsx` | Paintings, and things pinned to them |
| `src/rx/identity.ts` | Sign in with X (Firebase Twitter provider from `src/firebase.config.ts`) |
| `src/rx/patientFile.ts` | The team's copy of each intake in Firestore (`rx_files/{uid}`) |
| `src/rx/mintWindow.tsx` | The LaunchMyNFT register behind PAY AT WINDOW |
| `src/rx/progress.ts` | What this browser remembers (intake draft, path, minted) |
| `src/rx/rx.css` | All styling. Palette is locked: the five colours below, black, stained paper |
| `public/rx/` | The locked art, byte-for-byte as delivered. Never edited |
| `public/rx/web/` | Web copies derived from it (`python3 scripts/rx-art.py`) |

Palette: `#070F34` Oxford Blue · `#0313A6` Zaffre · `#9201CB` Dark Violet ·
`#F715AB` Hollywood Cerise · `#34EDF3` Fluorescent Cyan.

## The art

The paintings in `public/rx/` are locked. The site serves derived copies from
`public/rx/web/`: rooms re-encoded to WebP, props trimmed, and the papers keyed
off the black they were delivered on (colour un-premultiplied, so edges and
shadows keep no black fringe). The same script writes the favicons and app
icons from the REFUSED seal, and the 1200×630 link-preview card from the
street. Re-run after replacing any original:

```bash
pip install pillow numpy
python3 scripts/rx-art.py
```

No catch painting (counter with the cup on the tray) was supplied, so Room 3B
composites `prop-cup-full` onto the counter at `COUNTER.cup` in
`src/rx/scenes.ts`. Drop a `room2-catch` painting in and it can replace that.

## Sound

All in `public/rx/audio/`, all on the street (Room 1) except the bell:

- `street-bed.mp3` loops underneath, gapless (Web Audio), fading out when
  you go inside. Cut from the supplied screen recording: the steady section
  from 39.64 s to 86.93 s, with its last 2 s cross-faded into its first 2 s
  so the loop point is seamless:

  ```bash
  ffmpeg -ss 39.65 -t 47.3 -i recording.mp4 -vn -filter_complex "[0:a]asplit=3[a][b][c];\
  [a]atrim=start=2:end=45.27,asetpts=PTS-STARTPTS[body];\
  [b]atrim=start=45.27:end=47.27,asetpts=PTS-STARTPTS,afade=t=out:d=2:curve=qsin[tail];\
  [c]atrim=end=2,asetpts=PTS-STARTPTS,afade=t=in:d=2:curve=qsin[head];\
  [tail][head]amix=inputs=2:duration=shortest:normalize=0[xf];[body][xf]concat=n=2:v=0:a=1[out]" \
  -map "[out]" -c:a libmp3lame -b:a 128k -map_metadata -1 street-bed.mp3
  ```

- Eight voice clips play over it one at a time, shuffled, 6–15 s apart
  (`src/rx/useStreetSounds.ts` lists them).
- `bell.mp3` is RING FOR SERVICE at the counter.

Browsers block sound until a visitor has touched the page, so on a first
visit the street is silent until the first tap, click or key press.

## The mint (Room 4 only)

The bag's printed PHASE 1 / 0.0420 SOL / PAY AT WINDOW sticker is the button.
Behind it is the same LaunchMyNFT Solana embed the old site used
(collection `8azF6Zkfb5ExKPty13RO`, owner `Hn1i…nELo`). LaunchMyNFT stays
authoritative for price, eligibility, supply and the transaction; its UI is
never shown except its wallet chooser. One press connects the wallet and then
asks it to pay.

- Live price comes from the collection's public config. If it ever differs
  from the printed 0.0420, a price tag is pinned over the sticker.
- Sold out, not eligible, or not on `sweetardio.fun` → WINDOW CLOSED sticker,
  THE WINDOW IS SHUT. SIT DOWN.
- A mint that clears → FILE CLOSED.

The embed script is ~8 MB, so it starts loading (hidden) at the catch.

## Sign-in — required before launch

IDENTIFY YOURSELF offers X, Google, and email/password, all Firebase
Authentication on the `sweetardio` project (`src/rx/identity.ts`). Until the
providers are enabled nobody can SEND TO FILL, so nobody can reach the bag.
In the Firebase console (Authentication):

1. **Get started** (once), then **Sign-in method**:
   - **Email/Password**: enable.
   - **Google**: enable; pick the support email shown on Google's sign-in screen.
   - **Twitter**: enable with the API key and secret (Consumer Key / Secret) of
     an X developer app. In the X app's user authentication settings choose
     **Web App, Automated App or Bot**, set the callback URL Firebase shows
     (`https://sweetardio.firebaseapp.com/__/auth/handler`) and the website
     `https://sweetardio.fun`.
2. **Settings → Authorized domains**: add `sweetardio.fun` and
   `www.sweetardio.fun`.

Email/Password and Google can instead be enabled from the Firebase CLI with an
`auth` block in `firebase.json` and `npx -y firebase-tools@latest deploy --only auth`
(Twitter is console-only).

## Patient files

`firestore.rules` gains `rx_files/{uid}`: written only by the signed-in X
patient themself, private to them, shape-checked, and a spat file never goes
back to took. The rules deploy on push to `main` via
`.github/workflows/firestore-rules.yml` (or `npm run deploy:rules`).
Browse them in Firestore → Data → `rx_files`. Each file holds X id and handle,
the three answers, the note, the wallet, the `ref`, the path, and `minted`
(the patient's own claim — check the chain before rewarding anyone).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

In `npm run dev` the window is open on localhost. To walk the flow without X
configured, set a stand-in patient in the browser console (dev builds only):

```js
localStorage.setItem('rx:dev-patient', JSON.stringify({ handle: 'late_night_patient' }))
```

Reset the file with `localStorage.clear()`.

## Radbro game builds

The arcade games (Slots, Coinpusher) are no longer part of the site, but their
wallet-free Radbro builds still ship at `sweetardio.fun/radbro/slots/` and
`/radbro/coinpusher/`. Their source stays under `src/components/slots`,
`src/components/junk-pusher` and `src/lib`. See `RADBRO.md`.

## Deploy

GitHub Pages, from `main`, via `.github/workflows/deploy.yml` (`public/CNAME`
is `sweetardio.fun`).
