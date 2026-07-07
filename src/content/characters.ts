/**
 * The Cast — the 3D candy characters of the Sweetardio collection, one of
 * each. Files live in public/characters/; the site renders the trimmed cuts
 * in public/characters/trimmed/ (the originals are ~1MB sheet canvases).
 * Add new cast members here.
 */
export interface Character {
  file: string;
  name: string;
}

export const CHARACTERS: Character[] = [
  { file: 'brownie_bite.png', name: 'Brownie Bite' },
  { file: 'chocolate_chip_cookie.png', name: 'Chocolate Chip Cookie' },
  { file: 'chocolate_doughnut.png', name: 'Chocolate Doughnut' },
  { file: 'chocolate_frosted_poptart.png', name: 'Chocolate Frosted Poptart' },
  { file: 'chocolate_sandwich_cookie.png', name: 'Chocolate Sandwich Cookie' },
  { file: 'churro.png', name: 'Churro' },
  { file: 'cyan_frosted_poptart.png', name: 'Cyan Frosted Poptart' },
  { file: 'cyan_gummy_bear.png', name: 'Cyan Gummy Bear' },
  { file: 'cyan_sherbert_ice_cream.png', name: 'Cyan Sherbert Ice Cream' },
  { file: 'ding_dong.png', name: 'Ding Dong' },
  { file: 'glazed_doughnut.png', name: 'Glazed Doughnut' },
  { file: 'gold_waffle.png', name: 'Gold Waffle' },
  { file: 'marshmallow.png', name: 'Marshmallow' },
  { file: 'mint_chocolate_chip_ice_cream.png', name: 'Mint Chocolate Chip Ice Cream' },
  { file: 'neapolitan_ice_cream.png', name: 'Neapolitan Ice Cream' },
  { file: 'oatmeal_cream_pie.png', name: 'Oatmeal Cream Pie' },
  { file: 'og_gummy_bear.png', name: 'OG Gummy Bear' },
  { file: 'og_poptart.png', name: 'OG Poptart' },
  { file: 'pink_gummy_bear.png', name: 'Pink Gummy Bear' },
  { file: 'pink_sherbert_ice_cream.png', name: 'Pink Sherbert Ice Cream' },
  { file: 'purple_gummy_bear.png', name: 'Purple Gummy Bear' },
  { file: 'rainbow_sherbert_ice_cream.png', name: 'Rainbow Sherbert Ice Cream' },
  { file: 'rice_crispy_treat.png', name: 'Rice Crispy Treat' },
  { file: 'rocky_road_ice_cream.png', name: 'Rocky Road Ice Cream' },
  { file: 'smores.png', name: "S'mores" },
  { file: 'sugar_cube.png', name: 'Sugar Cube' },
  { file: 'sugar_doughnut.png', name: 'Sugar Doughnut' },
  { file: 'Twinkie.png', name: 'Twinkie' },
  { file: 'vanilla_ice_cream.png', name: 'Vanilla Ice Cream' },
  { file: 'waffle.png', name: 'Waffle' },
  { file: 'zaffre_sherbert_ice_cream.png', name: 'Zaffre Sherbert Ice Cream' },
  { file: 'zebra_cake.png', name: 'Zebra Cake' },
];

export const characterSrc = (c: Character) => `/characters/trimmed/${c.file}`;
