/**
 * Whitelist signup service.
 *
 * Stores Solana wallet submissions (plus an optional X/Twitter handle) in
 * Firestore, keyed by wallet address so re-submissions are idempotent.
 * Requires the VITE_FIREBASE_* env vars to be set and Firestore rules that
 * allow creating documents in the `whitelist` collection.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { PublicKey } from '@solana/web3.js';
import { db } from '../firebase.config';

export const WHITELIST_COLLECTION = 'whitelist';

export interface WhitelistResult {
  ok: boolean;
  alreadyListed?: boolean;
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
  if (!db) {
    return { ok: false, message: 'Signups are temporarily unavailable. Please try again later.' };
  }

  const xHandle = normalizeHandle(xHandleInput);
  const ref = doc(db, WHITELIST_COLLECTION, wallet);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      // Refresh the handle if they added/changed one, but report as already in.
      if (xHandle) await setDoc(ref, { xHandle }, { merge: true });
      return { ok: true, alreadyListed: true, message: 'You’re already on the whitelist — see you at mint! 🍬' };
    }

    await setDoc(ref, {
      wallet,
      xHandle: xHandle || null,
      createdAt: serverTimestamp(),
    });
    return { ok: true, message: 'You’re on the list! We’ll see you on July 4. 🇺🇸🍬' };
  } catch (err) {
    console.error('[whitelist] submit failed:', err);
    return { ok: false, message: 'Something went wrong saving your spot. Please try again.' };
  }
}
