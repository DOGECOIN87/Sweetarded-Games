import { useCallback, useEffect, useRef, useState } from 'react';
import { SocialIcon } from './SocialIcon';
import { ARTIST_RARES, rareSrc, RareAccent } from '../content/artistRares';
import SectionHeading from './SectionHeading';

/* ── Artist Series — looping gallery carousel of 1/1 guest-artist rares ──
   The neon frame shows one rare at a time and loops forever: it auto-advances
   every AUTOPLAY_MS, pauses while hovered or focused, supports swipe on touch
   and the segmented progress bar doubles as direct navigation. Add rares in
   src/content/artistRares.ts — everything here scales with the list. */

const AUTOPLAY_MS = 6000;

const ACCENT: Record<
  RareAccent,
  { text: string; frame: string; chip: string; shadow: string; bar: string }
> = {
  cerise: {
    text: 'text-sweetardios-cerise',
    frame: 'from-sweetardios-cerise/70 via-sweetardios-violet/40 to-sweetardios-cyan/30',
    chip: 'hover:border-sweetardios-cerise/60 hover:text-sweetardios-cerise',
    shadow: 'shadow-[0_30px_90px_-30px_rgba(247,21,171,0.55)]',
    bar: '#F715AB',
  },
  cyan: {
    text: 'text-sweetardios-cyan',
    frame: 'from-sweetardios-cyan/70 via-sweetardios-violet/40 to-sweetardios-cerise/30',
    chip: 'hover:border-sweetardios-cyan/60 hover:text-sweetardios-cyan',
    shadow: 'shadow-[0_30px_90px_-30px_rgba(52,237,243,0.5)]',
    bar: '#34EDF3',
  },
};

const LinkChip = ({
  href,
  accent,
  children,
  ariaLabel,
}: {
  href: string;
  accent: RareAccent;
  children: React.ReactNode;
  ariaLabel: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className={`inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan ${ACCENT[accent].chip}`}
  >
    {children}
    <span aria-hidden>↗</span>
  </a>
);

const ArtistRares = () => {
  const rares = ARTIST_RARES;
  const count = rares.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchX = useRef<number | null>(null);

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  /* Respect prefers-reduced-motion: no autoplay, no progress fill. */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  /* The loop itself — advance on an interval unless paused or hidden. */
  useEffect(() => {
    if (paused || reducedMotion || count < 2) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, count]);

  if (count === 0) return null;

  const active = rares[index];
  const a = ACCENT[active.accent];

  return (
    <section id="rares" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <SectionHeading
        eyebrow="Artist Series"
        title="The Rare Wall"
        sub="One-of-one pieces made for the Sweetardios by guest artists. Follow the frames back to their makers."
        accent="cerise"
      />

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Artist Series rares"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          if (touchX.current !== null) {
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (dx > 40) prev();
            else if (dx < -40) next();
          }
          touchX.current = null;
          setPaused(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
        }}
        className="sw-reveal grid grid-cols-1 items-stretch gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-10"
      >
        {/* Neon gallery frame — the slides stack and crossfade inside it. */}
        <div className={`relative bg-gradient-to-br ${a.frame} p-px transition-shadow duration-700 ${a.shadow}`}>
          <div className="relative aspect-square w-full overflow-hidden bg-sweetardios-oxford">
            {rares.map((r, i) => (
              <div
                key={r.file}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}: ${r.title} by ${r.artist}`}
                aria-hidden={i !== index}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  i === index ? 'z-10 opacity-100 scale-100' : 'z-0 opacity-0 scale-[1.03] pointer-events-none'
                }`}
              >
                <img
                  src={rareSrc(r)}
                  alt={`${r.title} — 1 of 1 by ${r.artist}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}

            {/* 1/1 tag pinned to the frame */}
            <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 border border-white/15 bg-black/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
              <span className={`h-1.5 w-1.5 ${active.accent === 'cerise' ? 'bg-sweetardios-cerise' : 'bg-sweetardios-cyan'}`} style={{ borderRadius: '9999px' }} />
              1 of 1 · Rare
            </span>
          </div>
        </div>

        {/* Museum placard — attribution, curator note, artist links, controls. */}
        <div className="flex flex-col border border-white/10 bg-sweetardios-oxford/80 p-7 backdrop-blur sm:p-8">
          {/* keyed so the text softly re-enters on every slide change */}
          <div key={active.file} className="sw-rise flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${a.text}`}>
              Rare {index + 1} <span className="text-white/30">/ {count}</span>
            </p>
            <h3 className={`font-heading mt-2 text-3xl text-white sm:text-4xl ${active.accent === 'cerise' ? 'sw-glow-cerise' : 'sw-glow-cyan'}`}>
              {active.title}
            </h3>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-blue-100/70">
              by <span className="text-white">{active.artist}</span>
            </p>
            {active.note && (
              <p className="mt-5 text-sm leading-relaxed text-blue-100/65">{active.note}</p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {active.website && (
                <LinkChip href={active.website} accent={active.accent} ariaLabel={`Visit ${active.artist}'s website`}>
                  Website
                </LinkChip>
              )}
              {active.x && (
                <LinkChip href={active.x} accent={active.accent} ariaLabel={`Visit ${active.artist} on X`}>
                  <SocialIcon platform="x" className="h-3.5 w-3.5" /> Follow
                </LinkChip>
              )}
            </div>
          </div>

          {/* Controls: prev / segmented loop progress / next */}
          <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous rare"
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 text-lg text-blue-100/70 transition-colors hover:border-sweetardios-cerise/60 hover:text-sweetardios-cerise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
            >
              ‹
            </button>

            <div className="flex flex-1 items-center gap-1.5" role="tablist" aria-label="Choose a rare">
              {rares.map((r, i) => (
                <button
                  key={r.file}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show ${r.title} by ${r.artist}`}
                  onClick={() => goTo(i)}
                  className="group relative h-4 flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
                >
                  <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-white/15 transition-colors group-hover:bg-white/30" />
                  {i === index && (
                    <span
                      key={`${index}-${paused ? 'p' : 'r'}`}
                      className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 origin-left"
                      style={{
                        background: a.bar,
                        boxShadow: `0 0 8px ${a.bar}`,
                        transform: reducedMotion || count < 2 ? 'scaleX(1)' : undefined,
                        animation:
                          reducedMotion || count < 2
                            ? undefined
                            : `sw-rare-progress ${AUTOPLAY_MS}ms linear forwards ${paused ? 'paused' : 'running'}`,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next rare"
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 text-lg text-blue-100/70 transition-colors hover:border-sweetardios-cyan/60 hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArtistRares;
