import AudiusEmbed, { ARTIST_URL } from './AudiusEmbed';

/**
 * Highlighted music feature — streams the Sweetardio soundtrack straight from
 * Audius via the embedded player, with a link out to the full catalogue.
 */
const MusicFeature = () => (
  <section id="music" className="relative mx-auto max-w-5xl px-6 py-20 sm:py-24">
    <div className="relative bg-gradient-to-br from-sweetardios-cyan/45 via-sweetardios-violet/25 to-sweetardios-cerise/45 p-px shadow-[0_40px_120px_-40px_rgba(52,237,243,0.55)]">
      <div className="relative grid grid-cols-1 items-center gap-10 overflow-hidden bg-sweetardios-oxford/85 px-8 py-12 backdrop-blur-2xl sm:px-12 sm:py-14 md:grid-cols-2">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Copy */}
        <div className="text-center md:text-left">
          <span className="mb-5 inline-flex items-center gap-2.5 border border-sweetardios-cyan/40 bg-white/[0.04] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-sweetardios-cyan backdrop-blur">
            <span className="h-1.5 w-1.5 bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]" style={{ borderRadius: '9999px' }} />
            Now Playing · Audius
          </span>

          <h2 className="font-heading text-4xl text-white sm:text-5xl">
            <span className="sw-glow-cyan text-sweetardios-cyan">Sounds</span> of Sweetardio
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100/70 sm:mx-0 sm:text-base">
            The official soundtrack, streamed live from Audius. Hit play, let it
            ride, and dig into the full catalogue.
          </p>

          <a
            href={ARTIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="sw-shine mt-7 inline-flex items-center gap-2 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5"
            style={{ background: '#34EDF3' }}
          >
            Full catalogue on Audius <span aria-hidden>↗</span>
          </a>
        </div>

        {/* Player */}
        <div className="flex justify-center md:justify-end">
          <AudiusEmbed />
        </div>
      </div>
    </div>
  </section>
);

export default MusicFeature;
