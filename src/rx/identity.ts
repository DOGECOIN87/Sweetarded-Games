/**
 * IDENTIFY YOURSELF — Firebase Authentication on the sweetardio project:
 * X, Google, or email and password. X uses the project's existing Twitter
 * provider (src/firebase.config.ts).
 *
 * The X handle is only handed over at sign-in (getAdditionalUserInfo), so it
 * is remembered per uid for later visits.
 */
import { useSyncExternalStore } from 'react';
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type AuthProvider,
  type User,
} from 'firebase/auth';
import { auth, twitterProvider } from '../firebase.config';
import { safeLocalStorage } from '../utils/safeStorage';

export interface Patient {
  uid: string;
  /** How they signed in: twitter.com, google.com or password. */
  provider: string;
  /** Numeric X account id, for X sign-ins. */
  xId: string | null;
  /** X handle, for X sign-ins. */
  handle: string | null;
  name: string | null;
  email: string | null;
  photo: string | null;
  token: () => Promise<string | null>;
}

export interface IdentityState {
  status: 'checking' | 'out' | 'in';
  patient: Patient | null;
  busy: boolean;
  /** Firebase error code of the last failed attempt; the pad turns it into a line. */
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
  const x = user.providerData.find((p) => p.providerId === 'twitter.com');
  const internal = (user as unknown as { reloadUserInfo?: { screenName?: string } }).reloadUserInfo;
  return {
    uid: user.uid,
    provider: user.providerData[0]?.providerId ?? 'password',
    xId: x?.uid ?? null,
    handle: x ? (freshHandle ?? safeLocalStorage.getItem(handleKey(user.uid)) ?? internal?.screenName ?? null) : null,
    name: user.displayName,
    email: user.email,
    photo: user.photoURL,
    token: () => user.getIdToken(),
  };
}

/** What goes on the pad: @handle for X, otherwise the name or the email. */
export function patientLabel(p: Patient): string {
  return p.handle ? `@${p.handle}` : (p.name ?? p.email ?? '');
}

/** Dev only: a stand-in patient so the flow can be walked without sign-in configured. */
function devPatient(): Patient | null {
  if (!import.meta.env.DEV) return null;
  const raw = safeLocalStorage.getItem('rx:dev-patient');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { handle?: unknown };
    if (typeof parsed.handle !== 'string' || !parsed.handle.trim()) return null;
    return {
      uid: 'dev',
      provider: 'dev',
      xId: null,
      handle: parsed.handle.trim(),
      name: null,
      email: null,
      photo: null,
      token: async () => null,
    };
  } catch {
    safeLocalStorage.removeItem('rx:dev-patient');
    return null;
  }
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
  onAuthStateChanged(
    auth,
    (user) => {
      set(user ? { status: 'in', patient: toPatient(user), errorCode: null } : { status: 'out', patient: null });
    },
    (err) => {
      const code = (err as { code?: string })?.code ?? 'auth/unknown';
      set({ status: 'out', patient: null, errorCode: code });
    },
  );
}

async function attempt(run: () => Promise<Patient | null>): Promise<boolean> {
  if (state.busy) return false;
  if (!auth) {
    set({ errorCode: 'auth/unavailable' });
    return false;
  }
  set({ busy: true, errorCode: null });
  try {
    const patient = await run();
    if (patient) set({ status: 'in', patient });
    return true;
  } catch (err) {
    const code = (err as { code?: string })?.code ?? 'auth/unknown';
    set({ errorCode: QUIET.has(code) ? null : code });
    return false;
  } finally {
    set({ busy: false });
  }
}

async function popup(provider: AuthProvider | null): Promise<Patient> {
  if (!auth || !provider) throw Object.assign(new Error('Firebase Authentication is unavailable'), { code: 'auth/unavailable' });
  const cred = await signInWithPopup(auth, provider);
  const username = provider.providerId === 'twitter.com' ? getAdditionalUserInfo(cred)?.username : null;
  return toPatient(cred.user, username ?? null);
}

const google = new GoogleAuthProvider();
google.setCustomParameters({ prompt: 'select_account' });

export const signInWithX = () => attempt(() => popup(twitterProvider));
export const signInWithGoogle = () => attempt(() => popup(google));

export const signInWithEmail = (email: string, password: string) =>
  attempt(async () => toPatient((await signInWithEmailAndPassword(auth, email.trim(), password)).user));

export const createEmailPatient = (email: string, password: string) =>
  attempt(async () => toPatient((await createUserWithEmailAndPassword(auth, email.trim(), password)).user));

/** Sends Firebase's reset email. True when it went out. */
export const resetEmailPassword = (email: string) =>
  attempt(async () => {
    await sendPasswordResetEmail(auth, email.trim());
    return null;
  });

export function clearIdentityError(): void {
  if (state.errorCode) set({ errorCode: null });
}

export async function signOut(): Promise<void> {
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
