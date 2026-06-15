import { Link } from 'react-router-dom';
import Character from './Character';

/* ── Decorative data ───────────────────────────────────────── */

// Palette-matched characters floating in the hero backdrop
const FLOATERS = [
  { n: 'cyan_gummy_bear', top: 15, left: 6, s: 8.5, d: 0, dur: 7.5 },
  { n: 'purple_gummy_bear', top: 18, left: 86, s: 7.5, d: 1.2, dur: 8.5 },
  { n: 'rainbow_sherbert_ice_cream', top: 60, left: 7, s: 8, d: 0.6, dur: 9.5 },
  { n: 'pink_gummy_bear', top: 66, left: 85, s: 7.5, d: 2.0, dur: 7.8 },
  { n: 'zaffre_sherbert_ice_cream', top: 78, left: 31, s: 7, d: 0.9, dur: 8.8 },
  { n: 'cyan_frosted_poptart', top: 40, left: 92, s: 6.5, d: 1.6, dur: 10 },
];

const TICKER = ['Slots', 'Junk Pusher', 'Sweetardios', 'Free to Play', 'On-Chain', 'Gorbagana', 'Bonus Rounds', 'Leaderboards'];

const FEATURES = [
  { icon: '🎮', title: 'Free to Play', desc: 'Jump in and play for fun — no tokens needed right now.' },
  { icon: '🏆', title: 'Live Leaderboards', desc: 'Climb the ranks and flex your high scores.' },
  { icon: '🍬', title: 'Sweetardios Cast', desc: 'Starring characters from the Sweetardios collection.' },
  { icon: '⚡', title: 'Instant & Snappy', desc: 'Fast arcade gameplay, built on Gorbagana.' },
];

// "Meet the cast" strip
const CAST = [
  { file: 'rainbow_sherbert_ice_cream', name: 'Rainbow Rush', rarity: 'Legendary', accent: 'text-sweetardios-cyan' },
  { file: 'cyan_gummy_bear', name: 'Bear Market', rarity: 'Epic', accent: 'text-sweetardios-cerise' },
  { file: 'neapolitan_ice_cream', name: 'Choppa Cone', rarity: 'Epic', accent: 'text-sweetardios-cerise' },
  { file: 'purple_gummy_bear', name: 'Grape Goon', rarity: 'Rare', accent: 'text-sweetardios-violet' },
  { file: 'churro', name: 'Twisty', rarity: 'Uncommon', accent: 'text-white/60' },
];

const REEL = ['🍒', '🍩', '🍫', '🍬', '7️⃣', '🍭'];

/* ── Mini card visuals ─────────────────────────────────────── */

