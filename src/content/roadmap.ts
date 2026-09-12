/**
 * What's cooking — the public plan, kept short on purpose.
 *
 * Only name things already in motion. Dates belong only on items that
 * already have a clock (mint, Arcade Cup). Everything in the back is
 * cooking, not promised. Edit this file when a beat flips.
 */

export type RoadmapAccent = 'cerise' | 'cyan' | 'violet';
export type RoadmapStatus = 'LIVE' | 'NEXT' | 'IN THE BACK';

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

export const ROADMAP_DISCLAIMER =
  'Dates only for things that already have a clock. Everything in the back is cooking, not promised.';

export const ROADMAP: readonly RoadmapBeat[] = [
  {
    id: 'live',
    status: 'LIVE',
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
    id: 'back',
    status: 'IN THE BACK',
    accent: 'violet',
    title: 'Still cooking',
    items: [
      {
        label: 'Real stakes',
        detail: 'On-chain games once the new programs are live. No date.',
      },
      {
        label: 'More machines',
        detail: 'The arcade grows. We name them when they exist.',
      },
    ],
  },
];
