import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading';
import {
  WEATHER_CARRIED,
  WEATHER_STATES,
  weatherOneIn,
  weatherPoster,
  weatherRow,
  weatherSrc,
  type WeatherName,
} from '../content/weather';

/* ── Animated weather wall ─────────────────────────────────────────
   The seven weather loops, featured under the sticker stream. One big
   cabinet plays the selected state; the filmstrip underneath is also
   live so the whole wall feels like it's weather. Click a strip tile
   (or wait for the autoplay) to promote it. Clips mount only once the
   section is on screen so seven webms don't all download at the door. */

const AUTOPLAY_MS = 7000;

const WeatherLoop = ({
  name,
  className,
  posterClassName,
  label,
  ready,
}: {
  name: WeatherName;
  className?: string;
  posterClassName?: string;
  label: string;
  ready: boolean;
}) => (
  <>
    {ready ? (
      <video
        className={className}
        poster={weatherPoster(name)}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={label}
      >
        <source src={weatherSrc(name)} type="video/webm" />
      </video>
    ) : (
      <img
        src={weatherPoster(name)}
        alt={label}
        loading="lazy"
        decoding="async"
        className={posterClassName ?? className}
      />
    )}
  </>
);

const AnimatedRares = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const active = WEATHER_STATES[index];
  const activeRow = weatherRow(active);
  const count = WEATHER_STATES.length;

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin: '280px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || !ready) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, ready, count]);

  return (
    <section
      id="weather"
      ref={rootRef}
      aria-label="Animated weather rares"
      className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <SectionHeading
        eyebrow="The Animated Tier"
        title="They move"
        sub={`${WEATHER_CARRIED.count.toLocaleString()} tokens carry weather — a seamless video loop as well as the still. These are the seven states, playing for real.`}
        accent="cerise"
      />

      <div className="sw-reveal">
        {/* Featured cabinet */}
        <div className="relative bg-gradient-to-br from-sweetardios-cerise/70 via-sweetardios-violet/40 to-sweetardios-cyan/30 p-px shadow-[0_30px_90px_-30px_rgba(247,21,171,0.55)]">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-sweetardios-oxford sm:aspect-[2/1]">
            {WEATHER_STATES.map((name, i) => (
              <div
                key={name}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  i === index ? 'z-10 scale-100 opacity-100' : 'pointer-events-none z-0 scale-[1.03] opacity-0'
                }`}
                aria-hidden={i !== index}
              >
                <WeatherLoop
                  name={name}
                  ready={ready && (i === index || Math.abs(i - index) === 1 || (index === 0 && i === count - 1))}
                  label={`${name} weather loop`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#080f33] via-[#080f33]/55 to-transparent"
            />

            <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 border border-white/15 bg-black/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse bg-red-500" style={{ borderRadius: '9999px' }} />
              Live · Animated
            </span>

            <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sweetardios-cerise">
                Weather {index + 1} <span className="text-white/30">/ {count}</span>
              </p>
              <h3 className="font-heading sw-glow-cerise mt-1 text-3xl text-white sm:text-5xl">{active}</h3>
              {activeRow && (
                <p className="mt-2 text-sm tabular-nums text-blue-100/70">
                  <span className="font-bold text-sweetardios-cerise">
                    1 in {weatherOneIn(activeRow.count).toLocaleString()}
                  </span>
                  <span className="ml-3">{activeRow.count} made · {activeRow.share}% of the mint</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filmstrip — all seven states, live, click to feature */}
        <div
          role="tablist"
          aria-label="Choose a weather rare"
          className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:gap-3 sm:overflow-visible"
        >
          {WEATHER_STATES.map((name, i) => {
            const row = weatherRow(name);
            const on = i === index;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={`Show ${name} weather`}
                onClick={() => goTo(i)}
                className={`group relative min-w-[4.75rem] shrink-0 overflow-hidden border bg-[#080f33] text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan sm:min-w-0 ${
                  on
                    ? 'border-sweetardios-cerise/80 shadow-[0_0_24px_rgba(247,21,171,0.35)]'
                    : 'border-white/10 hover:-translate-y-0.5 hover:border-sweetardios-cyan/50'
                }`}
              >
                <div className="relative aspect-square">
                  <WeatherLoop
                    name={name}
                    ready={ready}
                    label={`${name} weather`}
                    className={`h-full w-full object-cover transition-transform duration-500 ${on ? 'scale-100' : 'group-hover:scale-[1.06]'}`}
                  />
                  <span
                    className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-6 text-[9px] font-bold uppercase tracking-[0.14em] sm:px-2 ${
                      on ? 'text-sweetardios-cerise' : 'text-white/80'
                    }`}
                  >
                    {name}
                  </span>
                </div>
                {row && (
                  <span className="sr-only">
                    1 in {weatherOneIn(row.count).toLocaleString()}, {row.count} made
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/rarity"
            className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-6 py-3 text-xs font-extrabold uppercase tracking-wide text-blue-100/80 transition-colors hover:border-sweetardios-cerise/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
          >
            Open the rarity vault <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AnimatedRares;
