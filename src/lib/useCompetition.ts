import { useCallback, useEffect, useRef, useState } from 'react';
import {
  awardTickets,
  emptyTicketState,
  headroom,
  isLive,
  type TicketState,
} from './competition';
import { loadTickets, saveTickets } from '../services/competitionService';
import type { LeaderboardGame } from '../services/leaderboardService';

/**
 * Arcade Cup entry state for the current player.
 *
 * Games call `addPlay` as they go — one spin, or a batch of coins — and this
 * converts it to tickets under the caps in ../lib/competition, then persists
 * on a trailing throttle so a fast session is one write, not hundreds.
 */

/** Trailing write window. Long enough to batch a burst, short enough to survive a tab close. */
const SAVE_THROTTLE_MS = 6000;

export interface CompetitionHandle {
  state: TicketState;
  /** False until the stored entry has been read, so the UI can avoid flashing 0. */
  loaded: boolean;
  /** Tickets still bankable today. */
  room: number;
  live: boolean;
  /** Bank play. `units` is spins for slots, coins for the coinpusher. */
  addPlay: (game: LeaderboardGame, units: number) => void;
  /** Tickets banked since this hook mounted — drives the "+1 ticket" callout. */
  earnedThisSession: number;
  /**
   * True when the last write was rejected — entries are NOT being saved.
   * Surfaced in the UI because a competition that silently loses entries is
   * worse than one that is visibly down.
   */
  saveFailed: boolean;
}

export function useCompetition(
  playerId: string,
  name: string,
  wallet: string | null
): CompetitionHandle {
  const [state, setState] = useState<TicketState>(emptyTicketState);
  const [loaded, setLoaded] = useState(false);
  const [earnedThisSession, setEarnedThisSession] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);

  // Refs so the save timer and addPlay never go stale between renders.
  const stateRef = useRef(state);
  stateRef.current = state;
  const identityRef = useRef({ playerId, name, wallet });
  identityRef.current = { playerId, name, wallet };
  const saveTimer = useRef<number | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    loadTickets(playerId).then((stored) => {
      if (cancelled) return;
      setState(stored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const flush = useCallback(() => {
    if (!dirty.current) return;
    dirty.current = false;
    const { playerId: p, name: n, wallet: w } = identityRef.current;
    saveTickets(p, n, stateRef.current, w).then((ok) => setSaveFailed(!ok));
  }, []);

  const scheduleSave = useCallback(() => {
    dirty.current = true;
    if (saveTimer.current !== null) return;
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      flush();
    }, SAVE_THROTTLE_MS);
  }, [flush]);

  const addPlay = useCallback(
    (game: LeaderboardGame, units: number) => {
      if (!isLive()) return;
      setState((prev) => {
        const result = awardTickets(prev, game, units);
        if (result.awarded > 0) setEarnedThisSession((n) => n + result.awarded);
        // Progress moves on nearly every call, so the write is always worth
        // scheduling — otherwise a session that never completes a ticket
        // would lose all its accumulated play.
        if (result.state !== prev) scheduleSave();
        return result.state;
      });
    },
    [scheduleSave]
  );

  // Don't lose banked play to a tab close or a route change.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      flush();
    };
  }, [flush]);

  // A wallet bound mid-session has to reach the entry, or the player is
  // ineligible for the draw despite having tickets.
  useEffect(() => {
    if (!loaded || !wallet || stateRef.current.tickets === 0) return;
    scheduleSave();
  }, [wallet, loaded, scheduleSave]);

  return {
    state,
    loaded,
    room: headroom(state),
    live: isLive(),
    addPlay,
    earnedThisSession,
    saveFailed,
  };
}
