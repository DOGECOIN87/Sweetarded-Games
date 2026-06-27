import MintEmbed, { MINT_URL } from './MintEmbed';

/* Upcoming Sweetardio mint — LaunchMyNFT embed + prominent call to action. */
const MintSection = () => (
  <section id="mint" className="relative mx-auto max-w-4xl px-6 py-20 sm:py-24">
    <div className="relative bg-gradient-to-br from-sweetardios-cerise/50 via-sweetardios-violet/25 to-sweetardios-cyan/50 p-px shadow-[0_40px_120px_-40px_rgba(247,21,171,0.6)]">
      <div className="relative overflow-hidden bg-sweetardios-oxford/85 px-8 py-12 text-center backdrop-blur-2xl sm:px-14 sm:py-14">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <span className="mb-5 inline-flex items-center gap-2.5 border border-sweetardios-cerise/40 bg-white/[0.04] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-sweetardios-cerise backdrop-blur">
          <span className="h-1.5 w-1.5 bg-sweetardios-cerise shadow-[0_0_8px_#F715AB]" style={{ borderRadius: '9999px' }} />
          Mint Live · LaunchMyNFT
        </span>

        <h2 className="font-heading text-4xl text-white sm:text-5xl">
          <span className="sw-glow-cerise text-sweetardios-cerise">Mint</span>{' '}
          <span className="sw-glow-cyan text-sweetardios-cyan">a Sweetardio</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-100/70 sm:text-base">
          Grab your spot in the Sweetardios collection. Mint directly below, or head
          over to LaunchMyNFT — same collection, same price.
        </p>

        <div className="mt-9">
          <MintEmbed />
        </div>

        <a
          href={MINT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sw-shine mt-9 inline-flex items-center gap-2 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5"
          style={{ background: '#F715AB' }}
        >
          Mint on LaunchMyNFT <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  </section>
);

export default MintSection;
