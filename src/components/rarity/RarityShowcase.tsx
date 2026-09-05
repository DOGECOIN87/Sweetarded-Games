import { useEffect, useRef, useState } from 'react';
import { RARITY_CATEGORIES, SUPPLY } from '../../content/rarity';

/* ── Showcase — what the scarce traits actually look like ──────────
   The counts here are looked up from the rarity data by trait name, so
   the art and the numbers can never drift apart. */

const rowFor = (categoryId: string, name: string) =>
  RARITY_CATEGORIES.find((c) => c.id === categoryId)?.rows.find((r) => r.name === name);

const oneIn = (count: number) => Math.round(SUPPLY / count);

/** Weather loops, rarest first — file slugs match public/rarity/weather/. */
const WEATHER = ['Tornado', 'Flooded', 'Blizzard', 'Storm', 'Fog', 'Snow', 'Rain'];

/** Scarce plates, rarest first — slugs match public/rarity/plates/. */
const PLATES = [
  'Starfield',
  'Legendary Just Aliens',
  'Legendary Opengotchi',
  'Legendary Simplex',
  'Legendary Tenders',
];

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

/**
 * Plates that are animated in the collection itself.
 *
 * Starfield is the only one: every other background is a still PNG, while
 * Starfield ships as a 12-frame seamless loop (Nyan_Blank.gif in
 * Sweetardio_Collection). Showing it as a still was under-selling the
 * scarcest plate in the set. The .webp stays as the poster, so a browser
 * that won't play the loop still gets the art.
 */
const ANIMATED_PLATES = new Set(['Starfield']);

/* ── One weather tile — the clip mounts only once it scrolls into view,
      so seven loops don't all download at once. ─────────────────── */

const WeatherTile = ({ name, count, i }: { name: string; count: number; i: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const s = slug(name);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      className="sw-rise group relative overflow-hidden border border-white/10 bg-[#080f33]"
      style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}
    >
      <div className="relative aspect-square">
        {inView ? (
          <video
            className="h-full w-full object-cover"
            poster={`/rarity/weather/${s}-poster.webp`}
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            aria-label={`${name} weather loop`}
          >
            <source src={`/rarity/weather/${s}.webm`} type="video/webm" />
          </video>
        ) : (
          <img
            src={`/rarity/weather/${s}-poster.webp`}
            alt={`${name} weather`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 border border-white/15 bg-black/65 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse bg-red-500" style={{ borderRadius: '9999px' }} />
          Live
        </span>
      </div>
      <figcaption className="border-t border-white/10 px-3 py-2.5">
        <p className="truncate text-[13px] font-bold text-white" title={name}>
          {name}
        </p>
        <p className="mt-0.5 text-[11px] tabular-nums text-blue-100/50">
          <span className="text-sweetardios-cerise">1 in {oneIn(count).toLocaleString()}</span>
          <span className="ml-2">{count} made</span>
        </p>
      </figcaption>
    </figure>
  );
};

const RarityShowcase = () => {
  const weather = WEATHER.map((name) => ({ name, row: rowFor('weather', name) })).filter((w) => w.row);
  const plates = PLATES.map((name) => ({ name, row: rowFor('backgrounds', name) })).filter((p) => p.row);

  return (
    <>
      {/* ── The animated tier ── */}
      <div className="mt-20">
        <header className="border-b border-white/10 pb-4">
          <h2 className="font-heading text-3xl text-white sm:text-4xl">The animated tier</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-blue-100/60">
            444 tokens carry weather — and a weather token carries a seamless video loop as well as its still.
            These are the seven states, playing for real. Weather is kept off the legendary plates, so no token
            is both Legendary and animated.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {weather.map((w, i) => (
            <WeatherTile key={w.name} name={w.name} count={w.row!.count} i={i} />
          ))}
        </div>
      </div>

      {/* ── The scarce plates ── */}
      <div className="mt-20">
        <header className="border-b border-white/10 pb-4">
          <h2 className="font-heading text-3xl text-white sm:text-4xl">The scarce plates</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-blue-100/60">
            Starfield is the scarcest background in the collection. The four Legendary plates are slot-allocated
            at exactly 30 each and never enter the weighted draw — so every Legendary is rarer than every
            ordinary plate.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {plates.map((p, i) => (
            <figure
              key={p.name}
              className="sw-rise group overflow-hidden border border-white/10 bg-[#080f33]"
              style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}
            >
              <div className="relative aspect-square overflow-hidden">
                {ANIMATED_PLATES.has(p.name) ? (
                  <video
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    poster={`/rarity/plates/${slug(p.name)}.webp`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="none"
                    aria-label={`${p.name} background plate, animated`}
                  >
                    <source src={`/rarity/plates/${slug(p.name)}.webm`} type="video/webm" />
                  </video>
                ) : (
                  <img
                    src={`/rarity/plates/${slug(p.name)}.webp`}
                    alt={`${p.name} background plate`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <figcaption className="border-t border-white/10 px-3 py-2.5">
                <p className="truncate text-[13px] font-bold text-white" title={p.name}>
                  {p.name}
                </p>
                <p className="mt-0.5 text-[11px] tabular-nums text-blue-100/50">
                  <span className="text-sweetardios-cerise">1 in {oneIn(p.row!.count).toLocaleString()}</span>
                  <span className="ml-2">{p.row!.count} made</span>
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </>
  );
};

export default RarityShowcase;
