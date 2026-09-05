import { useEffect, useState } from 'react';
import { COMPETITION, TOTAL_PRIZE_MINTS, timeLeftLabel } from '../../lib/competition';
import type { CompetitionHandle } from '../../lib/useCompetition';
import './TicketMeter.css';

/**
 * In-game Arcade Cup readout.
 *
 * Shows what the player is actually playing for: tickets banked, how many are
 * still available today, and how long is left. Kept to one line so it can sit
 * beside the live standings without competing with the machine itself.
 */

interface TicketMeterProps {
  comp: CompetitionHandle;
  layout?: 'rail' | 'bar';
  /** Opens the full competition rules / prize ladder. */
  onOpenDetails?: () => void;
}

export default function TicketMeter({ comp, layout = 'rail', onOpenDetails }: TicketMeterProps) {
  const { state, loaded, room, live, earnedThisSession, saveFailed } = comp;
  const [flash, setFlash] = useState(false);
  const [left, setLeft] = useState(() => timeLeftLabel());

  // A ticket landing is the reward moment — say so.
  useEffect(() => {
    if (earnedThisSession === 0) return;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 2600);
    return () => window.clearTimeout(t);
  }, [earnedThisSession]);

  useEffect(() => {
    const id = window.setInterval(() => setLeft(timeLeftLabel()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (!live) return null;

  const usedToday = COMPETITION.dailyCap - room;

  return (
    <div className={`tm-panel${layout === 'bar' ? ' tm-bar' : ''}${flash ? ' tm-flash' : ''}`}>
      <div className="tm-head">
        <span className="tm-cup" aria-hidden>
          🎟
        </span>
        <span className="tm-title">Arcade Cup</span>
        {onOpenDetails && (
          <button type="button" className="tm-info" onClick={onOpenDetails}>
            {TOTAL_PRIZE_MINTS} free mints
          </button>
        )}
      </div>

      <div className="tm-body">
        <div className="tm-stat">
          <span className="tm-value">{loaded ? state.tickets : '—'}</span>
          <span className="tm-label">{state.tickets === 1 ? 'Ticket' : 'Tickets'}</span>
        </div>
        <div className="tm-stat">
          <span className="tm-value tm-muted">
            {loaded ? `${usedToday}/${COMPETITION.dailyCap}` : '—'}
          </span>
          <span className="tm-label">Today</span>
        </div>
        <div className="tm-stat">
          <span className="tm-value tm-muted">{left}</span>
          <span className="tm-label">Left</span>
        </div>
      </div>

      {saveFailed && (
        <div className="tm-warn" role="alert">
          Entries aren't saving — tell the team
        </div>
      )}
      {flash && !saveFailed && <div className="tm-earned" role="status">+1 TICKET</div>}
      {loaded && room === 0 && !flash && (
        <div className="tm-note">Daily tickets maxed — back tomorrow 🍬</div>
      )}
    </div>
  );
}
