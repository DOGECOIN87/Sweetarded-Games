/**
 * Neon aisle divider — the seam between zones of the arcade.
 * Two neon tubes carry light pulses outward from a center tag that names
 * the aisle you're entering; small checkerboard caps close each end like
 * diner trim. Pure CSS animation (see .sw-tube in index.css); decorative
 * only, so the whole thing is aria-hidden.
 */
interface NeonDividerProps {
  aisle: string; // e.g. '02'
  label: string; // e.g. 'The Rare Wall'
  accent?: 'cerise' | 'cyan';
}

const NeonDivider = ({ aisle, label, accent = 'cyan' }: NeonDividerProps) => {
  const tubeColor = accent === 'cerise' ? '#F715AB' : '#34EDF3';
  const accentText = accent === 'cerise' ? 'text-sweetardios-cerise' : 'text-sweetardios-cyan';

  return (
    <div aria-hidden className="relative mx-auto flex max-w-6xl items-center gap-4 px-6 py-2 sm:gap-6">
      <span className="sw-checker h-2.5 w-6 shrink-0" />
      <span
        className="sw-tube sw-tube-rev flex-1"
        style={{ '--tube-c': tubeColor, '--tube-t': '6s' } as React.CSSProperties}
      />
      <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap border border-white/10 bg-sweetardios-oxford/70 px-3.5 py-1.5 backdrop-blur">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">Aisle {aisle}</span>
        <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${accentText}`}>{label}</span>
      </span>
      <span
        className="sw-tube flex-1"
        style={{ '--tube-c': tubeColor, '--tube-t': '6s' } as React.CSSProperties}
      />
      <span className="sw-checker h-2.5 w-6 shrink-0" />
    </div>
  );
};

export default NeonDivider;
