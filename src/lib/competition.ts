/**
 * The Sweetardio Arcade Cup — free-mint competition.
 *
 * WHY TICKETS AND NOT A SCORE LADDER
 * ----------------------------------
 * The games run entirely in the browser, so every score is client-written. A
 * "top 10 by score wins mints" ladder makes a bigger number worth real money
 * while leaving that number unverifiable — which is exactly the shape that has
 * to be policed by a server.
 *
 * Tickets break that link. Playing earns entries, entries are capped per day
 * AND in total, and the winners are drawn. Because MAX_TOTAL_TICKETS is a
 * ceiling an ordinary player reaches by just showing up, inflating anything
 * buys nothing: the best possible cheat is identical to the best possible
 * honest run. Firestore rules enforce the same ceiling server-side, so it
 * holds even against a script.
 *
 * The residual risk is sybils — one person farming several wallets — not score
 * tampering. That is visible in the data and is why the draw is reviewed
 * before mints are allocated. See scripts/draw-competition.mjs.
 */
import type { LeaderboardGame } from '../services/leaderboardService';

/** Prize ladder: the first name drawn wins LADDER[0] mints, and so on. */
export const PRIZE_LADDER = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

/** Total mints committed to the competition. */
export const TOTAL_PRIZE_MINTS = PRIZE_LADDER.reduce((a, b) => a + b, 0); // 55

export const COMPETITION = {
  name: 'Arcade Cup',
  /** Entries open. */
  startsAt: Date.parse('2026-09-05T00:00:00Z'),
  /** Entries close — 48h before the mint, leaving time to draw and allocate. */
  endsAt: Date.parse('2026-09-12T12:00:00Z'),
  /** Most tickets any player can bank in one UTC day. */
  dailyCap: 10,
  /**
   * Hard ceiling for the whole competition, mirrored in firestore.rules.
   *
   * Nine UTC days are touched by the window (Sep 5–12 inclusive), so this is
   * what a player who maxes out every single day would hold. Setting the cap
   * exactly there is the anti-cheat: there is no number above it to forge.
   */
  maxTotalTickets: 80,
  /** Play that earns one ticket, per game. */
  earnRates: {
    slots: { unit: 'spins', per: 25 },
    coinpusher: { unit: 'coins', per: 15 },
  },
} as const;

export interface TicketState {
  tickets: number;
  /** Tickets banked per UTC day, keyed `YYYY-MM-DD`. */
  daily: Record<string, number>;
  /** Play counted toward the next ticket but not yet worth one. */
  progress: Partial<Record<LeaderboardGame, number>>;
}

export const emptyTicketState = (): TicketState => ({
  tickets: 0,
  daily: {},
  progress: {},
});

/** UTC day key. Deliberately UTC so the cap resets at the same instant worldwide. */
export function dayKey(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function isLive(now: number = Date.now()): boolean {
  return now >= COMPETITION.startsAt && now < COMPETITION.endsAt;
}

export function hasEnded(now: number = Date.now()): boolean {
  return now >= COMPETITION.endsAt;
}

/** Tickets this player may still bank today, given the daily and total caps. */
export function headroom(state: TicketState, now: number = Date.now()): number {
  const usedToday = state.daily[dayKey(now)] ?? 0;
  return Math.max(
    0,
    Math.min(COMPETITION.dailyCap - usedToday, COMPETITION.maxTotalTickets - state.tickets)
  );
}

export interface AwardResult {
  state: TicketState;
  /** Tickets actually banked by this call (0 when capped out or closed). */
  awarded: number;
  /** True when play was earned but the cap swallowed it. */
  cappedOut: boolean;
}

/**
 * Bank play toward tickets.
 *
 * `units` is spins for slots and coins for the coinpusher. Leftover play is
 * carried in `progress` so a session that ends mid-ticket is not thrown away.
 * Returns a NEW state; never mutates the input.
 */
export function awardTickets(
  state: TicketState,
  game: LeaderboardGame,
  units: number,
  now: number = Date.now()
): AwardResult {
  const safeUnits = Number.isFinite(units) ? Math.max(0, Math.floor(units)) : 0;
  if (safeUnits === 0 || !isLive(now)) {
    return { state, awarded: 0, cappedOut: false };
  }

  const per = COMPETITION.earnRates[game].per;
  const carried = state.progress[game] ?? 0;
  const pool = carried + safeUnits;
  const earned = Math.floor(pool / per);
  const leftover = pool % per;

  const room = headroom(state, now);
  const awarded = Math.min(earned, room);
  const key = dayKey(now);

  return {
    state: {
      // Once capped out, stop hoarding leftover play — it can never convert
      // today, and carrying it would hand a head start to tomorrow's cap.
      tickets: state.tickets + awarded,
      daily: { ...state.daily, [key]: (state.daily[key] ?? 0) + awarded },
      progress: { ...state.progress, [game]: room === 0 ? 0 : leftover },
    },
    awarded,
    cappedOut: earned > awarded,
  };
}

/** Play still needed for the next ticket in this game. */
export function unitsToNextTicket(state: TicketState, game: LeaderboardGame): number {
  const per = COMPETITION.earnRates[game].per;
  return per - ((state.progress[game] ?? 0) % per);
}

/** Human-readable time left, e.g. "3d 04h" or "58m". */
export function timeLeftLabel(now: number = Date.now()): string {
  const ms = COMPETITION.endsAt - now;
  if (ms <= 0) return 'Closed';
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms / 3_600_000) % 24);
  const m = Math.floor((ms / 60_000) % 60);
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m`;
}
