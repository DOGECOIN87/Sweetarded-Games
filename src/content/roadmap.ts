/**
 * Public roadmap — three beats, no quarters, no over-promise.
 *
 * The heading is the destination. Dates belong only on items that
 * already have a clock (mint, Arcade Cup). Everything later is
 * cooking, not promised. Edit this file when a beat flips.
 */

export type RoadmapAccent = 'cerise' | 'cyan' | 'violet';
export type RoadmapStatus = 'NOW' | 'NEXT' | 'LATER';

export interface RoadmapItem {
  label: string;
  detail: string;
  to?: string;
}

export interface RoadmapBeat {
  id: string;
  status: RoadmapStatus;
  accent: RoadmapAccent;
  title: string;
  items: RoadmapItem[];
}

export const ROADMAP_NORTH_STAR = 'Build actually fun to play PVP games on Solana';
export const ROADMAP_NORTH_STAR_LINES = ['Build actually fun to play', 'PVP games on Solana'] as const;

export const ROADMAP_SUB =
  'Arcade now. Mint Sunday. Holders walk in after that. Real PVP when the programs are live — not before.';

export const ROADMAP_DISCLAIMER =
  'Dates only for things that already have a clock. Later is the destination, not a promise.';

export const ROADMAP: readonly RoadmapBeat[] = [
  {
    id: 'now',
    status: 'NOW',
    accent: 'cerise',
    title: 'The shop is open',
    items: [
      {
        label: 'Arcade',
        detail: 'Slots + Coinpusher. Free SWEET credits, live leaderboards.',
        to: '/arcade',
      },
      {
        label: 'Arcade Cup',
        detail: '55 free mints. Entries close Sept 12, 12:00 UTC.',
        to: '/leaderboard',
      },
      {
        label: 'The mint',
        detail: '4,444 Sweetardios. Sept 14, 12:00 UTC.',
        to: '/mint',
      },
    ],
  },
  {
    id: 'next',
    status: 'NEXT',
    accent: 'cyan',
    title: 'After the drop',
    items: [
      {
        label: 'Holders walk in',
        detail: 'Your wallet is your Sweetardio. Arcade standings become mint perks.',
      },
      {
        label: 'Secondaries',
        detail: 'Magic Eden and Tensor at launch — only the official pages.',
      },
    ],
  },
  {
    id: 'later',
    status: 'LATER',
    accent: 'violet',
    title: 'PVP on Solana',
    items: [
      {
        label: 'The real games',
        detail: 'On-chain PVP that is actually fun to play. No date.',
      },
      {
        label: 'More machines',
        detail: 'The arcade grows. We name them when they exist.',
      },
    ],
  },
];
