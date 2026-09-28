/**
 * Silent ?ref= tracking.
 *
 * First touch wins: the first ref a browser arrives with is kept and filed
 * with the patient's intake. The parameter is stripped from the address bar
 * on arrival so nothing in the fiction ever shows it. Old hash routes from
 * the previous site (#/mint, #/whitelist, …) are cleared the same way.
 */
import { safeLocalStorage } from '../utils/safeStorage';

const KEY = 'rx:ref';
const CLEAN = /^[A-Za-z0-9_.-]{1,64}$/;

export function captureRef(): void {
  const url = new URL(window.location.href);
  // Accept both sweetardio.fun/?ref=x and the legacy sweetardio.fun/#/?ref=x.
  const hashQuery = url.hash.includes('?') ? new URLSearchParams(url.hash.slice(url.hash.indexOf('?') + 1)) : null;
  const ref = (url.searchParams.get('ref') ?? hashQuery?.get('ref') ?? '').trim();

  if (ref && CLEAN.test(ref) && !safeLocalStorage.getItem(KEY)) {
    safeLocalStorage.setItem(KEY, JSON.stringify({ ref, at: new Date().toISOString() }));
  }

  if (url.searchParams.has('ref') || url.hash) {
    url.searchParams.delete('ref');
    url.hash = '';
    window.history.replaceState(null, '', url.pathname + url.search);
  }
}

export function getRef(): string | null {
  try {
    const raw = safeLocalStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as { ref: string }).ref : null;
  } catch {
    return null;
  }
}
