export type LinkAccent = 'cerise' | 'cyan';
export type SocialPlatform = 'discord' | 'telegram' | 'x';

export interface CommunityLink {
  name: string;
  url: string;
  icon: SocialPlatform;
  accent: LinkAccent;
}

/** Official Sweetardio community profiles used across the landing page. */
export const COMMUNITY_LINKS: readonly CommunityLink[] = [
  {
    name: 'Discord',
    url: 'https://discord.gg/FQPqRcwdZQ',
    icon: 'discord',
    accent: 'cyan',
  },
  {
    name: 'Telegram',
    url: 'https://t.me/Sweetardios',
    icon: 'telegram',
    accent: 'cyan',
  },
  {
    name: 'X',
    url: 'https://x.com/Sweetardio',
    icon: 'x',
    accent: 'cyan',
  },
];
