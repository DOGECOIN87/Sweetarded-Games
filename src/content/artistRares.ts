/**
 * The Artist Series — one-of-one rares made for the Sweetardios collection by
 * guest artists. Files live in public/rares/; each entry links back to the
 * artist's own website and X profile. Add new rares here — the landing-page
 * carousel picks them up automatically and loops through however many exist.
 */

export type RareAccent = 'cerise' | 'cyan';

export interface ArtistRare {
  /** Image file inside public/rares/ (square art, pre-optimized). */
  file: string;
  /** Name of the piece. */
  title: string;
  /** Guest artist display name. */
  artist: string;
  /** Artist's own website. */
  website?: string;
  /** Artist's X profile URL. */
  x?: string;
  /** One-line curator note shown on the placard. */
  note?: string;
  /** Neon accent used for this slide's frame and links. */
  accent: RareAccent;
}

export const ARTIST_RARES: ArtistRare[] = [
  {
    file: 'radbro_webring.webp',
    title: 'Radbro Webring',
    artist: 'Radbro Webring',
    website: 'https://radbro.xyz',
    x: 'https://x.com/radbro_webring',
    note: 'Melting neon surrealism straight from the webring — lineage running parallel since day one.',
    accent: 'cyan',
  },
  {
    file: 'duhnut_candy_man.webp',
    title: 'Duhnut Candy Man',
    artist: 'Emily Cartoons',
    website: 'https://emilycartoons.com',
    x: 'https://x.com/cartoons_mad',
    note: 'A whisk-wielding glazed menace, fresh out of the fryer and ready for the shop floor.',
    accent: 'cerise',
  },
];

export const rareSrc = (rare: ArtistRare) => `/rares/${rare.file}`;
