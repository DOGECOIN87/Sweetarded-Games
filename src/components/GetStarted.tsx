/* Solana NFT marketplace links. Foreground accents on Oxford bg. */
const ACCENT = {
  cerise: {
    text: 'text-sweetardios-cerise',
    hoverText: 'group-hover:text-sweetardios-cerise',
    border: 'hover:border-sweetardios-cerise/60',
  },
  cyan: {
    text: 'text-sweetardios-cyan',
    hoverText: 'group-hover:text-sweetardios-cyan',
    border: 'hover:border-sweetardios-cyan/60',
  },
} as const;
type Accent = keyof typeof ACCENT;

interface LinkItem { name: string; url: string; logo: string; accent: Accent }

// Solana NFT marketplaces
const MARKETPLACES: LinkItem[] = [
  { name: 'Magic Eden', url: 'https://magiceden.io/', logo: 'magiceden', accent: 'cerise' },
  { name: 'Tensor', url: 'https://www.tensor.trade/', logo: 'tensor', accent: 'cyan' },
  { name: 'Mint on LaunchMyNFT', url: 'https://www.launchmynft.io/mint/sweetardio', logo: 'launchmynft', accent: 'cerise' },
];

const LinkButton = ({ item }: { item: LinkItem }) => {
  const a = ACCENT[item.accent];
  let host = '';
  try {
    host = new URL(item.url).hostname;
  } catch {
    /* noop */
  }
  const favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-3 border border-white/10 bg-sweetardios-oxford/60 px-5 py-4 transition-all hover:-translate-y-0.5 ${a.border}`}
    >
      {/* Logo: prefer a dropped /logos/<name>.png, fall back to the site favicon, then hide */}
      <img
        src={`/logos/${item.logo}.png`}
        alt=""
        className="h-8 w-8 shrink-0 object-contain"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img.dataset.fb !== '1') {
            img.dataset.fb = '1';
            img.src = favicon;
          } else {
            img.style.display = 'none';
          }
        }}
      />
      <span className={`font-bold text-white transition-colors ${a.hoverText}`}>{item.name}</span>
      <span className={`ml-auto ${a.text}`}>↗</span>
    </a>
  );
};

const GetStarted = () => (
  <section id="links" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
    <header className="mb-12 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">The Ecosystem</p>
      <h2 className="font-heading mt-2 text-4xl text-white sm:text-5xl">Links</h2>
    </header>

    {/* Marketplaces */}
    <div>
      <h3 className="mb-5 text-center text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cerise">
        Marketplaces · Grab a Sweetardio
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MARKETPLACES.map((m) => <LinkButton key={m.name} item={m} />)}
      </div>
    </div>
  </section>
);

export default GetStarted;
