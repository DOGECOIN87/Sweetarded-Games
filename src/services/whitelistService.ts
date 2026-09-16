/**
 * Whitelist signup service.
 *
 * Stores wallet submissions (plus an optional X/Twitter handle) in
 * Firestore, keyed by wallet address so re-submissions are idempotent.
 *
 * Writes go through Firestore's plain REST `:commit` endpoint instead of the
 * Firebase SDK: the SDK funnels writes over a streaming WebChannel that
 * silently hangs on restrictive networks, proxies and ad blockers, leaving
 * the form stuck on "Joining…" forever. The REST call is one ordinary HTTPS
 * POST — it succeeds or fails fast, and we bound it with a timeout so the
 * user always gets an answer. The same Firestore security rules validate the
 * document either way (see firestore.rules → `whitelist`).
 */
import app from '../firebase.config';

export const WHITELIST_COLLECTION = 'whitelist';

const SUBMIT_TIMEOUT_MS = 12_000;
const FETCH_TIMEOUT_MS = 8_000;

/** Test signups left by development — never show these on the guest list. */
const HIDDEN_WALLETS = new Set([
  '4Xj5yrftgqnvdQ5Z17ekKq5SmV1Fw4LgXfFp2VkzeF7m',
  'BWXM3E5QGSWdsD5A5YhcG7eLEHJRwE2QmxkbnAkH796i',
]);

export interface WhitelistResult {
  ok: boolean;
  message: string;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Decode base58 and report the byte length, or -1 when `value` is not base58.
 * Leading '1's are the base58 encoding of leading zero bytes, so they are
 * counted separately from the big-integer body.
 */
function base58ByteLength(value: string): number {
  if (value.length === 0) return -1;

  let leadingZeros = 0;
  while (leadingZeros < value.length && value[leadingZeros] === '1') leadingZeros += 1;

  // Horner's method over the remaining digits; BigInt keeps 32-byte keys exact.
  let acc = 0n;
  for (let i = leadingZeros; i < value.length; i += 1) {
    const digit = BASE58_ALPHABET.indexOf(value[i]);
    if (digit === -1) return -1;
    acc = acc * 58n + BigInt(digit);
  }

  let bodyBytes = 0;
  for (let n = acc; n > 0n; n >>= 8n) bodyBytes += 1;

  return leadingZeros + bodyBytes;
}

/** True when `value` is a structurally valid 32-byte base58 wallet address. */
export function isValidWalletAddress(value: string): boolean {
  return base58ByteLength(value.trim()) === 32;
}

/** Normalise an X/Twitter handle: strip a leading @ and any profile URL. */
export function normalizeHandle(raw: string): string {
  let h = raw.trim();
  if (!h) return '';
  h = h.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '');
  h = h.replace(/^@+/, '').replace(/\/+$/, '');
  return h;
}

export interface WhitelistEntry {
  wallet: string;
  xHandle: string | null;
}

export interface WhitelistRoster {
  entries: WhitelistEntry[];
  /** True when the collection holds more signups than were fetched. */
  more: boolean;
}

/** Shorten a wallet for display: 7pYJ…CEnJd. */
export const shortWallet = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-5)}`;

/**
 * Fetch the public whitelist roster for The Board's guest list, newest first.
 *
 * Uses the same REST path as submissions. Returns null when the list can't
 * be read — most commonly because the Firestore rules still deny reads on
 * `whitelist` (see firestore.rules) — so callers can simply hide the section.
 */
export async function fetchWhitelistRoster(limit = 200): Promise<WhitelistRoster | null> {
  const { projectId, apiKey } = app.options;
  if (!projectId || !apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${WHITELIST_COLLECTION}` +
        `?pageSize=${limit}&orderBy=submittedAt%20desc&key=${apiKey}`,
      { signal: controller.signal },
    );
    if (!res.ok) {
      console.warn('[whitelist] roster unavailable:', res.status);
      return null;
    }
    const data = await res.json();
    const docs: any[] = data.documents ?? [];
    const entries = docs
      .map((d) => ({
        wallet: d.fields?.wallet?.stringValue as string | undefined,
        xHandle: (d.fields?.xHandle?.stringValue as string | undefined) ?? null,
      }))
      .filter((e): e is WhitelistEntry => typeof e.wallet === 'string' && !HIDDEN_WALLETS.has(e.wallet));
    return { entries, more: Boolean(data.nextPageToken) };
  } catch (err) {
    console.warn('[whitelist] roster fetch failed:', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function submitWhitelist(
  walletInput: string,
  xHandleInput = '',
): Promise<WhitelistResult> {
  const wallet = walletInput.trim();

  if (!isValidWalletAddress(wallet)) {
    return { ok: false, message: 'That doesn’t look like a valid wallet address.' };
  }

  const { projectId, apiKey } = app.options;
  if (!projectId || !apiKey) {
    return { ok: false, message: 'Signups are temporarily unavailable. Please try again later.' };
  }

  const xHandle = normalizeHandle(xHandleInput);
  const docPath = `projects/${projectId}/databases/(default)/documents/${WHITELIST_COLLECTION}/${wallet}`;

  // Keyed by wallet → re-submitting just overwrites (idempotent). Write-only:
  // the client never reads the collection, so the list stays private and the
  // Firestore rules can deny all client reads. `submittedAt` uses a server
  // timestamp transform, which the rules require (d.submittedAt == request.time).
  const body = {
    writes: [
      {
        update: {
          name: docPath,
          fields: {
            wallet: { stringValue: wallet },
            xHandle: xHandle ? { stringValue: xHandle } : { nullValue: null },
          },
        },
        updateTransforms: [{ fieldPath: 'submittedAt', setToServerValue: 'REQUEST_TIME' }],
      },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    if (res.ok) {
      return { ok: true, message: 'You’re on the list! We’ll see you on mint day. 🍬' };
    }
    const err = await res.json().catch(() => null);
    console.error('[whitelist] submit rejected:', res.status, err);
    return {
      ok: false,
      message:
        res.status === 403
          ? 'This signup was rejected — double-check the wallet address and try again.'
          : 'Something went wrong saving your spot. Please try again.',
    };
  } catch (err) {
    console.error('[whitelist] submit failed:', err);
    return {
      ok: false,
      message:
        'We couldn’t reach the signup service — check your connection (or pause ad blockers) and try again.',
    };
  } finally {
    clearTimeout(timer);
  }
}
