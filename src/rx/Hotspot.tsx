/**
 * A place on a painting you can point at.
 *
 * No words are drawn over the art: the label is the hotspot's accessible
 * name and the browser's own hover tooltip. Live hotspots do something; dead
 * ones only flicker when touched. A room nudges by letting a hotspot breathe.
 */
import { useState, type ReactNode } from 'react';
import { At } from './Stage';
import type { Rect } from './scenes';

interface HotspotProps {
  r: Rect;
  /** The hotspot's words: accessible name and hover tooltip. */
  label: string | readonly string[];
  /** No action: the tooltip is the whole point. */
  dead?: boolean;
  /** Nudge: breathe without being pointed at. */
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
  dead = false,
  hint = false,
  refusing = false,
  onActivate,
  className = '',
  children,
}: HotspotProps) {
  const words = typeof label === 'string' ? label : label.join(' / ');
  const [flicker, setFlicker] = useState(0);

  const activate = () => {
    if (dead || refusing) {
      setFlicker((n) => n + 1);
      if (refusing) onActivate?.();
      return;
    }
    onActivate?.();
  };

  return (
    <At
      r={r}
      className={`rx-hotspot ${dead ? 'is-dead' : ''} ${hint ? 'is-hint' : ''} ${refusing ? 'is-refusing' : ''} ${
        flicker ? `is-flicker-${flicker % 2}` : ''
      } ${className}`}
    >
      <button
        type="button"
        className="rx-hotspot__hit"
        aria-label={words}
        title={words}
        aria-disabled={refusing || undefined}
        onClick={activate}
      >
        {children}
      </button>
    </At>
  );
}
