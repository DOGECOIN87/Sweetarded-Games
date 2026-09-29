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
  // Android WebView UAs normally contain `; wv)`, but older/custom embedded
  // browsers identify themselves as Version/4.0 instead. Treat both as an
  // in-app browser so the user is not left with a wallet chooser that cannot
  // launch an external wallet.
  return /Android/.test(u) && (/(; wv\))/.test(u) || /Version\/4\.0.*Chrome\//.test(u));
}

/** Wallet apps often inject their provider after the first render. */
export function isWalletBrowser(): boolean {
  return /Phantom|Backpack|Solflare|Nightly|OKX|Trust Wallet|Coinbase Wallet|Glow/i.test(ua());
}

/**
 * A Solana wallet injected into this page (an extension or a wallet's own
 * browser). Wallet-standard wallets are discovered by the LaunchMyNFT embed;
 * these globals cover wallets that still expose their legacy providers.
 */
export function hasSolanaProvider(): boolean {
  const w = window as unknown as Record<string, { solana?: unknown } | undefined>;
  const standardWallets = (navigator as Navigator & { wallets?: unknown }).wallets;
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
      w.coinbaseSolana ||
      (Array.isArray(standardWallets) && standardWallets.length > 0),
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
 * A normal mobile browser has no provider for the LaunchMyNFT adapter to use.
 * Send that case to Phantom's browser, preserving the patient's file in the
 * URL. Wallet browsers and injected extensions stay on the page. This is
 * deliberately based on the provider check, not merely the user agent, so a
 * Backpack/Nightly/Phantom browser is never redirected away unnecessarily.
 */
export function needsPhantomBrowser(): boolean {
  return isMobileDevice() && !hasSolanaProvider() && !isWalletBrowser();
}

/** Where connect is blocked outright: an in-app browser with no wallet in it. */
export function isWalletBlocked(): boolean {
  return isInAppBrowser() && !hasSolanaProvider() && !isWalletBrowser();
}

/** Phantom's universal link, retained for an explicit Phantom handoff. */
export function phantomBrowseLink(url: string): string {
  return `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(new URL(url).origin)}`;
}
