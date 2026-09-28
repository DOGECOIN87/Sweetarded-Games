# sweetardio.fun — AFTER HOURS RX / COUNTER 4444

The Sweetardio site is one closed night pharmacy, played point-and-click.
Sweetardio: 4,444 on Solana, Phase 1 at 0.0420 SOL, X [@Sweetardio](https://x.com/Sweetardio).

There is no homepage, no navbar and no mint button until you have earned one.

```
ROOM 1  street ──door──▶ ROOM 2  counter ──RING FOR SERVICE──▶ "the window is watching."
                                         ──UNOPENED SCRIPT──▶ ROOM 3A  the Rx pad
ROOM 3A  IDENTIFY YOURSELF (X / Google / email) · 3 questions · notes · wallet · side effects ──SEND TO FILL──▶
ROOM 3B  the catch: cup on the tray, can on the floor
           TAKE THEM      ──▶ PATH A  empty cup, FILLED receipt, "you can go." ──mat──▶ ROOM 1
           SPIT THEM OUT  ──▶ PATH B  REFUSED, "good." ──▶ ROOM 4  the bag (the only mint)
```

- Only the trash path can mint. People who take the meds can come back and spit.
- Returning patients still walk in and ring; the window remembers them
  (filed → straight to the catch; spat → straight to the bag).
- Wording lock: *take the meds / take them / took the meds / spit them out /
  spit them into the trash.* All copy lives in `src/rx/copy.ts`.
- Phones get the `overlay-mobile` notice first (once per browser session).
  ENTER ANYWAY works, and the same four rooms are completable on a phone:
  every hotspot is at least 44 × 44 px, the catch shrinks the room until the
  cup and the can are both on screen, and the pad's boxes open a sheet of the
  same paper with thumb-sized controls (16 px inputs, so iOS doesn't zoom).
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
| `src/rx/identity.ts` | Sign-in: X, Google, or email and password (Firebase Authentication, `src/firebase.config.ts`) |
| `src/rx/usePharmacySound.ts`, `sfx.ts` | The background loop, the street voices, the bell |
| `src/rx/patientFile.ts` | The team's copy of each intake in Firestore (`rx_files/{uid}`) |
| `src/rx/mintWindow.tsx` | The LaunchMyNFT register behind PAY AT WINDOW, and the window switch |
| `src/rx/device.ts`, `carry.ts` | Phones and in-app browsers; the patient's file carried into Phantom's browser |
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
shadows keep no black fringe). The same script writes the 1200×630
link-preview card from the street. Re-run after replacing any original:

```bash
pip install pillow numpy
python3 scripts/rx-art.py
```

No catch painting (counter with the cup on the tray) was supplied, so Room 3B
composites `prop-cup-full` onto the counter at `COUNTER.cup` in
`src/rx/scenes.ts`. Drop a `room2-catch` painting in and it can replace that.

The favicons and app icons are the Sweetardio Collection badge
(`public/logos/sweetardio-collection-badge-512.png`), not generated.

## Sound

All in `public/rx/audio/`:

- `street-bed.mp3` loops underneath the whole visit, gapless (Web Audio): full
  volume on the street, half inside the pharmacy, gliding between the two as
  you walk in and out. Cut from the supplied screen recording: the steady section
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

- On the street only, eight voice clips play over it one at a time, shuffled,
  6–15 s apart (`src/rx/usePharmacySound.ts` lists them).
- `bell.mp3` is RING FOR SERVICE at the counter.

Browsers block sound until a visitor has touched the page, so on a first
visit the street is silent until the first tap, click or key press. (iOS
also ignores volume, so on iPhones the voices play at full level.)

## The mint (Room 4 only)

The bag's printed PHASE 1 / 0.0420 SOL / PAY AT WINDOW sticker is the button.
Behind it is the same LaunchMyNFT Solana embed the old site used
(collection `8azF6Zkfb5ExKPty13RO`, owner `Hn1i…nELo`). LaunchMyNFT stays
authoritative for price, eligibility, supply and the transaction; its UI is
never shown except its wallet chooser. One press connects the wallet and then
asks it to pay.

- Live price comes from the collection's public config. If it ever differs
  from the printed 0.0420, a price tag is pinned over the sticker.
- A mint that clears → FILE CLOSED.

**Mint locked.** Whoever can't pay gets FILLED (took the meds), FILE CLOSED
(already minted) or THE WINDOW IS SHUT. SIT DOWN. / DO NOT CALL THE
PHARMACY. with the WINDOW CLOSED sticker — never a wallet or contract error,
and never any mint UI before the trash. The window is shut when:

- **we shut it**: in the Firebase console, Firestore → `game_config` → add a
  document `rx` with a boolean field `windowShut` = `true` (set it to `false`
  or delete the document to reopen; no deploy needed);
- LaunchMyNFT says sold out (its public config, or the counter);
- the connected wallet's Mint button stays disabled for 8 s (phase not
  started or ended, not eligible, mint limit, balance);
- the register won't load;
- the page isn't on `sweetardio.fun`.

**Phones.** Phones have no wallet extension. On a phone without a wallet,
PAY AT WINDOW opens `sweetardio.fun` in Phantom's own browser (its universal
link), with the patient's file carried in the address (`#file=…`, see
`src/rx/carry.ts`; `minted` never travels). There they tap ENTER ANYWAY,
walk in and ring, and the window sends them straight to the bag, where
Phantom is connected and pays. In X's (and other) in-app browsers, the pad
and the bag say THE WINDOW DOES NOT LIKE IN-APP BROWSERS. OPEN IN PHANTOM OR
SAFARI.

The embed script is ~8 MB, so it starts loading (hidden) at the catch, or as
soon as a patient who already spat walks in. Phones without a wallet never
load it.

## Sign-in

IDENTIFY YOURSELF offers X, Google, and email/password, all Firebase
Authentication on the `sweetardio` project (`src/rx/identity.ts`). Nobody can
SEND TO FILL, and so nobody can reach the bag, without signing in. All three
are enabled in the Firebase console (Authentication):

1. **Sign-in method**:
   - **Email/Password** and **Google** (with a support email for Google's
     sign-in screen).
   - **Twitter**: the API key and secret (Consumer Key / Secret) of the X
     developer app. If those keys are ever regenerated, paste the new pair
     here too. The X app's user authentication settings are **Web App,
     Automated App or Bot**, callback URL
     `https://sweetardio.firebaseapp.com/__/auth/handler`, website
     `https://sweetardio.fun`.
2. **Settings → Authorized domains**: `sweetardio.fun` is listed.

Email/Password and Google can also be managed from the Firebase CLI with an
`auth` block in `firebase.json` and `npx -y firebase-tools@latest deploy --only auth`
(Twitter is console-only).

## Patient files

`firestore.rules` gains `rx_files/{uid}`: written only by the signed-in
patient themself, private to them, shape-checked, and a spat file never goes
back to took. The rules deploy on push to `main` via
`.github/workflows/firestore-rules.yml` (or `npm run deploy:rules`), which
needs a `FIREBASE_SERVICE_ACCOUNT` repo secret (a service-account key from
Firebase → Project settings → Service accounts). Until the rules are deployed,
files are not saved; the pharmacy works the same either way.
Browse them in Firestore → Data → `rx_files`. Each file holds how the patient
signed in, their email or X id and handle, the three answers, the note, the
wallet, the `ref`, the path, and `minted` (the patient's own claim — check the
chain before rewarding anyone).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

In `npm run dev` the window is open on localhost. To walk the flow without
signing in, set a stand-in patient in the browser console (dev builds only):

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
