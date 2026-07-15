export type LinkAccent = 'cerise' | 'cyan';

export interface CommunityLink {
  name: string;
  url: string;
  mark: string;
  accent: LinkAccent;
}

/** Official Sweetardio community profiles used across the landing page. */
export const COMMUNITY_LINKS: readonly CommunityLink[] = [
  {
    name: 'Discord',
    url: 'https://discord.gg/FQPqRcwdZQ',
    mark: 'DC',
    accent: 'cerise',
  },
  {
    name: 'Telegram',
    url: 'https://t.me/Sweetardios',
    mark: 'TG',
    accent: 'cyan',
  },
  {
    name: 'X',
    url: 'https://x.com/Sweetardio',
    mark: '𝕏',
    accent: 'cerise',
  },
];
