/**
 * Leaderboard service (Firestore-backed).
 *
 * Replaces the old on-chain leaderboard, which read game-state PDAs via
 * `getProgramAccounts` against the Gorbagana RPC — a call public RPCs throttle
 * or disable, against a program that was never deployed, so it always failed.
 *
 * Each game keeps one document per player (keyed by wallet address, or by a
 * persistent anonymous id for free-play), holding their best score and latest
 * balance / net profit. Reads are simple indexed `orderBy(...).limit(...)`
 * queries, so the board works on a static site with no RPC at all.
 *
 *   leaderboard_slots/{player}
 *   leaderboard_coinpusher/{player}
 *
 * NOTE: scores are written from the client, so the board is not tamper-proof.
 * Firestore rules validate document shape and clamp value ranges; for a launch
 * arcade this is the standard trade-off. See firestore.rules.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit as fbLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.config';

export type LeaderboardGame = 'slots' | 'coinpusher';
export type SortField = 'score' | 'netProfit' | 'balance';

export interface LeaderboardEntry {
  rank: number;
  player: string; // wallet address or anon id (the document key)
  name: string; // friendly display name
  score: number;
  balance: number;
  netProfit: number;
  lastUpdated: number; // seconds since epoch (0 when unknown)
}

export interface ScoreSubmission {
  player: string;
  name: string;
  score: number;
  balance: number;
  netProfit: number;
}

const MAX_VALUE = 1e15;

function collectionName(game: LeaderboardGame): string {
  return `leaderboard_${game}`;
}

/** Clamp to a sane non-negative integer (guards NaN/Infinity/garbage). */
function clampUint(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_VALUE, Math.floor(value)));
}

/** Clamp to a sane signed integer. */
function clampInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-MAX_VALUE, Math.min(MAX_VALUE, Math.floor(value)));
}

function tsToSeconds(value: unknown): number {
  if (value instanceof Timestamp) return Math.floor(value.toMillis() / 1000);
  return 0;
}

function toEntry(data: Record<string, unknown>, rank: number): LeaderboardEntry {
  return {
    rank,
    player: typeof data.player === 'string' ? data.player : '',
    name: typeof data.name === 'string' && data.name ? data.name : 'Anon',
    score: typeof data.score === 'number' ? data.score : 0,
    balance: typeof data.balance === 'number' ? data.balance : 0,
    netProfit: typeof data.netProfit === 'number' ? data.netProfit : 0,
    lastUpdated: tsToSeconds(data.updatedAt),
  };
}

/**
 * Upsert a player's standing. Keeps the best `score` ever seen and the latest
 * `balance` / `netProfit`. Fire-and-forget: never throws to the caller.
 */
export async function submitScore(game: LeaderboardGame, sub: ScoreSubmission): Promise<void> {
  if (!db || !sub.player) return;
  try {
    const ref = doc(db, collectionName(game), sub.player);

    let bestScore = 0;
    try {
      const existing = await getDoc(ref);
      if (existing.exists()) {
        const prev = existing.data().score;
        if (typeof prev === 'number') bestScore = prev;
      }
    } catch {
      /* first write or read denied — fall back to the submitted score */
    }

    await setDoc(
      ref,
      {
        player: sub.player,
        name: (sub.name || 'Anon').slice(0, 24),
        score: Math.max(bestScore, clampUint(sub.score)),
        balance: clampUint(sub.balance),
        netProfit: clampInt(sub.netProfit),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[leaderboard] submit failed:', err);
  }
}

/** Fetch the top entries for a game, ranked by the given field (desc). */
export async function getLeaderboard(
  game: LeaderboardGame,
  sortBy: SortField,
  max = 100
): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  const q = query(
    collection(db, collectionName(game)),
    orderBy(sortBy, 'desc'),
    fbLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => toEntry(d.data(), i + 1));
}

/**
 * Player rank within an already-fetched leaderboard list. Returns rank 0 when
 * the player isn't present in the fetched window (e.g. outside the top N).
 */
export function findPlayerRank(
  entries: LeaderboardEntry[],
  playerId: string
): { rank: number; total: number } {
  const idx = entries.findIndex((e) => e.player === playerId);
  return { rank: idx === -1 ? 0 : idx + 1, total: entries.length };
}
