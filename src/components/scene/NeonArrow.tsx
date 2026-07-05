import React from 'react';

export type ArrowDir = 'up' | 'down' | 'left' | 'right';
export type ArrowColor = 'cerise' | 'cyan';

/** Screen-space rotation applied to the SVG tube for each direction. */
const ROTATION: Record<ArrowDir, number> = { up: 0, right: 90, down: 180, left: 270 };

/** Directional "come this way" bob, matched to the visible arrow direction. */
const BOB_CLASS: Record<ArrowDir, string> = {
  up: 'sw-bob-up',
  down: 'sw-bob-down',
  left: 'sw-bob-left',
  right: 'sw-bob-right',
};

interface NeonArrowProps {
  dir: ArrowDir;
  label: string;
  onClick: () => void;
  color?: ArrowColor;
  /** Tube height in px (width scales with it). Defaults to 96. */
  size?: number;
  /** Tilt the arrow onto the "floor" in perspective, like the painted lobby arrow. */
  floor?: boolean;
  className?: string;
}

/** Arrow outline with rounded corners (radius 6), matched to the neon floor
 *  arrow originally painted into the gallery artwork (since removed from the
 *  image — this SVG is its 1:1 replacement). */
const TUBE_PATH =
  'M 86.76 45.76 Q 91 50 85 50 L 73 50 Q 67 50 67 56 L 67 115 Q 67 121 61 121 ' +
  'L 39 121 Q 33 121 33 115 L 33 56 Q 33 50 27 50 L 15 50 Q 9 50 13.24 45.76 ' +
  'L 45.76 13.24 Q 50 9 54.24 13.24 Z';

/** Tube colors sampled from the painted arrow: a saturated magenta tube with a
 *  near-white hot core (cyan variant mirrors the same treatment). */
const TUBE = {
  cerise: { outer: '#FA3AD3', core: '#FFEBFC' },
  cyan: { outer: '#26D8E8', core: '#EDFEFF' },
} as const;

/**
 * A glowing neon-tube arrow — a 1:1 code recreation of the arrows painted in
 * the Sweetardio scene art, turned into an interactive navigation control.
 *
 * Transforms are layered across nested elements so they never collide:
 *   button (hit area) → .sw-arrow-fx (floor tilt + hover scale)
 *     → .sw-arrow-bob (idle bob) → svg (direction rotation + neon glow)
 */
const NeonArrow: React.FC<NeonArrowProps> = ({
  dir,
  label,
  onClick,
  color = 'cerise',
  size = 96,
  floor = false,
  className = '',
}) => {
  const tube = TUBE[color];
  const tilt = floor ? 'perspective(560px) rotateX(48deg)' : 'rotateX(0deg)';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`sw-arrow-btn group inline-flex items-center justify-center ${className}`}
    >
      <span className="sw-arrow-fx" style={{ ['--sw-tilt' as string]: tilt }}>
        <span className={`sw-arrow-bob ${BOB_CLASS[dir]}`}>
          <svg
            width={size}
            height={size * 1.3}
            viewBox="0 0 100 130"
            fill="none"
            aria-hidden="true"
            className={`sw-neon-arrow ${color === 'cyan' ? 'is-cyan' : ''}`}
            style={{ transform: `rotate(${ROTATION[dir]}deg)`, display: 'block' }}
          >
            {/* Hollow rounded tube: saturated outer stroke + white-hot core. */}
            <path d={TUBE_PATH} stroke={tube.outer} strokeWidth={6.5} strokeLinejoin="round" strokeLinecap="round" />
            <path d={TUBE_PATH} stroke={tube.core} strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </span>
      </span>
    </button>
  );
};

export default NeonArrow;
