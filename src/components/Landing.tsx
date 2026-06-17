import { Link } from 'react-router-dom';
import GetStarted from './GetStarted';

const TICKER = ['Slots', 'Coinpusher', 'Sweetardios', 'Free to Play', 'On-Chain', 'Cookie Chain', 'Bonus Rounds', 'Leaderboards'];

const FEATURES = [
  { icon: '🎮', title: 'Free to Play', desc: 'Jump in and play for fun — no tokens needed right now.' },
  { icon: '🏆', title: 'Live Leaderboards', desc: 'Climb the ranks and flex your high scores.' },
  { icon: '🍬', title: 'Sweetardios Cast', desc: 'Stickers and characters from the Sweetardios collection.' },
  { icon: '⚡', title: 'Instant & Snappy', desc: 'Fast arcade gameplay, built for the Cookie Chain.' },
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
}

const GameCard = ({ to, variant, kicker, title, blurb, features }: GameCardProps) => {
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

        <div className="relative mt-7">
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
    {/* Background: Sweetardio shop scene + Oxford tint */}
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/games-bg.png)' }}
      />
      <div className="absolute inset-0 bg-sweetardios-oxford/60" />
      <div className="sw-scanlines absolute inset-0 opacity-[0.1]" />
    </div>

    {/* HERO */}
    <section className="relative flex min-h-[calc(100vh-56px)] items-center justify-center overflow-hidden px-6 py-16">
      {/* cinematic vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(125% 95% at 50% 22%, transparent 38%, rgba(7,15,52,0.55) 76%, rgba(7,15,52,0.92) 100%)' }}
      />

      {/* gradient-bordered glass panel */}
      <div className="relative z-10 w-full max-w-3xl bg-gradient-to-br from-sweetardios-cerise/50 via-sweetardios-violet/25 to-sweetardios-cyan/50 p-px shadow-[0_50px_140px_-40px_rgba(0,0,0,0.95)]">
        <div className="relative flex flex-col items-center overflow-hidden bg-sweetardios-oxford/80 px-8 py-12 text-center backdrop-blur-2xl sm:px-16 sm:py-16">
          {/* top edge highlight */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="sw-rise relative mb-7 flex justify-center">
            <div aria-hidden className="sw-blob absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2" style={{ background: '#F715AB', opacity: 0.38 }} />
            <img src="/sweetardios-logo.svg" alt="Sweetardios" className="sw-float relative h-32 w-32 drop-shadow-[0_16px_40px_rgba(52,237,243,0.4)] sm:h-40 sm:w-40" />
          </div>

          <span className="sw-rise mb-7 inline-flex items-center gap-2.5 border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-blue-100/75 backdrop-blur">
            <span className="h-1.5 w-1.5 bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]" style={{ borderRadius: '9999px' }} /> Free to Play · Powered by Sweetardios
          </span>

          <h1 className="sw-rise font-heading text-6xl leading-[0.92] sm:text-8xl" style={{ animationDelay: '0.05s' }}>
            <span className="sw-glow-cerise">SWEET</span><span className="sw-glow-cyan">ARDIO</span>
          </h1>
          <div className="sw-rise sw-gradient-text font-heading mt-3 text-3xl tracking-[0.5em] sm:text-5xl" style={{ animationDelay: '0.12s' }}>
            .FUN
          </div>

          <p className="sw-rise mt-7 max-w-md text-base leading-relaxed text-blue-100/70 sm:text-lg" style={{ animationDelay: '0.18s' }}>
            A sugar-coated arcade starring the <span className="font-semibold text-white">Sweetardios</span>. Two games, free to play.
          </p>

          <div className="sw-rise mt-10 flex w-full flex-col items-center gap-3.5 sm:w-auto sm:flex-row" style={{ animationDelay: '0.24s' }}>
            <Link to="/slots" className="sw-shine group inline-flex w-full items-center justify-center gap-2 bg-gradient-to-r from-[#ff5cc8] to-[#d40d8f] px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_12px_34px_-10px_rgba(247,21,171,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_-10px_rgba(247,21,171,0.95)] sm:w-auto">
              🎰 Play Slots <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link to="/coinpusher" className="sw-shine group inline-flex w-full items-center justify-center gap-2 bg-gradient-to-r from-[#6ef4f9] to-[#1fc6d4] px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-sweetardios-oxford shadow-[0_12px_34px_-10px_rgba(52,237,243,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_-10px_rgba(52,237,243,0.9)] sm:w-auto">
              🪙 Play Coinpusher <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>

      <a href="#games" aria-label="Scroll to games" className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/35 transition-colors hover:text-white">
        <span className="block animate-bounce text-xl">↓</span>
      </a>
    </section>

    {/* TICKER */}
    <div className="relative overflow-hidden border-y border-white/10 bg-sweetardios-oxford/60 py-3 backdrop-blur">
      <div className="sw-marquee-track flex w-max whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex items-center" aria-hidden={k === 1}>
            {TICKER.map((t, i) => (
              <span key={i} className="mx-5 text-xs font-semibold uppercase tracking-[0.28em] text-blue-100/55">
                <span className="text-sweetardios-cerise/70">◆</span> {t}
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
        />
        <GameCard
          to="/coinpusher"
          variant="pusher"
          kicker="Drop · push · win"
          title="Coinpusher"
          blurb="Rain candy tokens into the machine, stack the pile high, and shove the jackpot over the edge. Real physics, real chaos."
          features={['Real physics', 'Free to play', 'High scores']}
        />
      </div>
    </section>

    {/* ECOSYSTEM / MARKETPLACE LINKS */}
    <GetStarted />

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
          <span className="sw-glow-cyan text-sweetardios-cyan">ARDIO</span>
          <span className="ml-2 align-middle text-xs font-normal uppercase tracking-widest text-white/40">.fun</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-blue-100/70">
          <Link to="/slots" className="transition-colors hover:text-sweetardios-cerise">Slots</Link>
          <Link to="/coinpusher" className="transition-colors hover:text-sweetardios-cyan">Coinpusher</Link>
        </div>
        <p className="text-xs text-white/40">© Sweetardios · Cookie Chain</p>
      </div>
    </footer>
  </div>
);

export default Landing;
