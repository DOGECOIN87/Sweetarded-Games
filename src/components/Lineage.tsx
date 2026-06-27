/* Neochibi heritage — the bloodline that leads to Sweetardio. */

/** An @handle that links to the X (Twitter) profile. */
const X = ({ handle, color = 'cerise' }: { handle: string; color?: 'cerise' | 'cyan' }) => (
  <a
    href={`https://x.com/${handle}`}
    target="_blank"
    rel="noopener noreferrer"
    className={`font-semibold underline-offset-2 transition-colors hover:underline ${
      color === 'cyan' ? 'text-sweetardios-cyan' : 'text-sweetardios-cerise'
    }`}
  >
    @{handle}
  </a>
);

const Lineage = () => (
  <section id="heritage" className="relative mx-auto max-w-3xl px-6 py-20 sm:py-24">
    <header className="mb-10 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">The Heritage</p>
      <h2 className="font-heading mt-2 text-4xl text-white sm:text-5xl">
        Five Years of <span className="sw-glow-cerise text-sweetardios-cerise">Neochibi</span> History
      </h2>
    </header>

    <div className="space-y-5 text-center text-base leading-relaxed text-blue-100/75 sm:text-lg">
      <p>One bloodline after another, each leaving its mark on internet culture.</p>

      <p>
        From the original muse <X handle="MiladyMaker" /> that started it all, to{' '}
        <X handle="radbro_webring" color="cyan" /> running parallel,{' '}
        <X handle="remiliacorp333" /> building the dynasty (
        <X handle="REMILIONAIRE" color="cyan" />, <X handle="BonklerNFT" color="cyan" />,{' '}
        <X handle="PixeladyMaker" color="cyan" />), the fusion in{' '}
        <X handle="SCHIZO_POSTERS" />, the wild Solana mutation with{' '}
        <X handle="retardiosolana" color="cyan" />, and the degenerate kingdom of{' '}
        <X handle="Gorbagana_chain" /> that birthed <X handle="TheCookieChain" color="cyan" />.
      </p>

      <p className="font-semibold text-white">Every chapter respected. Every lineage honored.</p>
    </div>

    {/* The arrival */}
    <div className="relative mt-12 bg-gradient-to-br from-sweetardios-cerise/40 via-sweetardios-violet/20 to-sweetardios-cyan/40 p-px">
      <div className="relative overflow-hidden bg-sweetardios-oxford/80 px-8 py-10 text-center backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-sweetardios-cyan/80">Now the next evolution arrives</p>
        <h3 className="font-heading mt-3 text-5xl sm:text-6xl">
          <span className="sw-glow-cerise text-sweetardios-cerise">SWEET</span>
          <span className="sw-glow-cyan text-sweetardios-cyan">ARDIO</span>
        </h3>
        <p className="mt-4 text-sm text-blue-100/70 sm:text-base">
          Mint: <span className="font-semibold text-white">July 4, 2026 · 2:50 PM ET</span> — America's 250th
          birthday (2:50 → 250) · <X handle="LaunchMyNFT" color="cyan" />
        </p>
      </div>
    </div>
  </section>
);

export default Lineage;
