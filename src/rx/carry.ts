/**
 * The patient's file, carried across browsers in a link.
 *
 * Phantom's browser does not share Safari's storage, so PAY AT WINDOW on a
 * phone opens sweetardio.fun there with the file in the address (#file=…).
 * On arrival the file is merged into this browser's progress and the address
 * is cleaned (captureRef clears the hash). The window still has to be walked
 * into and rung; it remembers them from there.
 *
 * Merge rules match the pharmacy's: a spat file stays spat and nothing typed
 * here is overwritten. `minted` never travels (a link must not be able to
 * close someone else's file).
 */
import { QUESTIONS, type QuestionId } from './copy';
import { getProgress, isSolanaAddress, updateProgress, type Path, type Progress } from './progress';

const PARAM = 'file';

interface Packed {
  a: Partial<Record<QuestionId, string>>;
  n: string;
  w: string;
  f: boolean;
  p: Path | null;
}

const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (s: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
  );

/** This browser's file as a link to the same site. */
export function fileLink(origin = window.location.origin): string {
  const p = getProgress();
  const packed: Packed = { a: p.answers, n: p.notes, w: p.wallet, f: p.filed, p: p.path };
  return `${origin}/#${PARAM}=${toBase64Url(JSON.stringify(packed))}`;
}

function unpack(token: string): Partial<Progress> | null {
  try {
    const raw = JSON.parse(fromBase64Url(token)) as Partial<Packed>;
    const answers: Progress['answers'] = {};
    for (const q of QUESTIONS) {
      const v = raw.a?.[q.id];
      if (typeof v === 'string' && (q.options as readonly string[]).includes(v)) answers[q.id] = v;
    }
    return {
      answers,
      notes: typeof raw.n === 'string' ? raw.n.slice(0, 250) : '',
      wallet: typeof raw.w === 'string' && isSolanaAddress(raw.w) ? raw.w : '',
      filed: raw.f === true,
      path: raw.p === 'took' || raw.p === 'spit' ? raw.p : null,
    };
  } catch {
    return null;
  }
}

/** Before anything renders: take in a file carried in the address, if any. */
export function receiveCarriedFile(): void {
  const match = window.location.hash.match(new RegExp(`[#&]${PARAM}=([A-Za-z0-9_-]+)`));
  const file = match ? unpack(match[1]) : null;
  if (!file) return;
  const here = getProgress();
  const blank = !here.notes && !here.wallet && !Object.keys(here.answers).length;
  updateProgress({
    ...(blank ? { answers: file.answers, notes: file.notes, wallet: file.wallet } : null),
    filed: here.filed || Boolean(file.filed),
    path: here.path === 'spit' || file.path === 'spit' ? 'spit' : (here.path ?? file.path ?? null),
  });
}
