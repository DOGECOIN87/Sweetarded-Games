/** Wallet and browser capability checks used by the mint handoff. */

const ua = () => navigator.userAgent;

/** A phone or tablet. iPadOS reports itself as a Mac, so touch points decide. */
export function isMobileDevice(): boolean {
  if (/iPhone|iPad|iPod|Android/i.test(ua())) return true;
  return /Macintosh/.test(ua()) && navigator.maxTouchPoints > 1;
}

/**
 * X, Instagram, Facebook… in-app browsers. Named ones by their UA token; any
 * other iOS web view by the missing Safari token (real iOS browsers keep it),
 * any Android web view by its `wv` marker.
 */
export function isInAppBrowser(): boolean {
  const u = ua();
  if (/Twitter|FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|musical_ly|Bytedance|LinkedInApp/i.test(u)) return true;
  if (/iPhone|iPad|iPod/.test(u)) return !/Safari\//.test(u);
  return /Android/.test(u) && /; wv\)/.test(u);
}

/**
 * A Solana wallet injected into this page (an extension or a wallet's own
 * browser). Wallet-standard wallets are discovered by the LaunchMyNFT embed;
 * these globals cover wallets that still expose their legacy providers.
 */
export function hasSolanaProvider(): boolean {
  const w = window as unknown as Record<string, { solana?: unknown } | undefined>;
  return Boolean(
    w.phantom?.solana ||
      w.solana ||
      w.solflare ||
      w.backpack ||
      w.nightly ||
      w.trustwallet ||
      w.trustWallet ||
      w.trust ||
      w.okxwallet?.solana ||
      w.coinbaseSolana,
  );
}

/**
 * Return standard-wallet objects exposed by wallet browsers/extensions. The
 * exact property differs between Nightly and Backpack releases.
 */
export function getInjectedStandardWallets(): object[] {
  const w = window as unknown as {
    nightly?: { solana?: { standardWallet?: object } };
    backpack?: { standardWallet?: object; solana?: { standardWallet?: object } };
  };
  return [w.nightly?.solana?.standardWallet, w.backpack?.standardWallet, w.backpack?.solana?.standardWallet].filter(
    (wallet): wallet is object => Boolean(wallet),
  );
}

/**
 * Keep wallet selection inside the LaunchMyNFT wallet chooser. It supports
 * injected wallets plus wallet-standard adapters (including Solflare and
 * other compatible wallets), so a mobile visitor must not be silently sent
 * to Phantom before they can choose a wallet.
 */
export function needsPhantomBrowser(): boolean {
  return false;
}

/** Where connect is blocked outright: an in-app browser with no wallet in it. */
export function isWalletBlocked(): boolean {
  return isInAppBrowser() && !hasSolanaProvider();
}

/** Phantom's universal link, retained for an explicit Phantom handoff. */
export function phantomBrowseLink(url: string): string {
  return `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(new URL(url).origin)}`;
}
