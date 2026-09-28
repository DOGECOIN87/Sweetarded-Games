/**
 * IDENTIFY YOURSELF — Sign in with X, via the project's existing Firebase
 * Twitter provider (src/firebase.config.ts).
 *
 * The X handle is only handed over at sign-in (getAdditionalUserInfo), so it
 * is remembered per uid for later visits.
 */
import { useSyncExternalStore } from 'react';
import {
  getAdditionalUserInfo,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, twitterProvider } from '../firebase.config';
import { safeLocalStorage } from '../utils/safeStorage';

export interface Patient {
  uid: string;
  /** Numeric X account id — what the patient file is bound to. */
  xId: string | null;
  handle: string | null;
  /** X display name, shown only if the handle was never handed over. */
  name: string | null;
  photo: string | null;
  token: () => Promise<string | null>;
}

export interface IdentityState {
  status: 'checking' | 'out' | 'in';
  patient: Patient | null;
  busy: boolean;
  /** Firebase error code of the last failed sign-in, for debugging (console is stripped in prod). */
  errorCode: string | null;
}

const handleKey = (uid: string) => `rx:x-handle:${uid}`;
const QUIET = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

let state: IdentityState = { status: 'checking', patient: null, busy: false, errorCode: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<IdentityState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

function toPatient(user: User, freshHandle?: string | null): Patient {
  if (freshHandle) safeLocalStorage.setItem(handleKey(user.uid), freshHandle);
  const internal = (user as unknown as { reloadUserInfo?: { screenName?: string } }).reloadUserInfo;
  return {
    uid: user.uid,
    xId: user.providerData.find((p) => p.providerId === 'twitter.com')?.uid ?? null,
    handle: freshHandle ?? safeLocalStorage.getItem(handleKey(user.uid)) ?? internal?.screenName ?? null,
    name: user.displayName,
    photo: user.photoURL,
    token: () => user.getIdToken(),
  };
}

/** Dev only: a stand-in patient so the flow can be walked without X configured. */
function devPatient(): Patient | null {
  if (!import.meta.env.DEV) return null;
  const raw = safeLocalStorage.getItem('rx:dev-patient');
  if (!raw) return null;
  const { handle } = JSON.parse(raw) as { handle: string };
  return { uid: 'dev', xId: null, handle, name: null, photo: null, token: async () => null };
}

let started = false;
function start() {
  if (started) return;
  started = true;
  const dev = devPatient();
  if (dev) {
    set({ status: 'in', patient: dev });
    return;
  }
  if (!auth) {
    set({ status: 'out' });
    return;
  }
  onAuthStateChanged(auth, (user) => {
    set(user ? { status: 'in', patient: toPatient(user) } : { status: 'out', patient: null });
  });
}

export async function signInWithX(): Promise<void> {
  if (state.busy) return;
  if (!auth || !twitterProvider) {
    set({ errorCode: 'auth/unavailable' });
    return;
  }
  set({ busy: true, errorCode: null });
  try {
    const cred = await signInWithPopup(auth, twitterProvider);
    set({ status: 'in', patient: toPatient(cred.user, getAdditionalUserInfo(cred)?.username ?? null) });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? 'auth/unknown';
    set({ errorCode: QUIET.has(code) ? null : code });
  } finally {
    set({ busy: false });
  }
}

export async function signOutOfX(): Promise<void> {
  if (import.meta.env.DEV && state.patient?.uid === 'dev') {
    safeLocalStorage.removeItem('rx:dev-patient');
    set({ status: 'out', patient: null });
    return;
  }
  if (auth) await firebaseSignOut(auth);
}

export function getIdentity(): IdentityState {
  start();
  return state;
}

export function useIdentity(): IdentityState {
  return useSyncExternalStore(
    (l) => {
      start();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getIdentity,
    getIdentity,
  );
}
