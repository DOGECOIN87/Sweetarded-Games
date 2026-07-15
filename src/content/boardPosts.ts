import { BoardPost } from '../services/boardService';

/**
 * Starter notes for The Board.
 *
 * These render whenever Firestore has no `board_posts` yet (or is
 * unreachable), so the board never looks empty. Two ways to post:
 *
 *   1. Firebase console → Firestore → board_posts → Add document
 *      (see src/services/boardService.ts for the field list), or
 *   2. edit this file and redeploy.
 */
export const FALLBACK_BOARD_POSTS: BoardPost[] = [
  {
    id: 'welcome',
    title: 'Welcome to The Board',
    body:
      'This is the Sweetardio notice board. Mint updates, game news, events and everything worth knowing gets pinned right here — check back often.',
    tag: 'Announcement',
    paper: 'pink',
  },
  {
    id: 'mint',
    title: 'Sweetardio Collection mint',
    body:
      'The Sweetardio Collection mint has been rescheduled, with the new date coming soon. Join the whitelist, then mint here on Sweetardio.fun or use LaunchMyNFT directly.',
    tag: 'Mint',
    link: '#/mint',
    linkLabel: 'Open on-site mint',
    paper: 'white',
  },
  {
    id: 'arcade',
    title: 'The arcade is open',
    body:
      'Slots and the Coinpusher are free to play right now. Walk into the arcade, pick a machine and climb the leaderboards.',
    tag: 'Games',
    link: '#/arcade',
    linkLabel: 'Enter the arcade',
    paper: 'cyan',
  },
];
