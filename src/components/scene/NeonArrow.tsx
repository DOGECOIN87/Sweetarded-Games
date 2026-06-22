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

/**
 * A glowing neon-tube arrow — a hand-drawn recreation of the painted arrows in
 * the Sweetardio scene, turned into an interactive navigation control.
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
  const stroke = color === 'cyan' ? '#c9f8fb' : '#ffc8ed';
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
            {/* Hollow arrow outline drawn as a single rounded neon tube. */}
            <path
              d="M50 9 L91 50 L67 50 L67 121 L33 121 L33 50 L9 50 Z"
              stroke={stroke}
              strokeWidth={7}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </span>
    </button>
  );
};

export default NeonArrow;
