import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getLeaderboard,
  findPlayerRank,
  type LeaderboardEntry,
  type LeaderboardGame,
  type SortField,
} from '../../services/leaderboardService';
import './LiveStandings.css';

/**
 * Always-on standings panel for the arcade games.
 *
 * The full board lives behind a button, which means the thing players are
 * competing for is invisible while they play. This sits beside the machine
 * instead: the top of the board, your rank, and a callout the moment your
 * own best moves — so there is always a number on screen worth beating.
 *
 * Reads are deliberately small and throttled (see REFRESH_MIN_MS): the caller
 * bumps `refreshKey` after each scoring round, and the panel refetches at most
 * once per window.
 */

/** How many rows the panel shows. Also the Firestore read cost per refresh. */
const TOP_N = 6;

/** Floor between refetches, however often `refreshKey` changes. */
const REFRESH_MIN_MS = 10_000;

interface LiveStandingsProps {
  game: LeaderboardGame;
  /** The current player's leaderboard row key. */
  playerId: string;
  /** Bump after a scoring round to refresh (throttled). */
  refreshKey?: number;
  /** Which field ranks the board. Defaults to best score. */
  sortBy?: SortField;
  /** What the score column means, e.g. "Best win" or "Coins". */
  scoreLabel?: string;
  /** Opens the full board, when the host game has one. */
  onOpenFull?: () => void;
  /**
   * `rail` stacks vertically for a side column; `bar` runs horizontally for a
   * full-width strip. The slots cabinet has no spare column height, so it uses
   * the bar; the coinpusher HUD has a free left edge and uses the rail.
   */
  layout?: 'rail' | 'bar';
  /**
   * Score the player just posted, if the host knows it.
   *
   * Without this the panel can only notice a personal best on its next
   * throttled refetch, which lands a round or two later — so the banner
   * congratulates you over the top of a losing spin. Passing the round's
   * score lets the celebration fire on the round that earned it.
   */
  latestScore?: number;
}

/** Podium markers. Beyond third the plain number reads better than an icon. */
const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

const formatScore = (n: number): string => {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${+(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

export default function LiveStandings({
  game,
  playerId,
  refreshKey = 0,
  sortBy = 'score',
  scoreLabel = 'Best',
  onOpenFull,
  layout = 'rail',
  latestScore,
}: LiveStandingsProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<LeaderboardEntry | null>(null);
  const [myRank, setMyRank] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const lastFetchAt = useRef(0);
  const pendingTimer = useRef<number | null>(null);
  const prevBest = useRef<number | null>(null);
  const prevRank = useRef<number | null>(null);
  const disposed = useRef(false);

  const load = useCallback(async () => {
    lastFetchAt.current = Date.now();
    try {
      // One extra row so a player sitting just outside the visible top still
      // resolves to a real rank rather than "unranked".
      const rows = await getLeaderboard(game, sortBy, TOP_N + 20);
      const visible = layout === 'bar' ? 3 : TOP_N;
      if (disposed.current) return;

      const mine = rows.find((r) => r.player === playerId) ?? null;
      const { rank } = findPlayerRank(rows, playerId);
      setEntries(rows.slice(0, visible));
      setMe(mine);
      setMyRank(rank);
      setStatus(rows.length === 0 ? 'empty' : 'ready');

      // Celebrate only real movement, and only after a baseline read — a first
      // load would otherwise fire a "new best" for a score set days ago.
      if (mine && prevBest.current !== null) {
        if (rank === 1 && prevRank.current !== null && prevRank.current > 1) {
          setCelebrate('TOP OF THE BOARD');
        } else if (mine.score > prevBest.current) {
          setCelebrate('NEW PERSONAL BEST');
        } else if (rank > 0 && prevRank.current !== null && rank < prevRank.current) {
          setCelebrate(`UP TO #${rank}`);
        }
      }
      if (mine) {
        prevBest.current = mine.score;
        prevRank.current = rank;
      } else {
        prevBest.current = prevBest.current ?? 0;
      }
    } catch {
      if (!disposed.current) setStatus((s) => (s === 'loading' ? 'error' : s));
    }
  }, [game, playerId, sortBy, layout]);

  // Initial load, then a throttled refetch whenever the host signals a round.
  useEffect(() => {
    disposed.current = false;
    const since = Date.now() - lastFetchAt.current;
    if (since >= REFRESH_MIN_MS) {
      load();
    } else if (pendingTimer.current === null) {
      pendingTimer.current = window.setTimeout(() => {
        pendingTimer.current = null;
        load();
      }, REFRESH_MIN_MS - since);
    }
    return () => {
      disposed.current = true;
    };
  }, [load, refreshKey]);

  // Tear down the trailing refetch with the component.
  useEffect(
    () => () => {
      if (pendingTimer.current !== null) window.clearTimeout(pendingTimer.current);
    },
    []
  );

  // Celebrate the round that earned it, not the one the refetch lands on.
  useEffect(() => {
    if (!latestScore || latestScore <= 0) return;
    if (prevBest.current !== null && latestScore <= prevBest.current) return;
    prevBest.current = latestScore;
    setMe((m) => (m ? { ...m, score: latestScore } : m));
    setCelebrate('NEW PERSONAL BEST');
  }, [latestScore]);

  useEffect(() => {
    if (!celebrate) return;
    const t = window.setTimeout(() => setCelebrate(null), 4000);
    return () => window.clearTimeout(t);
  }, [celebrate]);

  const inTop = entries.some((e) => e.player === playerId);

  return (
    <div className={`ls-panel${layout === 'bar' ? ' ls-bar' : ''}`}>
      <div className="ls-head">
        <span className="ls-dot" aria-hidden />
        <span className="ls-title">Live Standings</span>
        {onOpenFull && (
          <button type="button" className="ls-more" onClick={onOpenFull}>
            All
          </button>
        )}
      </div>

      {celebrate && (
        <div className="ls-celebrate" role="status">
          {celebrate}
        </div>
      )}

      {status === 'loading' && <div className="ls-note">Loading board…</div>}
      {status === 'error' && <div className="ls-note">Board unavailable</div>}
      {status === 'empty' && <div className="ls-note">No scores yet — set the first one 🍬</div>}

      {status === 'ready' && (
        <ol className="ls-rows">
          {entries.map((e, i) => {
            const isMe = e.player === playerId;
            return (
              <li
                key={e.player}
                className={`ls-row${isMe ? ' ls-row-me' : ''}${i < 3 ? ` ls-row-p${i + 1}` : ''}`}
              >
                <span className="ls-rank">{MEDALS[i] ?? i + 1}</span>
                <span className="ls-name">{isMe ? 'You' : e.name}</span>
                <span className="ls-score">{formatScore(e.score)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {status === 'ready' && !inTop && (
        <div className="ls-you">
          <span className="ls-rank">{me && myRank > 0 ? myRank : '—'}</span>
          <span className="ls-name">You</span>
          <span className="ls-score">{me ? formatScore(me.score) : '0'}</span>
        </div>
      )}

      <div className="ls-foot">{scoreLabel}</div>
    </div>
  );
}
