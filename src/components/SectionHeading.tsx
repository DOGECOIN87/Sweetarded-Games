import type { ReactNode } from 'react';

/**
 * Neon-sign section heading — the one header treatment every zone shares.
 * Eyebrow renders as a ticket-stub chip; the title mounts like signage with
 * neon tick brackets and a brief strike-in flicker when it first scrolls
 * into view (driven by the .sw-reveal / .sw-sign CSS in index.css).
 */
interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  accent?: 'cerise' | 'cyan';
  align?: 'center' | 'left';
  className?: string;
}

const SectionHeading = ({
  eyebrow,
  title,
  sub,
  accent = 'cyan',
  align = 'center',
  className = '',
}: SectionHeadingProps) => {
  const accentText = accent === 'cerise' ? 'text-sweetardios-cerise' : 'text-sweetardios-cyan';
  const dot = accent === 'cerise' ? 'bg-sweetardios-cerise shadow-[0_0_8px_#F715AB]' : 'bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]';
  const centered = align === 'center';

  return (
    <header className={`sw-reveal mb-12 ${centered ? 'text-center' : 'text-center sm:text-left'} ${className}`}>
      <p
        className={`inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] ${accentText} backdrop-blur`}
      >
        <span aria-hidden className={`h-1.5 w-1.5 ${dot}`} style={{ borderRadius: '9999px' }} />
        {eyebrow}
      </p>
      <h2 className="font-heading mt-5 text-4xl text-white sm:text-5xl lg:text-6xl">
        <span className="sw-sign">{title}</span>
      </h2>
      {sub && (
        <p className={`mt-4 max-w-2xl text-sm leading-relaxed text-blue-100/60 sm:text-base ${centered ? 'mx-auto' : 'mx-auto sm:mx-0'}`}>
          {sub}
        </p>
      )}
    </header>
  );
};

export default SectionHeading;
