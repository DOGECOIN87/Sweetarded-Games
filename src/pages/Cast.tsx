import { Link } from 'react-router-dom';
import { CHARACTERS, characterSrc } from '../content/characters';

/** Alternate the card glow between the two brand accents. */
const ACCENTS = [
  { border: 'hover:border-sweetardios-cerise/60', shadow: 'hover:shadow-[0_22px_60px_-18px_rgba(247,21,171,0.55)]', blob: '#F715AB' },
  { border: 'hover:border-sweetardios-cyan/60', shadow: 'hover:shadow-[0_22px_60px_-18px_rgba(52,237,243,0.5)]', blob: '#34EDF3' },
];

/** The Cast — one of each Sweetardio character, fresh from the diner. */
export default function CastPage() {
  return (
    <div className="relative min-h-[calc(100vh-var(--navbar-height,56px))] overflow-hidden text-white">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/games-bg.png)' }} />
        <div className="absolute inset-0 bg-sweetardios-oxford/80" />
        <div className="sw-scanlines absolute inset-0 opacity-[0.1]" />
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12">
        <header className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">Sweetardio Collection</p>
          <h1 className="font-heading mt-1 text-5xl sm:text-6xl">
            <span className="sw-glow-cerise text-sweetardios-cerise">The</span>{' '}
            <span className="sw-glow-cyan text-sweetardios-cyan">Cast</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100/70">
            The {CHARACTERS.length} characters of the Sweetardio collection — one of each sweetie,
            fresh out of the diner. Their sticker forms live on{' '}
            <Link to="/stickers" className="font-semibold text-sweetardios-cerise transition-colors hover:text-white">Stickers</Link>.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {CHARACTERS.map((c, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <li
                key={c.file}
                className={`sw-rise group relative border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-sm transition-all duration-200 hover:-translate-y-1.5 hover:bg-white/[0.07] ${accent.border} ${accent.shadow}`}
                style={{ animationDelay: `${Math.min(i * 0.03, 0.6)}s` }}
              >
                <div
                  aria-hidden
                  className="sw-blob absolute left-1/2 top-[42%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-40"
                  style={{ background: accent.blob }}
                />
                <img
                  src={characterSrc(c)}
                  alt={c.name}
                  loading="lazy"
                  className="relative mx-auto h-36 w-36 object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.55)] transition-transform duration-200 group-hover:scale-110 sm:h-44 sm:w-44"
                />
                <p className="relative mt-4 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100/75 transition-colors group-hover:text-white" title={c.name}>
                  {c.name}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-14 text-center">
          <Link
            to="/whitelist"
            className="sw-shine inline-flex items-center gap-2 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford"
            style={{ background: '#F715AB' }}
          >
            Collect them — join the whitelist <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
