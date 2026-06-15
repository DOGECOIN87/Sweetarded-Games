import React from 'react';

interface CharacterProps {
  /** filename in /public/characters without the .png extension */
  name: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** overlay the house "Sweetardio" face into the character's face-hole */
  face?: boolean;
}

/**
 * Renders a Sweetardios character body (a transparent PNG with an empty
 * face-hole) and composites a simple house face into the hole.
 *
 * The collection's generator draws every character's face-hole around a fixed
 * canvas anchor (~690,601 on a 1393² canvas → ~49.5% / 43%), so a single
 * absolutely-positioned face lands correctly for all of them.
 */
const Character: React.FC<CharacterProps> = ({ name, alt, className = '', style, face = true }) => (
  <div className={`relative ${className}`} style={style}>
    <img
      src={`/characters/${name}.png`}
      alt={alt ?? name}
      draggable={false}
      loading="lazy"
      className="h-full w-full select-none object-contain"
    />
    {face && (
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: '49.5%', top: '43%', width: '23%', transform: 'translate(-50%, -50%)' }}
      >
        {/* skin ball */}
        <ellipse cx="50" cy="53" rx="49" ry="46" fill="#c79a6c" />
        <ellipse cx="50" cy="45" rx="43" ry="35" fill="#dcb38a" />
        {/* eye whites */}
        <ellipse cx="33" cy="51" rx="10.5" ry="13.5" fill="#fcfcfc" />
        <ellipse cx="67" cy="51" rx="10.5" ry="13.5" fill="#fcfcfc" />
        {/* pupils */}
        <circle cx="34.5" cy="54" r="5.2" fill="#0a0a0a" />
        <circle cx="65.5" cy="54" r="5.2" fill="#0a0a0a" />
        {/* cool angular brows */}
        <path d="M19 34 L45 42" stroke="#0a0a0a" strokeWidth="6" strokeLinecap="round" />
        <path d="M81 34 L55 42" stroke="#0a0a0a" strokeWidth="6" strokeLinecap="round" />
      </svg>
    )}
  </div>
);

export default Character;
