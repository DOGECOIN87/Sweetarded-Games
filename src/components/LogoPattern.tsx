/* Staggered, animated pattern built from our own Sweetardios logo. */

interface LogoWallProps {
  cols?: number;
  rows?: number;
  /** rem, base size of each logo */
  base?: number;
  opacity?: number;
}

/**
 * A brick-staggered grid of the Sweetardios logo, each tile bobbing on its own
 * delay — our own version of the old staggered sticker wall.
 */
export const LogoWall = ({ cols = 6, rows = 5, base = 5, opacity = 0.6 }: LogoWallProps) => {
  const cells = [];
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, k++) {
      const stagger = (r % 2) * (100 / cols / 2); // brick offset on odd rows
      cells.push({
        k,
        left: (c * 100) / (cols - 1 || 1),
        top: (r * 100) / (rows - 1 || 1),
        delay: ((r + c) % 6) * 0.5,
        dur: 7 + ((r * 3 + c) % 4),
        size: base + ((r + c) % 3) * 1.2,
        offset: stagger,
      });
    }
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {cells.map((cell) => (
        <img
          key={cell.k}
          src="/sweetardios-logo.svg"
          alt=""
          loading="lazy"
          className="sw-float absolute object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.4)]"
          style={{
            left: `calc(${cell.left}% + ${cell.offset}%)`,
            top: `${cell.top}%`,
            width: `${cell.size}rem`,
            height: `${cell.size}rem`,
            opacity,
            animationDelay: `${cell.delay}s`,
            animationDuration: `${cell.dur}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

export default LogoWall;
