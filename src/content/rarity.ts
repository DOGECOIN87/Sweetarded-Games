/**
 * Rarity data for the Sweetardio Collection — 4,444 tokens.
 *
 * Transcribed straight from the collection repo's shipped rarity table
 * (Sweetardio_Collection catalog/RARITY.md), which is itself generated from
 * the minted token metadata. Every count and share below comes from those
 * tables; regenerate this file if the mint is ever recalibrated.
 *
 * Two denominators are in play, hence `scale`:
 *   'composited' — the 4,442 composited characters (secret rares carry no
 *                  character, plate, skin, eyes or mouth, so they are excluded)
 *   'all'        — all 4,444 tokens
 */

export interface RarityRow {
  name: string;
  count: number;
  /** Share of the category's denominator, in percent. */
  share: number;
  /** Design tier, where the source table names one. */
  tier?: string;
}

export interface RarityCategory {
  id: string;
  label: string;
  scale: 'composited' | 'all';
  /** True where the categories are genuinely ordered (a tier ladder), not just named. */
  ordinal?: boolean;
  note: string;
  /** For optional traits: how many tokens carry the trait at all. */
  carried?: { count: number; share: number };
  /** Always ordered rarest first. */
  rows: RarityRow[];
}

/** Total mint. */
export const SUPPLY = 4444;
/** Tokens built by compositing traits over a character (the rest are 1/1 secret rares). */
export const COMPOSITED = 4442;

