/** Wiring for the pharmacy that isn't copy. */

/** The only hosts the window opens on. Anywhere else, the bag says shut. */
export const OFFICIAL_HOSTS = ['sweetardio.fun', 'www.sweetardio.fun'];

export const isOfficialHost = (): boolean => {
  if (import.meta.env.DEV) return true;
  const host = window.location.hostname;
  return OFFICIAL_HOSTS.includes(host) || host === 'localhost' || host === '127.0.0.1';
};

export const X_HANDLE = 'Sweetardio';

/**
 * Status id of the official notice on x.com/Sweetardio (the "like the
 * official notice" side effect). While null, that task opens the profile.
 */
export const OFFICIAL_NOTICE_TWEET_ID: string | null = null;

export const SIDE_EFFECT_LINKS = {
  follow: `https://x.com/intent/follow?screen_name=${X_HANDLE}`,
  like: OFFICIAL_NOTICE_TWEET_ID
    ? `https://x.com/intent/like?tweet_id=${OFFICIAL_NOTICE_TWEET_ID}`
    : `https://x.com/${X_HANDLE}`,
} as const;

/**
 * The back rooms, only for patients who spat them out. Hidden in the counter
 * painting: Telegram lights up the vending machine's little screen (the
 * screen and keypad are the link), Discord hides behind the REFUSED WELCOME sign. While a link is null its spot stays plain wall.
 */
export const REFUSED_LINKS: { telegram: string | null; discord: string | null } = {
  telegram: 'https://t.me/Sweetardios',
  discord: null,
};

/** Phase 1 price as printed on the bag. The live collection doc overrides it. */
export const PRINTED_COST = '0.0420';

/**
 * LaunchMyNFT collection. The embed script is the one their dashboard hands
 * out; the doc is the collection's public config (price, supply, sold out),
 * the same document the embed reads.
 */
export const LMNFT = {
  ownerId: 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo',
  collectionId: '8azF6Zkfb5ExKPty13RO',
  script: 'https://storage.googleapis.com/scriptslmt/0.1.3/solana.js',
  style: 'https://storage.googleapis.com/scriptslmt/0.1.3/solana.css',
  doc:
    'https://firestore.googleapis.com/v1/projects/launch-my-nft/databases/(default)/documents/' +
    'Users/Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo/Collections/8azF6Zkfb5ExKPty13RO' +
    '?key=AIzaSyDpBtDjue_-0rB9LglNDD-rVACaUXRWPho',
} as const;
