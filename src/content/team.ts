/**
 * The Team — everyone behind Sweetardio, one card each.
 * Avatar can be a static image or a looping video (for animated avatars);
 * TeamSection renders either into the same circular frame.
 */

export interface TeamLink {
  label: string;
  url: string;
}

export interface TeamMember {
  name: string;
  alias: string;
  role: string;
  bio: string;
  /** Static portrait, or a looping video avatar. `sources` lists formats in
   *  preference order (webm first — smaller, and covers browsers without
   *  H.264 licensed in). */
  avatar: { type: 'image'; src: string } | { type: 'video'; sources: string[] };
  links?: TeamLink[];
}

export const TEAM: readonly TeamMember[] = [
  {
    name: 'Matt Mobley',
    alias: 'Mattrick',
    role: 'Creator / Artist',
    bio: 'Creator/Artist for the Sweetardio Collection, a Verified Musician on Audius.',
    avatar: { type: 'image', src: '/maker/mattrick.webp' },
    links: [{ label: 'Verified on Audius', url: 'https://audius.co/mattrickbeats' }],
  },
  {
    name: 'Kevin F.',
    alias: 'Simplex',
    role: 'Software Development Manager',
    bio: '30+ years experience in managing software development teams.',
    avatar: { type: 'video', sources: ['/team/kevin-simplex.webm', '/team/kevin-simplex.mp4'] },
  },
] as const;
