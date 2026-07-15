import { Link, useNavigate } from 'react-router-dom';
import GetStarted from './GetStarted';
import Lineage from './Lineage';
import MintSection from './MintSection';
import MusicFeature from './MusicFeature';
import NeonArrow, { ArrowColor, ArrowDir } from './scene/NeonArrow';
import { STICKERS, stickerSrc } from '../content/stickers';
import { COMMUNITY_LINKS } from '../content/siteLinks';
import { STARTING_CREDITS } from '../lib/credits';

const FEATURES: { icon: string; title: string; desc: string; to?: string }[] = [
  { icon: '🎮', title: 'Free to Play', desc: `Every player starts with ${STARTING_CREDITS.toLocaleString()} SWEET credits — off-chain, just for fun.` },
  { icon: '🏆', title: 'Live Leaderboards', desc: 'Net profit, biggest wins and coins pushed — tracked live, per player.', to: '/leaderboard' },
  { icon: '👛', title: 'Any Solana Wallet', desc: 'Phantom, Backpack, Nightly, Solflare and more — connect to save your rank.' },
  { icon: '🍬', title: 'Perks at Mint', desc: 'Top players when the Sweetardios collection launches get rewarded.', to: '/leaderboard' },
];

/* ── Game card (real gameplay clip preview) ────────────────── */

interface GameCardProps {
  to: string;
  variant: 'slots' | 'pusher';
  kicker: string;
  title: string;
  blurb: string;
  features: string[];
  video: string;
  poster: string;
  arrowDir: 'left' | 'right';
  arrowColor: 'cerise' | 'cyan';
}

