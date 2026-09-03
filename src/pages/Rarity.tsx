import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RARITY_CATEGORIES, SUPPLY, COMPOSITED, type RarityCategory } from '../content/rarity';
import { ARTIST_RARES, rareSrc } from '../content/artistRares';
import RarityShowcase from '../components/rarity/RarityShowcase';
import { useAmbient } from '../motion/useAmbient';

/* ── Chart colors ───────────────────────────────────────────────────
   One series (share of the mint), so this is the emphasis form: the
   scarcest rows wear the brand accent, everything else recedes. Both
   steps were checked against the #080f33 chart surface — the pair keeps
   CVD separation (ΔE 11.2 protan), and because the recessive step sits
   under 3:1 on its own, every row carries its count and share as text
   rather than leaving the bar to say it. */
const ACCENT = '#F715AB';
const RECESSIVE = '#3B4A7A';

/** Everything at or below this count is rare enough for the vault ladder. */
const VAULT_CEILING = 30;
/** Long categories (backgrounds) open on the scarcest few rather than all 64. */
const COLLAPSE_OVER = 16;
const COLLAPSED_ROWS = 12;

const pct = (n: number) => `${n.toFixed(2)}%`;
const oneInSupply = (count: number) => Math.round(SUPPLY / count);

/* ── Bar row — the bar and its value labels are one unit ─────────── */

interface BarRowProps {
  name: string;
  count: number;
  share: number;
  max: number;
  emphasis: boolean;
  tier?: string;
}

const BarRow = ({ name, count, share, max, emphasis, tier }: BarRowProps) => (
  <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1.5 py-2 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]">
    <span
      className={`truncate text-[13px] ${emphasis ? 'font-bold text-white' : 'text-blue-100/75'}`}
      title={name}
    >
      {name}
      {tier && (
        <span className="ml-2 align-middle text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100/40">
          {tier}
        </span>
      )}
    </span>

    {/* Track + fill. Square ends match the site's zero-radius system. */}
    <span className="order-3 col-span-2 block h-2 w-full bg-white/[0.06] sm:order-none sm:col-span-1">
      <span
        className="block h-full transition-[width] duration-500"
        style={{ width: `${Math.max((share / max) * 100, 1.5)}%`, background: emphasis ? ACCENT : RECESSIVE }}
      />
    </span>

    <span className="text-right text-[12px] tabular-nums text-blue-100/60">
      <span className={emphasis ? 'font-bold text-white' : 'text-blue-100/85'}>{count.toLocaleString()}</span>
      <span className="ml-2 text-blue-100/45">{pct(share)}</span>
    </span>
  </li>
);

/* ── Stat tile ──────────────────────────────────────────────────── */

const Stat = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/45">{label}</p>
    <p className="mt-1.5 text-2xl text-white">{value}</p>
    <p className="mt-0.5 text-[11px] text-blue-100/50">{sub}</p>
  </div>
);

/* ── The Rarity Vault ───────────────────────────────────────────── */

