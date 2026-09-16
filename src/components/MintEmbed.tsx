import type { ReactNode } from 'react';

/**
 * Official Sweetardio mint — OpenSea.
 *
 * The collection mints through OpenSea's SeaDrop (ERC-721) on Robinhood Chain.
 * OpenSea does not offer an embeddable mint widget, so the on-site slot is a
 * clear hand-off card instead of third-party controls. OpenSea is authoritative
 * for price, supply, per-wallet limits, stage timing and the transaction.
 *
 * MINT_URL is the single source of truth: the hero CTA, mint section, Get
 * Started links, whitelist page and the AgentMint prompt all import it.
 */

export const MINT_URL = 'https://opensea.io/collection/sweetardio';
export const MINT_PLATFORM = 'OpenSea';
export const MINT_CHAIN = 'Robinhood Chain';

/** Human-readable form of MINT_URL, shown so visitors can verify the link. */
const MINT_URL_DISPLAY = MINT_URL.replace(/^https?:\/\//, '');

interface MintEmbedProviderProps {
  children: ReactNode;
}

/**
 * Previously kept the LaunchMyNFT widget mounted across routes. OpenSea needs
 * no persistent vendor script, so this is now a pass-through — kept so App.tsx
 * and any future embed can reuse the same seam.
 */
export const MintEmbedProvider = ({ children }: MintEmbedProviderProps) => <>{children}</>;

/** On-site mint slot: hands the visitor to the official OpenSea mint page. */
const MintEmbed = () => (
  <div className="flex w-full flex-col items-center gap-4">
    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-sweetardios-cyan">
      <span
        aria-hidden
        className="h-1.5 w-1.5 animate-pulse bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]"
        style={{ borderRadius: '9999px' }}
      />
      Minting now · {MINT_CHAIN}
    </span>

    <a
      href={MINT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="sw-shine inline-flex w-full items-center justify-center gap-2 px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan sm:w-auto sm:px-10 sm:text-base"
      style={{ background: '#F715AB', boxShadow: '0 0 24px rgba(247, 21, 171, 0.3)' }}
    >
      Mint on {MINT_PLATFORM} <span aria-hidden>↗</span>
    </a>

    <p className="text-[11px] tracking-[0.08em] text-blue-100/50">
      Official link: <span className="font-mono text-blue-100/75">{MINT_URL_DISPLAY}</span>
    </p>
  </div>
);

export default MintEmbed;
