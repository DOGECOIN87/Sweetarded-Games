import { useEffect, useState } from 'react';
import { SocialIcon } from './SocialIcon';
import { MAKER } from '../content/maker';

/* ── The Maker — who's behind the counter ────────────────────────────
   Portrait in a neon frame with an Audius-verified badge, the maker's
   own role words, and live stats pulled from the public Audius API at
   view time (CORS is open; everything degrades gracefully without it). */

interface AudiusLive {
  verified: boolean;
  tracks: number;
  followers: number;
}

const compact = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 1 : 1)}K`.replace('.0K', 'K') : String(n);

const MakerBio = () => {
  const [live, setLive] = useState<AudiusLive | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 6000);
    fetch(MAKER.audius.api, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const u = j?.data;
        if (u && typeof u.is_verified === 'boolean') {
          setLive({
            verified: u.is_verified,
            tracks: u.track_count ?? 0,
            followers: u.follower_count ?? 0,
          });
        }
      })
      .catch(() => { /* offline / blocked — static content stands alone */ })
      .finally(() => window.clearTimeout(t));
    return () => { ctrl.abort(); window.clearTimeout(t); };
  }, []);

  const verified = live ? live.verified : true; /* confirmed via API at build review */

  return (
    <section id="maker" aria-label="About the maker" className="relative mx-auto max-w-5xl px-6 py-20 sm:py-24">
      <div className="sw-reveal bg-gradient-to-br from-sweetardios-cerise/55 via-sweetardios-violet/25 to-sweetardios-cyan/40 p-px shadow-[0_40px_120px_-40px_rgba(247,21,171,0.5)]">
        <div className="relative grid grid-cols-1 items-center gap-8 overflow-hidden bg-sweetardios-oxford/85 px-7 py-10 backdrop-blur-xl sm:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] sm:gap-10 sm:px-10 sm:py-12">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* Portrait in a neon frame */}
          <div className="mx-auto w-full max-w-[260px] sm:max-w-none">
            <div className="relative bg-gradient-to-br from-sweetardios-cerise/70 via-sweetardios-violet/40 to-sweetardios-cyan/40 p-px">
              <div className="relative aspect-square overflow-hidden bg-sweetardios-oxford">
                <img
                  src={MAKER.portrait}
                  alt={`${MAKER.name} — ${MAKER.role}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                {verified && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 border border-white/15 bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                    <span aria-hidden className="text-sweetardios-cyan">✓</span> Audius Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* The card */}
          <div className="text-center sm:text-left">
            <p className="inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-sweetardios-cerise backdrop-blur">
              <span aria-hidden className="h-1.5 w-1.5 bg-sweetardios-cerise shadow-[0_0_8px_#F715AB]" style={{ borderRadius: '9999px' }} />
              The Maker · Behind the counter
            </p>

            <h3 className="font-heading mt-5 text-4xl text-white sm:text-5xl">
              <span className="sw-sign sw-glow-cerise text-sweetardios-cerise">{MAKER.name}</span>
            </h3>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100/70">
              {MAKER.role} — <span className="text-white">{MAKER.tagline}</span>
            </p>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-blue-100/65 sm:mx-0">
              {MAKER.blurb}
            </p>

            {live && (
              <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100/50 sm:justify-start">
                <span><span className="text-sweetardios-cyan">{live.tracks}</span> tracks on Audius</span>
                <span aria-hidden className="hidden h-3 w-px bg-white/15 sm:block" />
                <span><span className="text-sweetardios-cerise">{compact(live.followers)}</span> followers</span>
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <a
                href={MAKER.audius.url}
                target="_blank"
                rel="noopener noreferrer"
                className="sw-shine inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5"
                style={{ background: '#F715AB' }}
              >
                Listen on Audius <span aria-hidden>↗</span>
              </a>
              <a
                href={MAKER.x.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-blue-100/75 transition-colors hover:border-sweetardios-cyan/50 hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
              >
                <SocialIcon platform="x" className="h-3.5 w-3.5" /> {MAKER.x.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MakerBio;