export default function RarityPage() {
  useAmbient();
  const [activeId, setActiveId] = useState(RARITY_CATEGORIES[0].id);
  const [showAll, setShowAll] = useState(false);
  const active = RARITY_CATEGORIES.find((c) => c.id === activeId) as RarityCategory;

  const selectCategory = (id: string) => {
    setActiveId(id);
    setShowAll(false);
  };

  /* Everything scarce enough for the vault, ranked across every category.
     Plate Tier is left out: it restates the background rather than adding
     a trait of its own. */
  const vault = useMemo(
    () =>
      RARITY_CATEGORIES.filter((c) => c.id !== 'plate-tier')
        .flatMap((c) => c.rows.filter((r) => r.count <= VAULT_CEILING).map((r) => ({ ...r, category: c.label })))
        .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name)),
    []
  );

  const maxShare = Math.max(...active.rows.map((r) => r.share));
  const minCount = Math.min(...active.rows.map((r) => r.count));
  const collapsible = active.rows.length > COLLAPSE_OVER;
  const visibleRows = collapsible && !showAll ? active.rows.slice(0, COLLAPSED_ROWS) : active.rows;
  const denominator = active.scale === 'all' ? SUPPLY : COMPOSITED;
  const weather = RARITY_CATEGORIES.find((c) => c.id === 'weather');
  const arms = RARITY_CATEGORIES.find((c) => c.id === 'arms');
  const backgrounds = RARITY_CATEGORIES.find((c) => c.id === 'backgrounds');
  const characters = RARITY_CATEGORIES.find((c) => c.id === 'characters');

  return (
    <div className="relative min-h-[calc(100vh-var(--navbar-height,56px))] text-white">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/games-bg.png)' }} />
        <div className="absolute inset-0 bg-sweetardios-oxford/85" />
        <div className="sw-scanlines absolute inset-0 opacity-[0.1]" />
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <header className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">Sweetardio Collection</p>
          <h1 className="font-heading mt-1 text-5xl sm:text-6xl">
            <span className="sw-glow-cerise text-sweetardios-cerise">Rarity</span>{' '}
            <span className="sw-glow-cyan text-sweetardios-cyan">Vault</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-blue-100/70">
            Every trait in the mint, counted. Read straight from the token metadata — no estimates, no rounding up.
          </p>
        </header>

        {/* Hero figure + headline stats */}
        <div className="mt-14 grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12">
          <div className="text-center lg:text-left">
            <p className="font-heading text-7xl leading-none text-white sm:text-8xl">
              {SUPPLY.toLocaleString()}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.28em] text-sweetardios-cerise">
              Tokens in the mint
            </p>
            <p className="mt-1 text-[11px] text-blue-100/45">
              {COMPOSITED.toLocaleString()} composited · 2 one-of-ones
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="1/1 Secret Rarez" value="2" sub={`1 in ${oneInSupply(1).toLocaleString()} each`} />
            <Stat
              label="Animated"
              value={weather ? weather.carried!.count.toLocaleString() : '—'}
              sub={weather ? `${weather.carried!.share}% carry weather` : ''}
            />
            <Stat
              label="Armed"
              value={arms ? arms.carried!.count.toLocaleString() : '—'}
              sub={arms ? `${arms.carried!.share}% hold something` : ''}
            />
            <Stat
              label="Characters"
              value={characters ? String(characters.rows.length) : '—'}
              sub={backgrounds ? `${backgrounds.rows.length} backgrounds` : ''}
            />
          </div>
        </div>

        {/* ── THE VAULT — the scarcest traits in the collection ── */}
        <div className="mt-20">
          <header className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-3xl text-white sm:text-4xl">The Vault</h2>
              <p className="mt-1.5 text-sm text-blue-100/60">
                Every trait with {VAULT_CEILING} or fewer across all {SUPPLY.toLocaleString()} tokens, rarest first.
              </p>
            </div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/40">
              {vault.length} traits · odds out of {SUPPLY.toLocaleString()}
            </p>
          </header>

          <ol className="mt-2 divide-y divide-white/5">
            {vault.map((r, i) => (
              <li
                key={`${r.category}-${r.name}`}
                className="sw-rise grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 py-3"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}
              >
                <span className="text-[11px] tabular-nums text-blue-100/35">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-white" title={r.name}>
                    {r.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sweetardios-cyan/70">
                    {r.category}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-bold tabular-nums text-sweetardios-cerise">
                    1 in {oneInSupply(r.count).toLocaleString()}
                  </span>
                  <span className="text-[11px] tabular-nums text-blue-100/45">
                    {r.count.toLocaleString()} of {SUPPLY.toLocaleString()}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── SEE IT — the scarce traits as art ── */}
        <RarityShowcase />

        {/* ── TRAIT EXPLORER ── */}
        <div className="mt-20">
          <header className="border-b border-white/10 pb-4">
            <h2 className="font-heading text-3xl text-white sm:text-4xl">Every trait, counted</h2>
            <p className="mt-1.5 text-sm text-blue-100/60">
              Pick a category. Bars run rarest first; the scarcest in each category is lit.
            </p>
          </header>

          {/* One filter row, above everything it scopes */}
          <div className="mt-5 flex flex-wrap gap-2">
            {RARITY_CATEGORIES.map((c) => {
              const on = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCategory(c.id)}
                  aria-pressed={on}
                  className={`border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan ${
                    on
                      ? 'border-sweetardios-cerise/70 bg-sweetardios-cerise/15 text-white'
                      : 'border-white/12 bg-white/[0.03] text-blue-100/60 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {c.label}
                  <span className="ml-2 tabular-nums text-blue-100/40">{c.rows.length}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 border border-white/10 bg-[#080f33]/80 px-5 py-6 backdrop-blur-sm sm:px-8 sm:py-7">
            <p className="max-w-2xl text-sm leading-relaxed text-blue-100/70">{active.note}</p>

            <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-blue-100/40">
              {active.carried ? (
                <>
                  {active.carried.count.toLocaleString()} of {SUPPLY.toLocaleString()} tokens carry this trait (
                  {active.carried.share}%) · shares are of all {SUPPLY.toLocaleString()}
                </>
              ) : (
                <>Shares are of the {denominator.toLocaleString()} composited tokens</>
              )}
            </p>

            <ul className="mt-5 divide-y divide-white/5">
              {visibleRows.map((r) => (
                <BarRow
                  key={r.name}
                  name={r.name}
                  count={r.count}
                  share={r.share}
                  max={maxShare}
                  emphasis={r.count === minCount}
                  tier={r.tier}
                />
              ))}
            </ul>

            {collapsible && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-5 w-full border border-white/12 bg-white/[0.03] py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100/65 transition-colors hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
              >
                {showAll
                  ? 'Show the scarcest only'
                  : `Show all ${active.rows.length} ${active.label.toLowerCase()} →`}
              </button>
            )}
          </div>
        </div>

        {/* ── THE 1/1s ── */}
        <div className="mt-20">
          <header className="border-b border-white/10 pb-4">
            <h2 className="font-heading text-3xl text-white sm:text-4xl">The one-of-ones</h2>
            <p className="mt-1.5 text-sm text-blue-100/60">
              Guest-artist artwork minted as the whole token — no character, no plate, nothing composited over it.
              One of each exists.
            </p>
          </header>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {ARTIST_RARES.map((rare) => (
              <article
                key={rare.file}
                className={`group bg-gradient-to-br p-px ${
                  rare.accent === 'cerise'
                    ? 'from-sweetardios-cerise/70 via-sweetardios-violet/40 to-sweetardios-cyan/30'
                    : 'from-sweetardios-cyan/70 via-sweetardios-violet/40 to-sweetardios-cerise/30'
                }`}
              >
                <div className="flex h-full flex-col bg-[#080f33]/95">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={rareSrc(rare)}
                      alt={`${rare.title} by ${rare.artist}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-3 top-3 border border-white/15 bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                      1 of {SUPPLY.toLocaleString()} · 0.02%
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-2xl text-white">{rare.title}</h3>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sweetardios-cyan/80">
                      {rare.artist}
                    </p>
                    {rare.note && <p className="mt-3 text-sm leading-relaxed text-blue-100/65">{rare.note}</p>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/mint"
            className="sw-shine inline-flex items-center gap-2 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford"
            style={{ background: ACCENT }}
          >
            Pull one from the machine <span aria-hidden>→</span>
          </Link>
          <p className="mt-4 text-[11px] text-blue-100/40">
            Counts read from the shipped token metadata of the {SUPPLY.toLocaleString()}-token mint.
          </p>
        </div>
      </section>
    </div>
  );
}
