/* Neochibi heritage — the bloodline that leads to Sweetardio. */

type Accent = 'cerise' | 'cyan';

interface Collection {
  handle: string;
  name: string;
  role: string;
  accent: Accent;
}

/**
 * The lineage, in order. Each collection links to its X profile.
 */
const COLLECTIONS: Collection[] = [
  { handle: 'MiladyMaker',    name: 'Milady Maker',   role: 'The original muse that started it all', accent: 'cerise' },
  { handle: 'radbro_webring', name: 'Radbro Webring', role: 'Running parallel from day one',          accent: 'cyan' },
  { handle: 'remiliacorp333', name: 'Remilia Corp',   role: 'Building the dynasty',                   accent: 'cerise' },
  { handle: 'REMILIONAIRE',   name: 'Remilionaire',   role: 'House of Remilia',                       accent: 'cyan' },
  { handle: 'BonklerNFT',     name: 'Bonkler',        role: 'House of Remilia',                       accent: 'cyan' },
  { handle: 'PixeladyMaker',  name: 'Pixelady Maker', role: 'House of Remilia',                       accent: 'cyan' },
  { handle: 'SCHIZO_POSTERS', name: 'Schizo Posters', role: 'The fusion',                            accent: 'cerise' },
  { handle: 'retardiosolana', name: 'Retardio',       role: 'The wild Solana mutation',              accent: 'cyan' },
];

const ACCENT = {
  cerise: {
    text: 'text-sweetardios-cerise',
    ring: 'from-sweetardios-cerise/70 to-sweetardios-violet/30',
    border: 'hover:border-sweetardios-cerise/60',
    glow: 'group-hover:shadow-[0_0_22px_-4px_rgba(247,21,171,0.55)]',
  },
  cyan: {
    text: 'text-sweetardios-cyan',
    ring: 'from-sweetardios-cyan/70 to-sweetardios-violet/30',
    border: 'hover:border-sweetardios-cyan/60',
    glow: 'group-hover:shadow-[0_0_22px_-4px_rgba(52,237,243,0.5)]',
  },
} as const;

const CollectionCard = ({ c }: { c: Collection }) => {
  const a = ACCENT[c.accent];
  return (
    <a
      href={`https://x.com/${c.handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-4 border border-white/10 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 ${a.border} ${a.glow}`}
    >
      {/* Gradient monogram */}
      <div className={`relative shrink-0 bg-gradient-to-br ${a.ring} p-px`}>
        <div className="flex h-11 w-11 items-center justify-center bg-sweetardios-oxford">
          <span className={`font-heading text-lg ${a.text}`}>{c.name.charAt(0)}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="truncate font-bold text-white">{c.name}</h4>
          <span className={`shrink-0 text-xs ${a.text} opacity-0 transition-opacity group-hover:opacity-100`}>↗</span>
        </div>
        <p className="truncate text-xs text-blue-100/55">{c.role}</p>
        <p className={`mt-0.5 truncate text-[11px] font-semibold ${a.text}`}>@{c.handle}</p>
      </div>
    </a>
  );
};

const Lineage = () => (
  <section id="heritage" className="relative mx-auto max-w-5xl px-6 py-20 sm:py-24">
    <header className="mb-10 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">The Heritage</p>
      <h2 className="font-heading mt-2 text-4xl text-white sm:text-5xl">
        Five Years of <span className="sw-glow-cerise text-sweetardios-cerise">Neochibi</span> History
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-100/70 sm:text-lg">
        One bloodline after another, each leaving its mark on internet culture.
        Every chapter respected. Every lineage honored.
      </p>
    </header>

    {/* Collection grid */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {COLLECTIONS.map((c) => (
        <CollectionCard key={c.handle} c={c} />
      ))}
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
          birthday (2:50 → 250) ·{' '}
          <a
            href="https://x.com/LaunchMyNFT"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sweetardios-cyan underline-offset-2 transition-colors hover:underline"
          >
            @LaunchMyNFT
          </a>
        </p>
      </div>
    </div>
  </section>
);

export default Lineage;
