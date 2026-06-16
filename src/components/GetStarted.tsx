import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

/* Foreground accents only — sits on the Oxford-blue background. */
const ACCENT = {
  cerise: {
    text: 'text-sweetardios-cerise',
    hoverText: 'group-hover:text-sweetardios-cerise',
    border: 'hover:border-sweetardios-cerise/60',
    num: 'bg-sweetardios-cerise',
  },
  cyan: {
    text: 'text-sweetardios-cyan',
    hoverText: 'group-hover:text-sweetardios-cyan',
    border: 'hover:border-sweetardios-cyan/60',
    num: 'bg-sweetardios-cyan',
  },
} as const;
type Accent = keyof typeof ACCENT;

const STEPS: { n: number; icon: string; title: string; desc: string; accent: Accent }[] = [
  { n: 1, icon: '👛', title: 'Get a Solana wallet', desc: 'Grab Phantom, Backpack or Solflare, then connect it.', accent: 'cerise' },
  { n: 2, icon: '🍬', title: 'Grab a Sweetardio', desc: 'Mint or buy one on the marketplaces below (on Solana).', accent: 'cyan' },
  { n: 3, icon: '🌉', title: 'Bridge to Cookie Chain', desc: 'Move from Solana over to the Cookie Chain.', accent: 'cerise' },
  { n: 4, icon: '🎮', title: 'Play free', desc: 'Dive into Slots & Coinpusher — free for fun.', accent: 'cyan' },
];

interface LinkItem { name: string; url: string; logo: string; accent: Accent }

// Solana NFT marketplaces
const MARKETPLACES: LinkItem[] = [
  { name: 'Magic Eden', url: 'https://magiceden.io/', logo: 'magiceden', accent: 'cerise' },
  { name: 'Tensor', url: 'https://www.tensor.trade/', logo: 'tensor', accent: 'cyan' },
  { name: 'LaunchMyNFT', url: 'https://launchmynft.io/', logo: 'launchmynft', accent: 'cerise' },
];

// Cookie Chain ecosystem (extend with the full cookiechain.wtf list)
const ECOSYSTEM: LinkItem[] = [
  { name: 'Cookie Chain', url: 'https://www.cookiechain.wtf/', logo: 'cookiechain', accent: 'cyan' },
  { name: 'Cookiescan', url: 'https://cookiescan.io/', logo: 'cookiescan', accent: 'cerise' },
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
  <section id="start" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
    <header className="mb-12 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">New here?</p>
      <h2 className="font-heading mt-2 text-4xl text-white sm:text-5xl">Onboard from Solana</h2>
      <p className="mx-auto mt-4 max-w-xl text-blue-100/70">
        Four steps to go from a Solana wallet to playing on the{' '}
        <span className="font-semibold text-sweetardios-cerise">Cookie Chain</span>.
      </p>
    </header>

    {/* Steps */}
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s) => {
        const a = ACCENT[s.accent];
        return (
          <div key={s.n} className="relative border border-white/10 bg-sweetardios-oxford/50 p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-3xl">{s.icon}</span>
              <span className={`flex h-7 w-7 items-center justify-center text-sm font-extrabold text-sweetardios-oxford ${a.num}`}>{s.n}</span>
            </div>
            <h3 className={`font-heading text-lg text-white`}>{s.title}</h3>
            <p className="mt-1.5 text-sm text-blue-100/60">{s.desc}</p>
          </div>
        );
      })}
    </div>

    {/* Connect CTA */}
    <div className="mt-8 flex justify-center">
      <WalletMultiButton />
    </div>

    {/* Marketplaces */}
    <div className="mt-16">
      <h3 className="mb-5 text-center text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cerise">
        Get a Sweetardio · Solana marketplaces
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MARKETPLACES.map((m) => <LinkButton key={m.name} item={m} />)}
      </div>
    </div>

    {/* Ecosystem */}
    <div className="mt-10">
      <h3 className="mb-5 text-center text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">
        Cookie Chain ecosystem
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ECOSYSTEM.map((e) => <LinkButton key={e.name} item={e} />)}
      </div>
    </div>
  </section>
);

export default GetStarted;
