/**
 * Competition entries (Firestore-backed).
 *
 *   competition_tickets/{player}
 *
 * One document per player, holding their banked tickets, the per-UTC-day
 * counts the cap is enforced against, and the wallet the mints would go to.
 *
 * Writes are client-side like the leaderboards, but the exposure is different
 * in kind: firestore.rules caps `tickets` at COMPETITION.maxTotalTickets and
 * bounds how much any single write may add, so the ceiling a cheat can reach
 * is the same ceiling ordinary play reaches. See src/lib/competition.ts for
 * why that is the whole design.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import {
  COMPETITION,
  emptyTicketState,
  type TicketState,
} from '../lib/competition';

const COLLECTION = 'competition_tickets';

export interface TicketEntry extends TicketState {
  player: string;
  name: string;
  /** Payout address. Null until the player binds one — required to be drawn. */
  wallet: string | null;
  updatedAt: number;
}

/** Clamp a stored number into the range the rules will accept. */
const clampTickets = (n: unknown): number =>
  typeof n === 'number' && Number.isFinite(n)
    ? Math.max(0, Math.min(COMPETITION.maxTotalTickets, Math.floor(n)))
    : 0;

function toState(data: Record<string, unknown> | undefined): TicketState {
  if (!data) return emptyTicketState();
  const daily = (data.daily ?? {}) as Record<string, unknown>;
  const progress = (data.progress ?? {}) as Record<string, unknown>;
  const num = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  return {
    tickets: clampTickets(data.tickets),
    daily: Object.fromEntries(Object.entries(daily).map(([k, v]) => [k, num(v)])),
    progress: {
      slots: num(progress.slots),
      coinpusher: num(progress.coinpusher),
    },
  };
}

/** Read a player's entry. Returns an empty state when there is none yet. */
export async function loadTickets(player: string): Promise<TicketState> {
  if (!db || !player) return emptyTicketState();
  try {
    const snap = await getDoc(doc(db, COLLECTION, player));
    return snap.exists() ? toState(snap.data()) : emptyTicketState();
  } catch {
    return emptyTicketState();
  }
}

/**
 * Persist a player's entry. Never throws; returns false when the write was
 * rejected so the UI can tell the player their entries are not being saved —
 * silently dropping them would cost someone a prize.
 *
 * `daily` is pruned to the competition window so the document cannot grow
 * without bound (and so a rejected oversized write can't lock a player out).
 */
export async function saveTickets(
  player: string,
  name: string,
  state: TicketState,
  wallet: string | null
): Promise<boolean> {
  if (!db || !player) return false;
  try {
    const daily = Object.fromEntries(
      Object.entries(state.daily)
        .filter(([, v]) => v > 0)
        .slice(-14)
    );
    await setDoc(
      doc(db, COLLECTION, player),
      {
        player,
        name: (name || 'Anon').slice(0, 24),
        wallet: wallet || null,
        tickets: clampTickets(state.tickets),
        daily,
        progress: {
          slots: Math.max(0, Math.floor(state.progress.slots ?? 0)),
          coinpusher: Math.max(0, Math.floor(state.progress.coinpusher ?? 0)),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('[competition] ticket save failed:', err);
    return false;
  }
}

/** Everyone holding at least one ticket. Used by the draw and the entry count. */
export async function getAllEntries(): Promise<TicketEntry[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => {
      const data = d.data();
      const updated = data.updatedAt;
      return {
        player: d.id,
        name: typeof data.name === 'string' ? data.name : 'Anon',
        wallet: typeof data.wallet === 'string' ? data.wallet : null,
        updatedAt:
          updated && typeof updated.toMillis === 'function' ? updated.toMillis() : 0,
        ...toState(data),
      };
    })
    .filter((e) => e.tickets > 0);
}

/** Total tickets in the pool — what a player's odds are measured against. */
export async function getPoolSize(): Promise<{ entrants: number; tickets: number }> {
  const all = await getAllEntries();
  return {
    entrants: all.length,
    tickets: all.reduce((sum, e) => sum + e.tickets, 0),
  };
}