const ReelVisual = () => (
  <div className="flex gap-1.5 border border-sweetardios-cerise/30 bg-sweetardios-oxford/80 p-1.5 shadow-inner">
    {[0, 1, 2].map((c) => (
      <div key={c} className="h-14 w-10 overflow-hidden">
        <div className="sw-reel-track flex flex-col" style={{ animationDelay: `${c * 0.25}s`, animationDuration: `${3 + c}s` }}>
          {[...REEL, ...REEL].map((e, i) => (
            <span key={i} className="flex h-14 w-10 shrink-0 items-center justify-center text-2xl">{e}</span>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const CoinVisual = () => (
  <div className="relative h-14 w-24 overflow-hidden border border-sweetardios-cyan/30 bg-sweetardios-oxford/80">
    {[0, 1, 2, 3].map((i) => (
      <span key={i} className="sw-drop absolute text-xl" style={{ left: `${8 + i * 22}%`, animationDelay: `${i * 0.6}s`, animationDuration: `${2.4 + (i % 2) * 0.6}s` }}>🪙</span>
    ))}
    <div className="absolute inset-x-0 bottom-0 h-2 bg-sweetardios-cyan/40" />
  </div>
);

/* ── Game card ─────────────────────────────────────────────── */

interface GameCardProps {
  to: string;
  variant: 'slots' | 'pusher';
  kicker: string;
  title: string;
  blurb: string;
  features: string[];
  character: string;
}

const GameCard = ({ to, variant, kicker, title, blurb, features, character }: GameCardProps) => {
  const isSlots = variant === 'slots';
  const accentText = isSlots ? 'text-sweetardios-cerise' : 'text-sweetardios-cyan';
  const glow = isSlots ? 'sw-glow-cerise' : 'sw-glow-cyan';
  const grad = isSlots
    ? 'from-sweetardios-cerise/70 via-sweetardios-violet/40 to-sweetardios-cyan/30'
    : 'from-sweetardios-cyan/70 via-sweetardios-violet/40 to-sweetardios-cerise/30';
  const hoverShadow = isSlots
    ? 'hover:shadow-[0_24px_70px_-20px_rgba(247,21,171,0.65)]'
    : 'hover:shadow-[0_24px_70px_-20px_rgba(52,237,243,0.6)]';
  const btn = isSlots ? 'bg-sweetardios-cerise' : 'bg-sweetardios-cyan';

  return (
    <Link
      to={to}
      className={`group relative block bg-gradient-to-br ${grad} p-px transition-all duration-300 hover:-translate-y-1.5 ${hoverShadow}`}
    >
      <div className="relative h-full overflow-hidden bg-[#080f33]/95 p-7 backdrop-blur">
        {/* character watermark */}
        <Character
          name={character}
          face={false}
          className="pointer-events-none absolute -right-7 bottom-0 h-44 w-44 opacity-[0.16] transition-transform duration-500 group-hover:scale-110 sm:h-52 sm:w-52"
        />

        <div className="relative mb-6 flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.25em] ${accentText}`}>{kicker}</p>
            <h3 className={`font-heading mt-1 text-3xl text-white ${glow}`}>{title}</h3>
          </div>
          {isSlots ? <ReelVisual /> : <CoinVisual />}
        </div>

        <p className="relative text-sm leading-relaxed text-blue-100/70">{blurb}</p>

        <ul className="relative mt-5 flex flex-wrap gap-2">
          {features.map((f) => (
            <li key={f} className={`border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${accentText}`}>{f}</li>
          ))}
        </ul>

        <div className="relative mt-7 flex items-center gap-3">
          <span className={`sw-shine inline-flex items-center gap-2 ${btn} px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford`}>
            Play free <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

/* ── Landing page ──────────────────────────────────────────── */

const Landing = () => (
  <div className="relative text-white">
    {/* Animated background layers */}
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="sw-aurora absolute inset-0 opacity-90" />
      <div className="sw-scanlines absolute inset-0 opacity-50" />
      <div className="sw-blob absolute -left-20 top-10 h-72 w-72" style={{ background: '#F715AB' }} />
      <div className="sw-blob absolute right-0 top-1/3 h-80 w-80" style={{ background: '#34EDF3' }} />
      <div className="sw-blob absolute bottom-10 left-1/3 h-72 w-72" style={{ background: '#9201CB' }} />
      {FLOATERS.map((f, i) => (
        <div
          key={i}
          className="sw-float absolute"
          style={{ top: `${f.top}%`, left: `${f.left}%`, width: `${f.s}rem`, height: `${f.s}rem`, animationDelay: `${f.d}s`, animationDuration: `${f.dur}s` }}
        >
          <Character name={f.n} className="h-full w-full opacity-90 drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]" />
        </div>
      ))}
    </div>

    {/* HERO */}
    <section className="relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-6 text-center">
      <div className="sw-rise relative mb-4 flex justify-center">
        <div aria-hidden className="sw-blob absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2" style={{ background: '#F715AB', opacity: 0.45 }} />
        <img src="/sweetardios-logo.svg" alt="Sweetardios logo" className="sw-float relative h-36 w-36 drop-shadow-[0_12px_30px_rgba(52,237,243,0.45)] sm:h-44 sm:w-44" />
      </div>

      <span className="sw-rise mb-6 inline-flex items-center gap-2 border border-sweetardios-cyan/40 bg-sweetardios-oxford/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-sweetardios-cyan backdrop-blur">
        <span className="sw-twinkle">✦</span> Free to play · powered by Sweetardios <span className="sw-twinkle">✦</span>
      </span>

      <h1 className="sw-rise font-heading text-6xl leading-none sm:text-8xl" style={{ animationDelay: '0.05s' }}>
        <span className="sw-flicker sw-glow-cerise">SWEET</span>
        <span className="sw-glow-cyan">ARDED</span>
      </h1>
      <div className="sw-rise sw-gradient-text font-heading mt-2 text-3xl tracking-[0.5em] sm:text-5xl" style={{ animationDelay: '0.12s' }}>
        GAMES
      </div>

      <p className="sw-rise mt-6 max-w-xl text-base text-blue-100/70 sm:text-lg" style={{ animationDelay: '0.18s' }}>
        A sugar-coated arcade starring the <span className="font-semibold text-sweetardios-cerise">Sweetardios</span> cast.
        Two games, free to play, endless degenerate fun.
      </p>

      <div className="sw-rise mt-9 flex flex-col items-center gap-4 sm:flex-row" style={{ animationDelay: '0.24s' }}>
        <Link to="/slots" className="sw-shine group inline-flex items-center gap-2 bg-sweetardios-cerise px-8 py-3.5 text-base font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_40px_-4px_rgba(247,21,171,0.85)]">
          🎰 Play Slots <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
        <Link to="/junk-pusher" className="sw-shine group inline-flex items-center gap-2 bg-sweetardios-cyan px-8 py-3.5 text-base font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_40px_-4px_rgba(52,237,243,0.85)]">
          🪙 Play Junk Pusher <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      <a href="#games" aria-label="Scroll to games" className="sw-rise absolute bottom-6 left-1/2 -translate-x-1/2 text-sweetardios-cyan/70 transition-colors hover:text-sweetardios-cyan" style={{ animationDelay: '0.4s' }}>
        <span className="block animate-bounce text-2xl">↓</span>
      </a>
    </section>

    {/* TICKER */}
    <div className="relative overflow-hidden border-y border-sweetardios-violet/40 bg-sweetardios-oxford/70 py-3 backdrop-blur">
      <div className="sw-marquee-track flex w-max whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex items-center" aria-hidden={k === 1}>
            {TICKER.map((t, i) => (
              <span key={i} className="mx-6 text-sm font-bold uppercase tracking-widest text-blue-100/80">
                <span className="text-sweetardios-cerise">★</span> {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>

    {/* GAMES */}
    <section id="games" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <header className="mb-12 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">The Arcade</p>
        <h2 className="font-heading mt-2 text-4xl text-white sm:text-5xl">Pick your poison</h2>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <GameCard
          to="/slots"
          variant="slots"
          kicker="Reels of riches"
          title="Slots"
          blurb="Spin sugar-coated reels packed with Sweetardio symbols. Land combos, trigger the bonus round, and climb the leaderboard."
          features={['Bonus rounds', 'Free to play', 'Live leaderboard']}
          character="neapolitan_ice_cream"
        />
        <GameCard
          to="/junk-pusher"
          variant="pusher"
          kicker="Drop · push · win"
          title="Junk Pusher"
          blurb="Rain candy tokens into the machine, stack the pile high, and shove the jackpot over the edge. Real physics, real chaos."
          features={['Real physics', 'Free to play', 'High scores']}
          character="cyan_gummy_bear"
        />
      </div>
    </section>

    {/* MEET THE CAST */}
    <section className="relative mx-auto max-w-6xl px-6 pb-6 sm:pb-10">
      <header className="mb-10 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cerise">The Sweetardios</p>
        <h2 className="font-heading mt-2 text-4xl text-white sm:text-5xl">Meet the cast</h2>
      </header>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {CAST.map((c) => (
          <div key={c.name} className="group flex flex-col items-center border border-white/10 bg-white/[0.03] p-5 transition-all hover:-translate-y-1 hover:border-sweetardios-cerise/40 hover:bg-white/[0.05]">
            <div className="h-28 w-28 transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-32">
              <Character name={c.file} className="h-full w-full drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="font-heading mt-3 text-base text-white">{c.name}</div>
            <div className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${c.accent}`}>{c.rarity}</div>
          </div>
        ))}
      </div>
    </section>

    {/* FEATURES */}
    <section className="relative mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="group border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-sweetardios-cyan/50 hover:bg-white/[0.05]">
            <div className="text-3xl transition-transform group-hover:scale-110">{f.icon}</div>
            <h4 className="font-heading mt-3 text-lg text-white">{f.title}</h4>
            <p className="mt-1.5 text-sm text-blue-100/60">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* FOOTER */}
    <footer className="relative border-t border-white/10 bg-sweetardios-oxford/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="font-heading text-xl">
          <span className="sw-glow-cerise text-sweetardios-cerise">SWEET</span>
          <span className="sw-glow-cyan text-sweetardios-cyan">ARDED</span>
          <span className="ml-2 align-middle text-xs font-normal uppercase tracking-widest text-white/40">Games</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-blue-100/70">
          <Link to="/slots" className="transition-colors hover:text-sweetardios-cerise">Slots</Link>
          <Link to="/junk-pusher" className="transition-colors hover:text-sweetardios-cyan">Junk Pusher</Link>
        </div>
        <p className="text-xs text-white/40">© Sweetardios · Built on Gorbagana</p>
      </div>
    </footer>
  </div>
);

export default Landing;
