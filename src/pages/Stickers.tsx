import { Link } from 'react-router-dom';
import { STICKERS, stickerSrc } from '../content/stickers';

/** The Stickers — every Sweetardio sticker, on one wall. */
export default function StickersPage() {
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
            <span className="sw-glow-cyan text-sweetardios-cyan">Stickers</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100/70">
            The sticker set of the Sweetardio collection — {STICKERS.length} of them and counting.
            Meet the 3D crew on{' '}
            <Link to="/cast" className="font-semibold text-sweetardios-cerise transition-colors hover:text-white">The Cast</Link>.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {STICKERS.map((c, i) => (
            <li
              key={c.file}
              className="sw-rise group border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur-sm transition-all duration-200 hover:-translate-y-1.5 hover:border-sweetardios-cerise/60 hover:bg-white/[0.07] hover:shadow-[0_18px_50px_-18px_rgba(247,21,171,0.55)]"
              style={{ animationDelay: `${Math.min(i * 0.03, 0.6)}s` }}
            >
              <img
                src={stickerSrc(c)}
                alt={c.name}
                loading="lazy"
                className="mx-auto h-28 w-28 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-110 sm:h-32 sm:w-32"
              />
              <p className="mt-3 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100/75 transition-colors group-hover:text-white" title={c.name}>
                {c.name}
              </p>
            </li>
          ))}
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
