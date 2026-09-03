import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading';
import { RARITY_CATEGORIES, SUPPLY } from '../content/rarity';

/* ── Rarity teaser — the headline odds, with the full table one click away ──
   Shows the scarcest thing in each of a few categories rather than a chart:
   at this size the numbers are the story, so they get stat-tile treatment. */

const HEADLINES = [
  { id: 'secret-rarez', label: 'The 1/1 tier', blurb: 'Guest-artist artwork minted as the whole token.' },
  { id: 'trait-count', label: 'Nine traits', blurb: 'The fullest tokens in the mint.', name: 'Every slot filled' },
  { id: 'weather', label: 'Animated', blurb: 'Weather tokens carry a video loop.' },
  { id: 'backgrounds', label: 'Scarcest plate', blurb: 'The rarest thing to stand in front of.' },
];

const RarityTeaser = () => {
  const cards = HEADLINES.map((h) => {
    const cat = RARITY_CATEGORIES.find((c) => c.id === h.id);
    const rarest = cat?.rows[0];
    return { ...h, rarest, category: cat?.label };
  }).filter((c) => c.rarest);

  return (
    <section id="rarity" aria-label="Collection rarity" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <SectionHeading
        eyebrow="The Odds"
        title="Some of them barely exist"
        sub={`All ${SUPPLY.toLocaleString()} tokens, every trait counted from the mint itself.`}
        accent="cerise"
      />

      <div className="sw-reveal grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div
            key={c.id}
            className="sw-lightbar group border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-sweetardios-cerise/50 hover:bg-white/[0.05]"
            style={{ '--rv-i': i } as React.CSSProperties}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sweetardios-cyan/80">{c.label}</p>
            <p className="font-heading mt-3 text-4xl text-white">
              1 in {Math.round(SUPPLY / c.rarest!.count).toLocaleString()}
            </p>
            <p className="mt-2 truncate text-[12px] font-bold text-sweetardios-cerise" title={c.name ?? c.rarest!.name}>
              {c.name ?? c.rarest!.name}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-blue-100/55">{c.blurb}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/rarity"
          className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-6 py-3 text-xs font-extrabold uppercase tracking-wide text-blue-100/80 transition-colors hover:border-sweetardios-cerise/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
        >
          Open the rarity vault <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
};

export default RarityTeaser;
