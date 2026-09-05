import type { SocialPlatform } from './siteLinks';

/**
 * The Team — everyone behind Sweetardio, one card each.
 * Avatar can be a static image or a looping video (for animated avatars);
 * TeamSection renders either into the same circular frame.
 */

export interface TeamLink {
  label: string;
  url: string;
  /** Renders the matching glyph beside the label. Omit for a plain text link. */
  icon?: SocialPlatform;
}

export interface TeamMember {
  name: string;
  /** Nickname/handle shown as `a.k.a. "X"` — omit if the member doesn't use one. */
  alias?: string;
  role?: string;
  bio?: string;
  /** Static portrait, or a looping video avatar. `sources` lists formats in
   *  preference order (webm first — smaller, and covers browsers without
   *  H.264 licensed in). */
  avatar: { type: 'image'; src: string } | { type: 'video'; sources: string[] };
  links?: TeamLink[];
  /** Handles with no single canonical profile URL (e.g. a Discord username) — shown as plain text, not a link. */
  discord?: string;
}

export const TEAM: readonly TeamMember[] = [
  {
    name: 'Matt Mobley',
    alias: 'Mattrick',
    role: 'Creator / Artist',
    bio: 'Creator/Artist for the Sweetardio Collection, a Verified Musician on Audius.',
    avatar: { type: 'image', src: '/maker/mattrick.webp' },
    links: [
      { label: '@mattrickbeats', url: 'https://x.com/mattrickbeats', icon: 'x' },
      { label: 'Verified on Audius', url: 'https://audius.co/mattrickbeats' },
    ],
    discord: 'mattrick8321',
  },
  {
    name: 'Kevin F.',
    alias: 'Simplex',
    role: 'Software Development Manager',
    bio: '30+ years experience in managing software development teams.',
    avatar: { type: 'video', sources: ['/team/kevin-simplex.webm', '/team/kevin-simplex.mp4'] },
    discord: 'simplex',
  },
  {
    name: 'Michael Gbolasere',
    role: 'Founder, GMA Marketing Agency',
    bio:
      'Web3 and crypto marketing specialist and founder of GMA Marketing Agency. In crypto since 2017, ' +
      'he runs campaigns across community growth, KOL deployment, NFT projects, and token launches for ' +
      'global markets. He’s a Top Rated Plus freelancer on Upwork with a 100% job success score.',
    /* TODO: swap in his real portrait once it's provided as an uploaded file. */
    avatar: { type: 'image', src: '/team/michael-gbolasere.jpg' },
    links: [{ label: '@gma_ox', url: 'https://x.com/gma_ox', icon: 'x' }],
    discord: 'gma_marketing',
  },
  {
    name: 'iLLPeTiLL',
    role: 'Verified Music Producer',
    bio: 'Electronic music producer — sound design, groove, and emotion.',
    /* TODO: swap in his real portrait once it's provided as an uploaded file. */
    avatar: { type: 'image', src: '/team/illpetill.jpg' },
    links: [{ label: '@iLLPeTiLL', url: 'https://x.com/iLLPeTiLL', icon: 'x' }],
    discord: 'illpetill',
  },
  {
    name: 'Jithu Mohan',
    role: 'Community Manager / Moderator',
    bio: 'In crypto since 2019, running community and moderation for Web3 projects since 2022.',
    /* TODO: swap in his real portrait once it's provided as an uploaded file. */
    avatar: { type: 'image', src: '/team/jithu-mohan.jpg' },
    links: [
      { label: '@mrpishh', url: 'https://x.com/mrpishh', icon: 'x' },
      { label: '@mrfish', url: 'https://t.me/mrfish', icon: 'telegram' },
      { label: 'Discord', url: 'https://discord.com/users/821471871732023366', icon: 'discord' },
    ],
  },
  {
    name: 'Mr Sam',
    role: 'Web3 Creative',
    bio: 'Web3 creative mind — video and content for brands and projects.',
    /* TODO: swap in his real portrait once it's provided as an uploaded file. */
    avatar: { type: 'image', src: '/team/mr-sam.jpg' },
    links: [{ label: '@Mr0xsam', url: 'https://t.me/Mr0xsam', icon: 'telegram' }],
    discord: 'mr0xsam',
  },
  {
    name: 'Hudson',
    role: 'Web3 Writer · Wallet Tracker',
    bio: 'GOD is the greatest 👑 · Creative Web3 writer · Pro wallet tracker · building $COOK.',
    /* TODO: swap in his real portrait once it's provided as an uploaded file. */
    avatar: { type: 'image', src: '/team/hudson.jpg' },
    links: [{ label: '@defi_huds', url: 'https://x.com/defi_huds', icon: 'x' }],
    discord: 'hudson_wav',
  },
] as const;
