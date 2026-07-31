/**
 * The Maker — bio content for the person behind Sweetardio.
 *
 * Grounded in the artist's own Audius profile (checked live 2026-07-31 via
 * the public API): handle MATTRICKBEATS, display name MATTRICK,
 * is_verified: true, self-description "Producer / Developer / Artist /
 * Sweetardio NFT Collection Creator". The MakerBio component re-fetches the
 * verified flag + live track/follower counts at runtime (Audius API allows
 * browser CORS); everything renders fine without the API too.
 */

export const MAKER = {
  name: 'MATTRICK',
  /** His own words, from the Audius profile. */
  role: 'Producer · Developer · Artist',
  tagline: 'Creator of the Sweetardios',
  blurb:
    'The candy shop has one pair of hands behind it — the art, the code, the games, ' +
    'and every track in the jukebox. The soundtrack streams straight from his Audius, ' +
    'where the checkmark is real.',
  portrait: '/maker/mattrick.webp',
  audius: {
    handle: 'MATTRICKBEATS',
    url: 'https://audius.co/MATTRICKBEATS',
    /** Public API endpoint used for the live verified badge + stats. */
    api: 'https://api.audius.co/v1/users/handle/MATTRICKBEATS?app_name=sweetardio',
  },
  /** Project X — swap for a personal handle if you'd rather feature that. */
  x: { label: '@Sweetardio', url: 'https://x.com/Sweetardio' },
} as const;
