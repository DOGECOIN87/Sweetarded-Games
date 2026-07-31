import { COMMUNITY_LINKS, type LinkAccent, type SocialPlatform } from '../content/siteLinks';
import { SocialIcon } from './SocialIcon';
import SectionHeading from './SectionHeading';

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
interface LinkItem {
  name: string;
  url: string;
  logo?: string;
  icon?: SocialPlatform;
  accent: LinkAccent;
  /** Small caption under the name — e.g. "Official mint" / "Live at launch". */
  note?: string;
}

// Solana NFT marketplaces — the official mint leads; secondaries go live at
// launch. After launch, point ME/Tensor at the collection pages, e.g.
//   https://magiceden.io/marketplace/<collection-slug>
//   https://www.tensor.trade/trade/<collection-slug>
const MARKETPLACES: LinkItem[] = [
  { name: 'Mint on LaunchMyNFT', url: 'https://www.launchmynft.io/mint/sweetardio', logo: 'launchmynft', accent: 'cerise', note: 'Official mint' },
  { name: 'Magic Eden', url: 'https://magiceden.io/', logo: 'magiceden', accent: 'cyan', note: 'Secondary · live at launch' },
  { name: 'Tensor', url: 'https://www.tensor.trade/', logo: 'tensor', accent: 'cerise', note: 'Secondary · live at launch' },
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
      className={`group flex items-center gap-3 border border-white/10 bg-sweetardios-oxford/60 px-5 py-4 transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan ${a.border}`}
    >
      {item.icon ? (
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center border border-current ${a.text}`}
        >
          <SocialIcon platform={item.icon} className="h-5 w-5" />
        </span>
      ) : (
        /* Logo: prefer /logos/<name>.png, fall back to the site's favicon, then hide. */
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
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-bold text-white transition-colors ${a.hoverText}`}>{item.name}</span>
        {item.note && (
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100/45">{item.note}</span>
        )}
      </span>
      <span aria-hidden="true" className={`${a.text}`}>↗</span>
    </a>
  );
};

const GetStarted = () => (
  <section id="links" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
    <SectionHeading
      eyebrow="The Ecosystem"
      title="Verify, then ape"
      sub="The only official marketplaces and channels. Anything else wearing our face is a fake."
      accent="cyan"
    />

    {/* Marketplaces */}
    <div>
      <h3 className="mb-5 text-center text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cerise">
        Marketplaces · Grab a Sweetardio
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MARKETPLACES.map((m) => <LinkButton key={m.name} item={m} />)}
      </div>
    </div>

    {/* Official community channels */}
    <div className="mt-12">
      <h3 className="mb-5 text-center text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">
        Community · Join the Sweetardios
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COMMUNITY_LINKS.map((item) => <LinkButton key={item.name} item={item} />)}
      </div>
    </div>
  </section>
);

export default GetStarted;
