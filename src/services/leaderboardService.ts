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
 * Firestore rules validate document shape, clamp value ranges, enforce a
 * minimum interval between writes, and cap how much any single write can move
 * a player's numbers; for a launch arcade this is the standard trade-off. See
 * firestore.rules — and review top standings manually before paying out any
 * NFT-launch rewards.
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

const MAX_VALUE = 1e12; // must match the caps in firestore.rules

// Firestore rules reject writes that land < 2s after the previous one, so we
// throttle client-side with a trailing flush: the latest standing always lands.
const MIN_SUBMIT_INTERVAL_MS = 3000;

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

/** Strip control characters and trim — display names go straight onto the board. */
function sanitizeName(name: string): string {
  // eslint-disable-next-line no-control-regex
  return (name || 'Anon').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24) || 'Anon';
}

/**
 * Upsert a player's standing. Keeps the best `score` ever seen and the latest
 * `balance` / `netProfit`. Fire-and-forget: never throws to the caller.
 * Throttled per game with a trailing flush so rapid play still ends with the
 * final standing on the board without tripping the Firestore rate-limit rules.
 */
const pendingSubmits = new Map<LeaderboardGame, ScoreSubmission>();
const flushTimers = new Map<LeaderboardGame, ReturnType<typeof setTimeout>>();
const lastSubmitAt = new Map<LeaderboardGame, number>();

export function submitScore(game: LeaderboardGame, sub: ScoreSubmission): void {
  if (!db || !sub.player) return;
  pendingSubmits.set(game, sub);
  if (flushTimers.has(game)) return; // a trailing flush is already scheduled

  const elapsed = Date.now() - (lastSubmitAt.get(game) ?? 0);
  const delay = Math.max(0, MIN_SUBMIT_INTERVAL_MS - elapsed);
  flushTimers.set(
    game,
    setTimeout(() => {
      flushTimers.delete(game);
      const latest = pendingSubmits.get(game);
      pendingSubmits.delete(game);
      if (latest) {
        lastSubmitAt.set(game, Date.now());
        writeScore(game, latest);
      }
    }, delay)
  );
}

async function writeScore(game: LeaderboardGame, sub: ScoreSubmission): Promise<void> {
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
        name: sanitizeName(sub.name),
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
