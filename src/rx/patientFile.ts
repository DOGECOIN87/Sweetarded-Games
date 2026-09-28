/**
 * COUNTER 4444 HAS YOUR FILE — the team's copy of each intake.
 *
 * One document per signed-in patient at rx_files/{firebase uid}, written with
 * the patient's own ID token so firestore.rules can bind it to their X
 * account. Plain REST (like the old whitelist) rather than the Firestore SDK:
 * one HTTPS call that fails fast instead of a WebChannel that can hang.
 *
 * Every write is best-effort. The fiction never waits on it and never breaks
 * if the rules aren't deployed yet — the browser keeps its own progress.
 */
import app from '../firebase.config';
import type { Patient } from './identity';
import type { Path, Progress } from './progress';
import { getRef } from './ref';

const COLLECTION = 'rx_files';
const TIMEOUT_MS = 10_000;

type Value =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { mapValue: { fields: Record<string, Value> } };

const str = (v: string | null | undefined): Value => (v ? { stringValue: v } : { nullValue: null });

function docPath(uid: string) {
  return `projects/${app.options.projectId}/databases/(default)/documents/${COLLECTION}/${uid}`;
}

async function call(patient: Patient, url: string, init: RequestInit): Promise<Response | null> {
  const token = await patient.token().catch(() => null);
  if (!token || !app.options.projectId) return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${url}?key=${app.options.apiKey}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function commit(patient: Patient, fields: Record<string, Value>, mask?: string[], stamps: string[] = []) {
  const write: Record<string, unknown> = {
    update: { name: docPath(patient.uid), fields },
    updateTransforms: ['updatedAt', ...stamps].map((fieldPath) => ({ fieldPath, setToServerValue: 'REQUEST_TIME' })),
  };
  if (mask) write.updateMask = { fieldPaths: mask };
  const res = await call(
    patient,
    `https://firestore.googleapis.com/v1/projects/${app.options.projectId}/databases/(default)/documents:commit`,
    { method: 'POST', body: JSON.stringify({ writes: [write] }) },
  );
  return Boolean(res?.ok);
}

/** SEND TO FILL: the whole intake. */
export function fileIntake(patient: Patient, p: Progress): Promise<boolean> {
  return commit(
    patient,
    {
      uid: { stringValue: patient.uid },
      xId: str(patient.xId),
      xHandle: str(patient.handle),
      answers: {
        mapValue: {
          fields: {
            medication: str(p.answers.medication),
            filled: str(p.answers.filled),
            allergies: str(p.answers.allergies),
          },
        },
      },
      notes: { stringValue: p.notes.trim() },
      wallet: { stringValue: p.wallet.trim() },
      ref: str(getRef()),
      path: str(p.path),
      minted: { booleanValue: p.minted },
    },
    undefined,
    ['filedAt'],
  );
}

export function notePath(patient: Patient, path: Path): Promise<boolean> {
  return commit(patient, { path: { stringValue: path } }, ['path']);
}

export function noteMinted(patient: Patient): Promise<boolean> {
  return commit(patient, { minted: { booleanValue: true } }, ['minted']);
}

export interface FiledIntake {
  path: Path | null;
  minted: boolean;
  answers: Progress['answers'];
  notes: string;
  wallet: string;
}

type Fields = Record<string, { stringValue?: string; booleanValue?: boolean; mapValue?: { fields?: Fields } }>;

/** What the file says, for a patient returning on another browser. */
export async function readFile(patient: Patient): Promise<FiledIntake | null> {
  const res = await call(patient, `https://firestore.googleapis.com/v1/${docPath(patient.uid)}`, { method: 'GET' });
  if (!res?.ok) return null;
  const doc = (await res.json().catch(() => null)) as { fields?: Fields } | null;
  const f = doc?.fields;
  if (!f) return null;
  const a = f.answers?.mapValue?.fields ?? {};
  const path = f.path?.stringValue;
  return {
    path: path === 'took' || path === 'spit' ? path : null,
    minted: f.minted?.booleanValue === true,
    answers: {
      medication: a.medication?.stringValue,
      filled: a.filled?.stringValue,
      allergies: a.allergies?.stringValue,
    },
    notes: f.notes?.stringValue ?? '',
    wallet: f.wallet?.stringValue ?? '',
  };
}
