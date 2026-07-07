/**
 * Whitelist signup service.
 *
 * Stores Solana wallet submissions (plus an optional X/Twitter handle) in
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
import { PublicKey } from '@solana/web3.js';
import app from '../firebase.config';

export const WHITELIST_COLLECTION = 'whitelist';

const SUBMIT_TIMEOUT_MS = 12_000;

export interface WhitelistResult {
  ok: boolean;
  message: string;
}

/** True when `value` is a structurally valid Solana public key. */
export function isValidSolanaAddress(value: string): boolean {
  try {
    // PublicKey throws for bad base58 / wrong length; toBytes guards edge cases.
    return new PublicKey(value.trim()).toBytes().length === 32;
  } catch {
    return false;
  }
}

/** Normalise an X/Twitter handle: strip a leading @ and any profile URL. */
export function normalizeHandle(raw: string): string {
  let h = raw.trim();
  if (!h) return '';
  h = h.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '');
  h = h.replace(/^@+/, '').replace(/\/+$/, '');
  return h;
}

export async function submitWhitelist(
  walletInput: string,
  xHandleInput = '',
): Promise<WhitelistResult> {
  const wallet = walletInput.trim();

  if (!isValidSolanaAddress(wallet)) {
    return { ok: false, message: 'That doesn’t look like a valid Solana wallet address.' };
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