export const RARITY_CATEGORIES: RarityCategory[] = [
  {
    id: 'characters',
    label: 'Characters',
    scale: 'composited',
    note:
      'The snack you are. Four chase characters sit at 60 apiece; the doughnuts are where the mint lands most often.',
    rows: [
      { name: 'Churro', count: 60, share: 1.35, tier: 'chase' },
      { name: 'Gold Waffle', count: 60, share: 1.35, tier: 'chase' },
      { name: 'OG Gummy Bear', count: 60, share: 1.35, tier: 'chase' },
      { name: 'Zebra Cake', count: 60, share: 1.35, tier: 'chase' },
      { name: 'Chocolate Sandwich Cookie', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'Cyan Frosted Pop Tart', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'Ding Dong', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'Marshmallow', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'Nutty Bar', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'Oatmeal Cream Pie', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'Rice Crispy Treat', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'S\'mores', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'Twinkie', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'Waffle', count: 130, share: 2.93, tier: 'uncommon' },
      { name: 'OG Pop Tart', count: 177, share: 3.98, tier: 'common' },
      { name: 'Pink Sherbert Ice Cream', count: 181, share: 4.07, tier: 'common' },
      { name: 'Neapolitan Ice Cream', count: 182, share: 4.1, tier: 'common' },
      { name: 'Chocolate Frosted Pop Tart', count: 193, share: 4.34, tier: 'common' },
      { name: 'Cyan Sherbert Ice Cream', count: 195, share: 4.39, tier: 'common' },
      { name: 'Chocolate Ice Cream', count: 196, share: 4.41, tier: 'common' },
      { name: 'Vanilla Ice Cream', count: 207, share: 4.66, tier: 'common' },
      { name: 'Brownie Bite', count: 245, share: 5.51, tier: 'common' },
      { name: 'Sugar Cube', count: 245, share: 5.51, tier: 'common' },
      { name: 'Chocolate Chip Cookie', count: 253, share: 5.69, tier: 'common' },
      { name: 'Chocolate Doughnut', count: 261, share: 5.87, tier: 'common' },
      { name: 'Sugar Doughnut', count: 273, share: 6.14, tier: 'common' },
      { name: 'Glazed Doughnut', count: 294, share: 6.62, tier: 'common' },
    ],
  },
  {
    id: 'plate-tier',
    label: 'Plate Tier',
    scale: 'composited',
    ordinal: true,
    note:
      'What a background is worth, stated on the token itself. The ladder is monotone — every Legendary is rarer than every ordinary plate.',
    rows: [
      { name: 'Ultra', count: 22, share: 0.5 },
      { name: 'Legendary', count: 120, share: 2.7 },
      { name: 'Scarce', count: 355, share: 7.99 },
      { name: 'Uncommon', count: 1073, share: 24.14 },
      { name: 'Standard', count: 2872, share: 64.63 },
    ],
  },
  {
    id: 'trait-count',
    label: 'Trait Count',
    scale: 'composited',
    note:
      'The axis collectors actually rank on — and both tails are rarer than a Legendary plate. Five is the floor: no arm, no footwear, no sticker.',
    rows: [
      { name: '9', count: 7, share: 0.16 },
      { name: '5', count: 135, share: 3.04 },
      { name: '8', count: 170, share: 3.83 },
      { name: '7', count: 1238, share: 27.86 },
      { name: '6', count: 2892, share: 65.08 },
    ],
  },
  {
    id: 'backgrounds',
    label: 'Backgrounds',
    scale: 'composited',
    note:
      'Sixty-four plates. Starfield is the scarcest thing you can stand in front of; the four Legendary plates are slot-allocated and never enter the weighted draw.',
    rows: [
      { name: 'Starfield', count: 22, share: 0.5 },
      { name: 'Legendary Just Aliens', count: 30, share: 0.68 },
      { name: 'Legendary Opengotchi', count: 30, share: 0.68 },
      { name: 'Legendary Simplex', count: 30, share: 0.68 },
      { name: 'Legendary Tenders', count: 30, share: 0.68 },
      { name: 'In Cook We Trust', count: 42, share: 0.95 },
      { name: 'Winning', count: 42, share: 0.95 },
      { name: 'Cookie Dough', count: 43, share: 0.97 },
      { name: 'Bubble Trouble', count: 44, share: 0.99 },
      { name: 'Abduction', count: 45, share: 1.01 },
      { name: 'Toasted', count: 45, share: 1.01 },
      { name: 'Goo Lagoon', count: 46, share: 1.04 },
      { name: 'Sweet Castle', count: 48, share: 1.08 },
      { name: 'Choco Falls', count: 53, share: 1.19 },
      { name: 'RIP Gorbagana', count: 57, share: 1.28 },
      { name: 'Mars', count: 58, share: 1.31 },
      { name: 'Crumble Trail', count: 59, share: 1.33 },
      { name: 'Cabaret Alley', count: 61, share: 1.37 },
      { name: 'Coder Chick', count: 61, share: 1.37 },
      { name: 'Candy Tundra', count: 62, share: 1.4 },
      { name: 'Empty Fridge', count: 63, share: 1.42 },
      { name: 'Flavor Explosion', count: 63, share: 1.42 },
      { name: 'Midnight Snack', count: 64, share: 1.44 },
      { name: 'Sweet Shop', count: 65, share: 1.46 },
      { name: 'Pink Abyss', count: 66, share: 1.49 },
      { name: 'Snack Pack', count: 66, share: 1.49 },
      { name: 'Whitehouse Lawn', count: 66, share: 1.49 },
      { name: 'The Miami Mall Incident', count: 68, share: 1.53 },
      { name: 'Cereal Killer', count: 70, share: 1.58 },
      { name: 'Psychedelics', count: 71, share: 1.6 },
      { name: 'The 2023 Las Vegas Incident', count: 75, share: 1.69 },
      { name: 'Straight of America', count: 76, share: 1.71 },
      { name: 'Drained The Swamp', count: 77, share: 1.73 },
      { name: 'Starburst', count: 77, share: 1.73 },
      { name: 'The Set', count: 79, share: 1.78 },
      { name: 'Why So Cereal', count: 79, share: 1.78 },
      { name: 'Clouds', count: 80, share: 1.8 },
      { name: 'Sweetardio', count: 80, share: 1.8 },
      { name: 'Nabisco', count: 81, share: 1.82 },
      { name: 'UAP Taskforce', count: 82, share: 1.85 },
      { name: 'Tooth Decay', count: 83, share: 1.87 },
      { name: 'Baked', count: 84, share: 1.89 },
      { name: 'Cookboy Chocolate', count: 84, share: 1.89 },
      { name: 'Swolex', count: 84, share: 1.89 },
      { name: 'Druski', count: 85, share: 1.91 },
      { name: 'He Needs Some Milk', count: 85, share: 1.91 },
      { name: 'I\'m Not Sorry', count: 85, share: 1.91 },
      { name: 'The Board', count: 85, share: 1.91 },
      { name: 'Tootsie Cerise', count: 85, share: 1.91 },
      { name: 'Bored Apes', count: 86, share: 1.94 },
      { name: 'Soft Serve', count: 86, share: 1.94 },
      { name: 'Cookboy', count: 87, share: 1.96 },
      { name: 'Graham', count: 87, share: 1.96 },
      { name: 'Room', count: 87, share: 1.96 },
      { name: 'Vanilla Lane', count: 87, share: 1.96 },
      { name: 'Ayatollah', count: 88, share: 1.98 },
      { name: 'Emblem', count: 88, share: 1.98 },
      { name: 'Smuckers Blue', count: 88, share: 1.98 },
      { name: 'Tampa Bay Pete', count: 88, share: 1.98 },
      { name: 'Hurshey', count: 89, share: 2 },
      { name: 'Store', count: 90, share: 2.03 },
      { name: 'Sugar', count: 91, share: 2.05 },
      { name: 'Where\'s My $ B1tch', count: 91, share: 2.05 },
      { name: 'Tootsie Blue', count: 93, share: 2.09 },
    ],
  },
  {
    id: 'weather',
    label: 'Weather',
    scale: 'all',
    note:
      'The animated tier — a weather token carries a seamless video loop as well as its still. Kept off the legendary plates, so no token is both Legendary and animated.',
    carried: { count: 444, share: 10 },
    rows: [
      { name: 'Tornado', count: 14, share: 0.32 },
      { name: 'Flooded', count: 30, share: 0.68 },
      { name: 'Blizzard', count: 40, share: 0.9 },
      { name: 'Storm', count: 75, share: 1.69 },
      { name: 'Fog', count: 80, share: 1.8 },
      { name: 'Snow', count: 95, share: 2.14 },
      { name: 'Rain', count: 110, share: 2.48 },
    ],
  },
  {
    id: 'arms',
    label: 'Arms',
    scale: 'all',
    note:
      'Exact counts. The AK15 is the rarest thing a Sweetardio can hold.',
    carried: { count: 707, share: 15.9 },
    rows: [
      { name: 'AK15', count: 20, share: 0.45 },
      { name: 'Blue Saber', count: 25, share: 0.56 },
      { name: 'Cyan Saber', count: 25, share: 0.56 },
      { name: 'Pink Saber', count: 25, share: 0.56 },
      { name: 'Dual Uzis', count: 40, share: 0.9 },
      { name: 'AR47', count: 55, share: 1.24 },
      { name: 'Knives', count: 64, share: 1.44 },
      { name: 'Military Brat', count: 85, share: 1.91 },
      { name: 'Nerf Blaster', count: 110, share: 2.48 },
      { name: 'Katana', count: 128, share: 2.88 },
      { name: 'Cash', count: 130, share: 2.93 },
    ],
  },
  {
    id: 'footwear',
    label: 'Footwear',
    scale: 'all',
    note:
      'Exact counts, spread almost evenly — the slipper you get matters less than getting slippers at all.',
    carried: { count: 533, share: 12 },
    rows: [
      { name: 'Gorbhouse Slippers', count: 100, share: 2.25 },
      { name: 'Bunny Slippers', count: 108, share: 2.43 },
      { name: 'Cookie Monster Slippers', count: 108, share: 2.43 },
      { name: 'Pepe Slippers', count: 108, share: 2.43 },
      { name: 'Shiba Slippers', count: 109, share: 2.45 },
    ],
  },
  {
    id: 'eyes',
    label: 'Eyes',
    scale: 'composited',
    note:
      'Calibrated by design rather than left to the compatibility rules — which had previously made Blue the rarest eye by accident.',
    rows: [
      { name: 'Cyborg', count: 136, share: 3.06 },
      { name: 'Blue', count: 228, share: 5.13 },
      { name: 'Cerise', count: 309, share: 6.95 },
      { name: 'Cyan', count: 336, share: 7.56 },
      { name: 'Alien', count: 432, share: 9.72 },
      { name: 'Side Eye', count: 531, share: 11.95 },
      { name: 'Beady', count: 534, share: 12.02 },
      { name: 'Smug', count: 584, share: 13.14 },
      { name: 'Clueless', count: 666, share: 14.99 },
      { name: 'Googly', count: 686, share: 15.44 },
    ],
  },
  {
    id: 'mouths',
    label: 'Mouths',
    scale: 'composited',
    note:
      'Nine expressions, from the 4% Lollipop down to the Flat face that one in five wear.',
    rows: [
      { name: 'Lollipop', count: 180, share: 4.05 },
      { name: 'Smoke', count: 217, share: 4.88 },
      { name: 'Diamond Grill', count: 313, share: 7.04 },
      { name: 'Fang', count: 407, share: 9.16 },
      { name: 'Tasty', count: 490, share: 11.03 },
      { name: 'Awkward Smile', count: 575, share: 12.94 },
      { name: 'Smirk', count: 659, share: 14.83 },
      { name: 'Sad', count: 755, share: 16.99 },
      { name: 'Flat', count: 846, share: 19.04 },
    ],
  },
  {
    id: 'skins',
    label: 'Skins',
    scale: 'composited',
    note:
      'Three finishes. Alien skin lands on fewer than one in fourteen.',
    rows: [
      { name: 'Alien', count: 297, share: 6.68 },
      { name: 'Black', count: 1704, share: 38.34 },
      { name: 'White', count: 2441, share: 54.93 },
    ],
  },
  {
    id: 'secret-rarez',
    label: 'Secret Rarez',
    scale: 'all',
    note:
      'The 1/1 tier, and the rarest thing in the collection. Each is a complete guest-artist artwork minted as the entire token — no character, no plate, no traits over it.',
    carried: { count: 2, share: 0.05 },
    rows: [
      { name: '#1 Duhnut Candy Man', count: 1, share: 0.02 },
      { name: '#2 Radbro Webring', count: 1, share: 0.02 },
    ],
  },
];

/** One in N, for a share stated in percent. */
export const oneIn = (share: number) => Math.round(100 / share);
