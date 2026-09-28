/**
 * What the pharmacy remembers about this browser's patient.
 *
 * Local first: everything here survives a reload even when Firestore or X
 * sign-in are unavailable. The patient file in Firestore (patientFile.ts) is
 * the team's copy, written alongside.
 */
import { useSyncExternalStore } from 'react';
import { safeLocalStorage } from '../utils/safeStorage';
import type { QuestionId } from './copy';

export type Path = 'took' | 'spit';

export interface Progress {
  answers: Partial<Record<QuestionId, string>>;
  notes: string;
  wallet: string;
  sideEffects: { follow: boolean; like: boolean; later: boolean };
  /** SEND TO FILL went through at least once. */
  filed: boolean;
  /** Last choice at the catch. Took the meds can come back and spit; spat cannot un-spit. */
  path: Path | null;
  /** A mint cleared from this file. */
  minted: boolean;
}

const KEY = 'rx:progress:v1';

const EMPTY: Progress = {
  answers: {},
  notes: '',
  wallet: '',
  sideEffects: { follow: false, like: false, later: false },
  filed: false,
  path: null,
  minted: false,
};

function read(): Progress {
  try {
    const raw = safeLocalStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      ...EMPTY,
      ...parsed,
      answers: { ...parsed.answers },
      sideEffects: { ...EMPTY.sideEffects, ...parsed.sideEffects },
    };
  } catch {
    return EMPTY;
  }
}

let current = read();
const listeners = new Set<() => void>();

export function getProgress(): Progress {
  return current;
}

export function updateProgress(patch: Partial<Progress> | ((p: Progress) => Partial<Progress>)): void {
  const next = typeof patch === 'function' ? patch(current) : patch;
  current = { ...current, ...next };
  try {
    safeLocalStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage full or blocked — progress still lives for this visit */
  }
  listeners.forEach((l) => l());
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getProgress,
    getProgress,
  );
}

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Structural check only: the string decodes to 32 bytes of base58. Nothing is verified onchain. */
export function isSolanaAddress(value: string): boolean {
  const s = value.trim();
  if (s.length < 32 || s.length > 44) return false;
  const bytes: number[] = []; // little-endian big number
  for (const ch of s) {
    let carry = BASE58.indexOf(ch);
    if (carry < 0) return false;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let zeros = 0; // each leading '1' is a leading zero byte
  while (zeros < s.length && s[zeros] === '1') zeros++;
  return zeros + bytes.length === 32;
}

export function isIntakeComplete(p: Progress): boolean {
  return Boolean(
    p.answers.medication && p.answers.filled && p.answers.allergies && p.notes.trim() && isSolanaAddress(p.wallet),
  );
}