const GameCard = ({ to, variant, kicker, title, blurb, features, video, poster, arrowDir, arrowColor }: GameCardProps) => {
  const isSlots = variant === 'slots';
  const accentText = isSlots ? 'text-sweetardios-cerise' : 'text-sweetardios-cyan';
  const glow = isSlots ? 'sw-glow-cerise' : 'sw-glow-cyan';
  const grad = isSlots
    ? 'from-sweetardios-cerise/70 via-sweetardios-violet/40 to-sweetardios-cyan/30'
    : 'from-sweetardios-cyan/70 via-sweetardios-violet/40 to-sweetardios-cerise/30';
  const hoverShadow = isSlots
    ? 'hover:shadow-[0_24px_70px_-20px_rgba(247,21,171,0.65)]'
    : 'hover:shadow-[0_24px_70px_-20px_rgba(52,237,243,0.6)]';

  return (
    <Link
      to={to}
      className={`group relative block bg-gradient-to-br ${grad} p-px transition-all duration-300 hover:-translate-y-1.5 ${hoverShadow}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden bg-[#080f33]/95 backdrop-blur">
        {/* Real gameplay clip */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-sweetardios-oxford">
          <video
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            src={video}
            poster={poster}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={`${title} gameplay preview`}
          />
          {/* fade the clip into the card body */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#080f33] via-[#080f33]/40 to-transparent" />

          {/* live badge */}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 border border-white/15 bg-black/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse bg-red-500" style={{ borderRadius: '9999px' }} /> Live gameplay
          </span>

          {/* title overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${accentText}`}>{kicker}</p>
            <h3 className={`font-heading text-3xl text-white ${glow}`}>{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-7 pt-5">
          <p className="text-sm leading-relaxed text-blue-100/70">{blurb}</p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {features.map((f) => (
              <li key={f} className={`border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${accentText}`}>{f}</li>
            ))}
          </ul>

          <div className="mt-auto flex items-center justify-between pt-7">
            <span className="sw-shine inline-flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford" style={{
              background: isSlots ? '#F715AB' : '#34EDF3'
            }}>
              Walk up <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
            <div className="opacity-60 transition-opacity group-hover:opacity-100">
              <NeonArrow
                dir={arrowDir}
                label={`Go to ${title}`}
                color={arrowColor}
                size={56}
                onClick={() => {}}
                className="pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ── Hero navigation arrow (walks you into the arcade) ──────── */

interface HeroArrowProps {
  dir: ArrowDir;
  color: ArrowColor;
  caption: string;
  label: string;
  size: number;
  floor?: boolean;
  onClick: () => void;
}

const HeroArrow = ({ dir, color, caption, label, size, floor, onClick }: HeroArrowProps) => (
  <div className="flex flex-col items-center gap-2">
    <NeonArrow dir={dir} color={color} label={label} size={size} floor={floor} onClick={onClick} />
    <span
      className={`text-[10px] font-bold uppercase tracking-[0.22em] ${
        color === 'cyan' ? 'text-sweetardios-cyan' : 'text-sweetardios-cerise'
      }`}
    >
      {caption}
    </span>
  </div>
);

/* ── Landing page (now navigation hub) ──────────────────────── */

const Landing = () => {
  const navigate = useNavigate();

  return (
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
      <div className="relative z-10 w-full max-w-4xl bg-gradient-to-br from-sweetardios-cerise/50 via-sweetardios-violet/25 to-sweetardios-cyan/50 p-px shadow-[0_50px_140px_-40px_rgba(0,0,0,0.95)]">
        <div className="relative flex flex-col items-center overflow-hidden bg-sweetardios-oxford/80 px-8 py-12 text-center backdrop-blur-2xl sm:px-16 sm:py-16">
          {/* top edge highlight */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="sw-rise relative mb-7 flex justify-center">
            <div aria-hidden className="sw-blob absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2" style={{ background: '#F715AB', opacity: 0.38 }} />
            <img src="/logos/sweetardio-collection-badge-512.png" alt="Sweetardio Collection" className="sw-float relative h-32 w-32 drop-shadow-[0_16px_40px_rgba(52,237,243,0.4)] sm:h-40 sm:w-40" />
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

          <p className="sw-rise mt-4 text-xs uppercase tracking-[0.22em] text-sweetardios-cyan/70" style={{ animationDelay: '0.24s' }}>
            Follow the neon — pick your way in
          </p>

          {/* Navigation begins here: neon arrows walk you into the arcade */}
          <div className="sw-rise mt-8 flex items-end justify-center gap-8 sm:gap-14" style={{ animationDelay: '0.32s' }}>
            <HeroArrow
              dir="left"
              color="cerise"
              caption="Slots"
              label="Go to Slots"
              size={62}
              onClick={() => navigate('/arcade?to=slots')}
            />
            <HeroArrow
              dir="up"
              color="cerise"
              caption="Enter Arcade"
              label="Enter the Arcade"
              size={84}
              floor
              onClick={() => navigate('/arcade')}
            />
            <HeroArrow
              dir="right"
              color="cyan"
              caption="Coinpusher"
              label="Go to Coinpusher"
              size={62}
              onClick={() => navigate('/arcade?to=pusher')}
            />
          </div>
        </div>
      </div>
    </section>

    {/* STICKER STREAM — the sticker set drifts slowly across the page.
        Click anywhere on the stream to see them all; hovering pauses it. */}
    <Link
      to="/stickers"
      aria-label="See all Sweetardio stickers"
      className="sw-cast-stream group relative block overflow-hidden border-y border-white/10 bg-sweetardios-oxford/60 py-4 backdrop-blur"
    >
      <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-100/45 transition-colors group-hover:text-sweetardios-cerise">
        Stickers — see them all <span aria-hidden>→</span>
      </div>
      <div className="sw-marquee-track mt-4 flex w-max" style={{ animationDuration: '80s' }}>
        {[0, 1].map((k) => (
          <div key={k} className="flex items-end" aria-hidden={k === 1}>
            {STICKERS.map((c) => (
              <img
                key={c.file}
                src={stickerSrc(c)}
                alt={k === 0 ? c.name : ''}
                title={c.name}
                loading="lazy"
                className="mx-3 h-16 w-16 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:scale-125 sm:h-20 sm:w-20"
              />
            ))}
          </div>
        ))}
      </div>
    </Link>

    {/* HERITAGE — neochibi lineage story leading into the mint */}
    <Lineage />

    {/* UPCOMING MINT — LaunchMyNFT embed */}
    <MintSection />

    {/* GAMES — Clean Navigation Grid with Integrated Arrows */}
    <section className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <header className="mb-16 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">The Arcade</p>
        <h2 className="font-heading mt-2 text-4xl text-white sm:text-5xl">Pick your poison</h2>
        <p className="mt-3 text-sm text-blue-100/55">Step into the scene and walk up to a machine.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <GameCard
          to="/arcade?to=slots"
          variant="slots"
          kicker="Reels of riches"
          title="Slots"
          blurb="Spin sugar-coated reels packed with Sweetardio symbols. Land combos, trigger the bonus round, and climb the leaderboard."
          features={['Bonus rounds', 'Free to play', 'Live leaderboard']}
          video="/previews/slots.webm"
          poster="/previews/slots-poster.png"
          arrowDir="left"
          arrowColor="cerise"
        />
        <GameCard
          to="/arcade?to=pusher"
          variant="pusher"
          kicker="Drop · push · win"
          title="Coinpusher"
          blurb="Rain candy tokens into the machine, stack the pile high, and shove the jackpot over the edge. Real physics, real chaos."
          features={['Real physics', 'Free to play', 'High scores']}
          video="/previews/coinpusher.webm"
          poster="/previews/coinpusher-poster.png"
          arrowDir="right"
          arrowColor="cyan"
        />
      </div>
    </section>

    {/* HIGHLIGHTED MUSIC FEATURE — Audius player */}
    <MusicFeature />

    {/* ECOSYSTEM / MARKETPLACE LINKS */}
    <GetStarted />

    {/* LEADERBOARD / MINT PERKS CTA */}
    <section className="relative mx-auto max-w-6xl px-6 pb-4 pt-8">
      <div className="bg-gradient-to-br from-sweetardios-cyan/60 via-sweetardios-violet/30 to-sweetardios-cerise/60 p-px">
        <div className="flex flex-col items-center gap-8 bg-sweetardios-oxford/90 px-8 py-10 backdrop-blur md:flex-row md:gap-10 md:px-12">
          <div className="text-6xl drop-shadow-[0_0_25px_rgba(52,237,243,0.5)]" aria-hidden>🏆</div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">Season zero is live</p>
            <h2 className="font-heading mt-2 text-3xl text-white sm:text-4xl">Grind now, feast at mint</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100/70">
              Both games feed live leaderboards. When the Sweetardios NFT collection launches, the top
              players on the boards get launch perks. Connect any Solana wallet so your standings are
              tied to your address — then go break the arcade.
            </p>
          </div>
          <Link
            to="/leaderboard"
            className="sw-shine inline-flex shrink-0 items-center gap-2 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5"
            style={{ background: '#34EDF3' }}
          >
            View Leaderboards <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>

    {/* FEATURES */}
    <section className="relative mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const card = (
            <>
              <div className="text-3xl transition-transform group-hover:scale-110">{f.icon}</div>
              <h4 className="font-heading mt-3 text-lg text-white">{f.title}</h4>
              <p className="mt-1.5 text-sm text-blue-100/60">{f.desc}</p>
            </>
          );
          const className =
            'group block border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-sweetardios-cyan/50 hover:bg-white/[0.05]';
          return f.to ? (
            <Link key={f.title} to={f.to} className={className}>
              {card}
            </Link>
          ) : (
            <div key={f.title} className={className}>
              {card}
            </div>
          );
        })}
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
        <div className="flex max-w-3xl flex-col items-center gap-3 text-sm text-blue-100/70">
          <nav aria-label="Site links" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href="#mint"
              onClick={(e) => { e.preventDefault(); document.getElementById('mint')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="transition-colors hover:text-sweetardios-cerise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan"
            >
              Mint
            </a>
            <a
              href="#music"
              onClick={(e) => { e.preventDefault(); document.getElementById('music')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="transition-colors hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan"
            >
              Music
            </a>
            <Link to="/leaderboard" className="transition-colors hover:text-sweetardios-cyan">Leaderboard</Link>
            <Link to="/cast" className="transition-colors hover:text-sweetardios-cerise">The Cast</Link>
            <Link to="/stickers" className="transition-colors hover:text-sweetardios-cerise">Stickers</Link>
            <Link to="/board" className="transition-colors hover:text-sweetardios-cerise">The Board</Link>
            <Link to="/whitelist" className="transition-colors hover:text-sweetardios-cyan">Whitelist</Link>
            <Link to="/arcade" className="transition-colors hover:text-sweetardios-cerise">Enter the Arcade</Link>
          </nav>
          <nav aria-label="Community links" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {COMMUNITY_LINKS.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan ${item.accent === 'cyan' ? 'hover:text-sweetardios-cyan' : 'hover:text-sweetardios-cerise'}`}
              >
                {item.name}
                <span aria-hidden="true" className="ml-1">↗</span>
              </a>
            ))}
          </nav>
        </div>
        <p className="text-xs text-white/40">© Sweetardios</p>
      </div>
      <div className="border-t border-white/5 px-6 py-4">
        <p className="mx-auto max-w-6xl text-center text-[11px] leading-relaxed text-white/35">
          Disclaimer: We are not affiliated with the cookie chain.
        </p>
      </div>
    </footer>
  </div>
  );
};

export default Landing;
