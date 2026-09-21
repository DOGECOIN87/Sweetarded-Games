/**
 * Site-wide launch status copy.
 *
 * Every surface that talks about where the mint stands — the banner under the
 * nav, the hero split-flap board, the mint panel and the whitelist form —
 * reads these strings, so the status can never drift between them. When the
 * live launch is scheduled, set VITE_MINT_START_AT to the new instant and
 * update the headline here in the same pass.
 */
export const LAUNCH_HEADLINE = 'Pre-release is over, live launch coming soon!';

/** Call to action that follows the headline. Points at /whitelist. */
export const LAUNCH_SUBLINE = 'Look for more whitelistings!';

/** Both halves in one line, for compact spots (alt text, aria labels). */
export const LAUNCH_NOTICE = `${LAUNCH_HEADLINE} ${LAUNCH_SUBLINE}`;
