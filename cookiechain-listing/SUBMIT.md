# Cookie Chain apps-registry submission — Sweetardio.fun

This folder is a ready-to-submit kit for listing **Sweetardio.fun** in the
[`cookiechain/apps`](https://github.com/cookiechain/apps) registry.

- `apps-entry.json` — the entry to add to the registry's `apps.json`
- `logos/sweetardio.png` — the logo asset (official "Sweetardio Collection" badge, 192×192)

## The entry

```json
{
  "title": "Sweetardio.fun",
  "description": "A sugar-coated arcade starring the Sweetardios. Slots & Coinpusher, free to play.",
  "tag": "NFT",
  "href": "https://sweetardio.fun",
  "logo": "https://raw.githubusercontent.com/cookiechain/apps/main/logos/sweetardio.png"
}
```

> **`tag` options** (per the registry): `DeFi`, `Wallet`, `Infra`, `NFT`, `Meme`.
> Set to `NFT` to lead with the Sweetardios collection; switch to `Meme` if you'd
> rather lead with the arcade vibe.

## Why this couldn't be auto-submitted from this session

This Claude Code session's GitHub access is scoped to
`dogecoin87/sweetarded-games` only, so it can't fork `cookiechain/apps` or open a
cross-repo PR against it. The steps below take under a minute to run yourself, or
re-run this task in a session whose scope includes `cookiechain/apps` (or your
fork of it) and it can open the PR for you.

## Option A — one shot with the `gh` CLI

```bash
# Prereqs: `gh auth login` done, `jq` installed. Run from anywhere.
set -euo pipefail
LOGO="$(pwd)/logos/sweetardio.png"     # adjust if you run this elsewhere

# 1. Fork + clone cookiechain/apps
gh repo fork cookiechain/apps --clone --remote
cd apps
git checkout -b add-sweetardio-fun

# 2. Drop in the logo
cp "$LOGO" logos/sweetardio.png

# 3. Append the entry (assumes apps.json is a top-level JSON array)
jq '. += [{
  "title": "Sweetardio.fun",
  "description": "A sugar-coated arcade starring the Sweetardios. Slots & Coinpusher, free to play.",
  "tag": "NFT",
  "href": "https://sweetardio.fun",
  "logo": "https://raw.githubusercontent.com/cookiechain/apps/main/logos/sweetardio.png"
}]' apps.json > apps.json.tmp && mv apps.json.tmp apps.json

# 4. Commit, push, open the PR
git add logos/sweetardio.png apps.json
git commit -m "Add Sweetardio.fun to the apps registry"
git push -u origin add-sweetardio-fun
gh pr create --repo cookiechain/apps \
  --title "Add Sweetardio.fun" \
  --body "Lists Sweetardio.fun — a free-to-play arcade (Slots & Coinpusher) starring the Sweetardios. Adds logos/sweetardio.png and an entry to apps.json."
```

> If `apps.json` isn't a plain top-level array (e.g. the entries live under a key
> like `"apps"`), adjust the `jq` filter accordingly, or just paste the object
> from `apps-entry.json` into the right place by hand.

## Option B — GitHub web UI

1. Open https://github.com/cookiechain/apps and click **Fork**.
2. In your fork, upload `logos/sweetardio.png` into the `logos/` folder.
3. Edit `apps.json` and add the object from `apps-entry.json` to the list.
4. Commit to a new branch and click **Contribute → Open pull request** back to
   `cookiechain/apps`.

## Registry requirements checklist

- [x] Cookie Chain-related project
- [x] Working public website (https://sweetardio.fun)
- [x] Clear description
- [x] Category from the allowed set (`NFT`)
- [x] Logo asset (PNG, one of the supported formats: PNG/JPG/JPEG/SVG/WEBP)
