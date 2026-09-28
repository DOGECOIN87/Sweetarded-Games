/**
 * What the patient is holding. Phones have no wallet extension: the way to
 * pay from one is Phantom's own browser, reached by its universal link.
 */

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

/** A Solana wallet injected into this page (an extension, or a wallet's own browser). */
export function hasSolanaProvider(): boolean {
  const w = window as unknown as Record<string, { solana?: unknown } | undefined>;
  return Boolean(w.phantom?.solana || w.solana || w.solflare || w.backpack || w.okxwallet?.solana || w.coinbaseSolana);
}

/** On a phone with nothing to pay with here: pay happens in Phantom's browser. */
export function needsPhantomBrowser(): boolean {
  return isMobileDevice() && !hasSolanaProvider();
}

/** Where connect is blocked outright: an in-app browser with no wallet in it. */
export function isWalletBlocked(): boolean {
  return isInAppBrowser() && !hasSolanaProvider();
}

/** Phantom's universal link: opens `url` inside Phantom's browser (or its install page). */
export function phantomBrowseLink(url: string): string {
  return `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(new URL(url).origin)}`;
}
