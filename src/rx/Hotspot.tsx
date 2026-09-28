/**
 * A place on a painting you can point at.
 *
 * Live hotspots do something; dead ones only answer back with their line.
 * The label is a paper tag that appears on hover / keyboard focus (or as a
 * hint when the room wants to nudge), optionally carrying the prop the
 * hotspot stands for.
 */
import { useState, type ReactNode } from 'react';
import { At } from './Stage';
import type { Rect } from './scenes';

export type Placement = 'top' | 'bottom' | 'left' | 'right';

interface HotspotProps {
  r: Rect;
  /** The words on the tag (and the accessible name). Lines are stacked. */
  label: string | readonly string[];
  prop?: string;
  placement?: Placement;
  /** No action: the tag is the whole point. */
  dead?: boolean;
  /** Nudge: glow and show the tag without hover. */
  hint?: boolean;
  /** Present but not yet accepting (e.g. SEND TO FILL on an incomplete pad). */
  refusing?: boolean;
  onActivate?: () => void;
  className?: string;
  children?: ReactNode;
}

export function Hotspot({
  r,
  label,
  prop,
  placement = 'top',
  dead = false,
  hint = false,
  refusing = false,
  onActivate,
  className = '',
  children,
}: HotspotProps) {
  const lines = typeof label === 'string' ? [label] : label;
  const [nudge, setNudge] = useState(0);

  const activate = () => {
    if (dead || refusing) {
      setNudge((n) => n + 1);
      if (refusing) onActivate?.();
      return;
    }
    onActivate?.();
  };

  return (
    <At
      r={r}
      className={`rx-hotspot ${dead ? 'is-dead' : ''} ${hint ? 'is-hint' : ''} ${refusing ? 'is-refusing' : ''} ${className}`}
    >
      <button
        type="button"
        className="rx-hotspot__hit"
        aria-label={lines.join(' ')}
        aria-disabled={refusing || undefined}
        onClick={activate}
      >
        {children}
      </button>
      <span
        key={nudge}
        className={`rx-tag rx-tag--${placement} ${nudge ? 'is-nudged' : ''}`}
        style={r.rotate ? { ['--unrotate' as string]: `${-r.rotate}deg` } : undefined}
        aria-hidden
      >
        {prop && <img className="rx-tag__prop" src={prop} alt="" draggable={false} />}
        <span className="rx-tag__text">
          {lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </span>
    </At>
  );
}
