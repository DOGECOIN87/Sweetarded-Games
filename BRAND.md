# Sweetarded-Games — Brand & Design Tokens

The visual identity for the games is built on the **Sweetardios** NFT collection palette.

## Palette

| Swatch | Hex | Name | Tailwind token | Intended role |
| ------ | ----- | ----------------- | -------------------------- | --------------------------------------- |
| 🟦 | `#070F34` | Oxford Blue | `sweetardios-oxford` | Base background / darkest layer |
| 🟦 | `#0313A6` | Zaffre | `sweetardios-zaffre` | Panels, cards, reel frames |
| 🟪 | `#9201CB` | Dark Violet | `sweetardios-violet` | Primary brand / structure |
| 🟪 | `#F715AB` | Hollywood Cerise | `sweetardios-cerise` | CTAs, wins, highlights |
| 🟦 | `#34EDF3` | Fluorescent Cyan | `sweetardios-cyan` | Neon glow, interactive accents |

> Role mapping above is a starting proposal — refine per game during the redesign.

## Usage

These are wired into `tailwind.config.js` under `theme.extend.colors.sweetardios`, so any
Tailwind color utility works with them:

```html
<div class="bg-sweetardios-oxford text-sweetardios-cyan border border-sweetardios-violet">
  <button class="bg-sweetardios-cerise hover:bg-sweetardios-violet">SPIN</button>
</div>
```

Raw hex (for canvas / inline styles / WebGL):

```ts
export const SWEETARDIOS = {
  oxford: '#070F34',
  zaffre: '#0313A6',
  violet: '#9201CB',
  cerise: '#F715AB',
  cyan:   '#34EDF3',
} as const;
```

## Migration note

The current components still use the legacy accents inherited from trashmarket.fun
(`magic-blue #00d4ff`, green `#39FF14` / `#adff02`, etc.). The redesign will replace
those with the Sweetardios tokens above. The legacy `magic-*` colors remain defined
for now so nothing breaks mid-migration.
