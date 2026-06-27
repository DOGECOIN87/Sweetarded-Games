import { useEffect } from 'react';

/**
 * LaunchMyNFT mint embed.
 *
 * Drops in the official LaunchMyNFT widget (mint button + live counter) for the
 * upcoming Sweetardio mint. Their script reads `window.ownerId` /
 * `window.collectionId` and hydrates the `#mint-button-container` and
 * `#mint-counter` elements.
 *
 * Because this is a single-page app, the mint containers only exist once React
 * has mounted this component — so we inject the LaunchMyNFT script *after* the
 * containers are in the DOM (with a cache-busting query so it re-hydrates on
 * SPA re-mounts) rather than hard-coding it in index.html where it would run
 * before #root is populated.
 */

export const MINT_URL = 'https://www.launchmynft.io/mint/sweetardio';

const LMNFT_OWNER_ID = 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo';
const LMNFT_COLLECTION_ID = 'f3Xa1ZHZGsDApCLATuX7';
const LMNFT_SCRIPT_SRC = 'https://storage.googleapis.com/scriptslmt/0.1.3/solana.js';
const LMNFT_STYLE_HREF = 'https://storage.googleapis.com/scriptslmt/0.1.3/solana.css';

const MintEmbed = () => {
  useEffect(() => {
    // Config read by the LaunchMyNFT script on load.
    (window as unknown as { ownerId: string }).ownerId = LMNFT_OWNER_ID;
    (window as unknown as { collectionId: string }).collectionId = LMNFT_COLLECTION_ID;

    // Stylesheet — add once.
    if (!document.querySelector('link[data-lmnft]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LMNFT_STYLE_HREF;
      link.dataset.lmnft = '1';
      document.head.appendChild(link);
    }

    // Script — (re)inject now that the containers exist. The cache-busting
    // query forces re-evaluation so the widget re-hydrates after navigation.
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `${LMNFT_SCRIPT_SRC}?v=${Date.now()}`;
    script.dataset.lmnft = '1';
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Live mint counter (hydrated by LaunchMyNFT) */}
      <div id="mint-counter" className="text-sweetardios-cyan" />

      {/* Mint button (hydrated by LaunchMyNFT) */}
      <div id="mint-button-container" className="min-h-[48px]" />

      {/* Always-available fallback link in case the embed is blocked / slow */}
      <a
        href={MINT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs uppercase tracking-[0.22em] text-blue-100/60 underline-offset-4 transition-colors hover:text-sweetardios-cerise hover:underline"
      >
        Trouble minting? Open on LaunchMyNFT ↗
      </a>
    </div>
  );
};

export default MintEmbed;
