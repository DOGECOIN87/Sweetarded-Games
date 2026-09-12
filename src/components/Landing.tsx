import { Link } from 'react-router-dom';
import ArtistRares from './ArtistRares';
import GetStarted from './GetStarted';
import SweetardioVideo from './SweetardioVideo';
import MintSection from './MintSection';
import MusicFeature from './MusicFeature';
import { SocialIcon } from './SocialIcon';
import NeonArrow from './scene/NeonArrow';
import { STICKERS, stickerSrc } from '../content/stickers';
import { COMMUNITY_LINKS } from '../content/siteLinks';
import { STARTING_CREDITS } from '../lib/credits';
import AgentMint from './AgentMint';
import MakerBio from './MakerBio';
import RarityTeaser from './RarityTeaser';
import Team from './Team';
import AnimatedRares from './AnimatedRares';
import Roadmap from './Roadmap';
import { useAmbient } from '../motion/useAmbient';
import SectionHeading from './SectionHeading';
import NeonDivider from './scene/NeonDivider';
import FlipCountdown from './FlipCountdown';
import { MINT_URL } from './MintEmbed';

const FEATURES: { icon: string; title: string; desc: string; to?: string }[] = [
  { icon: '🎮', title: 'Free to Play', desc: `Every player starts with ${STARTING_CREDITS.toLocaleString()} SWEET credits — off-chain, just for fun.` },
  { icon: '🏆', title: 'Live Leaderboards', desc: 'Net profit, biggest wins and coins pushed — tracked live, per player.', to: '/leaderboard' },
  { icon: '👛', title: 'Any Solana Wallet', desc: 'Phantom, Backpack, Nightly, Solflare and more — connect to save your rank.' },
  { icon: '🎟', title: '55 Free Mints', desc: 'Play either game to bank Arcade Cup tickets — ten winners drawn at close.', to: '/leaderboard' },
];

/* Sugar dust drifting through the shop air — positions, sizes, tempos. */
const DUST = [
  { x: '5%',  s: 9,  t: 34, d: 0,   o: 0.35, c: 'rgba(247,21,171,0.5)',  sway: 42 },
  { x: '14%', s: 6,  t: 27, d: 6,   o: 0.4,  c: 'rgba(255,255,255,0.45)', sway: -30 },
  { x: '24%', s: 12, t: 40, d: 12,  o: 0.28, c: 'rgba(52,237,243,0.5)',  sway: 24 },
  { x: '35%', s: 7,  t: 30, d: 3,   o: 0.4,  c: 'rgba(146,1,203,0.55)',  sway: -46 },
  { x: '46%', s: 10, t: 37, d: 17,  o: 0.3,  c: 'rgba(255,255,255,0.4)', sway: 34 },
  { x: '55%', s: 5,  t: 24, d: 9,   o: 0.45, c: 'rgba(52,237,243,0.55)', sway: -22 },
  { x: '64%', s: 11, t: 42, d: 21,  o: 0.26, c: 'rgba(247,21,171,0.45)', sway: 50 },
  { x: '73%', s: 6,  t: 28, d: 1,   o: 0.4,  c: 'rgba(255,255,255,0.45)', sway: -36 },
  { x: '82%', s: 9,  t: 33, d: 14,  o: 0.32, c: 'rgba(146,1,203,0.5)',   sway: 28 },
  { x: '90%', s: 7,  t: 26, d: 7,   o: 0.42, c: 'rgba(52,237,243,0.5)',  sway: -40 },
  { x: '96%', s: 12, t: 44, d: 19,  o: 0.24, c: 'rgba(247,21,171,0.4)',  sway: 20 },
  { x: '30%', s: 5,  t: 22, d: 11,  o: 0.45, c: 'rgba(255,255,255,0.5)', sway: 18 },
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

/* ── Landing page (now navigation hub) ──────────────────────── */

const Landing = () => {
  useAmbient();

  return (
  <div className="relative text-white">
    {/* Background: Sweetardio shop scene + Oxford tint */}
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="sw-bg-drift absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/games-bg.png)' }}
      />
      <div className="absolute inset-0 bg-sweetardios-oxford/60" />
      <div aria-hidden className="sw-wash absolute inset-0" />
      <div aria-hidden className="sw-dust absolute inset-0">
        {DUST.map((p, i) => (
          <i key={i} style={{ '--dust-x': p.x, '--dust-s': `${p.s}px`, '--dust-t': `${p.t}s`, '--dust-d': `${p.d}s`, '--dust-o': p.o, '--dust-c': p.c, '--dust-sway': `${p.sway}px` } as React.CSSProperties} />
        ))}
      </div>
      <div className="sw-scanlines absolute inset-0 opacity-[0.1]" />
      <div aria-hidden className="sw-grain absolute inset-0" />
    </div>

    {/* HERO — marshmallow sunset banner + split-flap mint countdown */}
    <section className="relative overflow-hidden">
      <div className="relative">
        <img
          src="/art/hero-banner.jpg"
          alt="Sweetardio Collection — marshmallow clouds at sunset"
          className="w-full object-cover object-center max-md:min-h-[220px] md:max-h-[min(72vh,720px)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
          style={{ background: 'linear-gradient(to top, #070F34, rgba(7,15,52,0.55), transparent)' }}
        />
      </div>
      <div className="relative bg-sweetardios-oxford">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 px-4 pb-10 pt-0 text-center sm:px-6 sm:pb-14">
          <div className="relative z-10 -mt-14 sm:-mt-[4.5rem]">
            <FlipCountdown />
          </div>
          <p className="max-w-xl text-base leading-relaxed text-blue-100/80 sm:text-lg">
            4,444 sugar-addicted conspiracy theorists, armed to the teeth, who
            refuse to take their meds. One mint. One holder. One believer at a
            time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={MINT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="sw-shine inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
              style={{ background: '#F715AB', borderRadius: 16 }}
            >
              Mint on LaunchMyNFT <span aria-hidden>↗</span>
            </a>
            <Link
              to="/arcade"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5"
              style={{ background: 'rgba(255,247,241,0.9)', borderRadius: 16 }}
            >
              Enter the arcade
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* STICKER STREAM — the sticker set drifts slowly across the page.
        Click anywhere on the stream to see them all; hovering pauses it. */}
    <Link
      to="/stickers"
      aria-label="See all Sweetardio stickers"
      className="sw-cast-stream sw-edge-fade group relative block overflow-hidden border-y border-white/10 bg-sweetardios-oxford/60 py-4 backdrop-blur"
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

    <NeonDivider aisle="01" label="The Weather" accent="cerise" />

    {/* ANIMATED RARES — weather loops, featured right under the stickers */}
    <AnimatedRares />

    <NeonDivider aisle="02" label="The Reel" accent="cyan" />

    {/* THE REEL — featured Sweetardio post, embedded from X */}
    <SweetardioVideo />

    <NeonDivider aisle="03" label="The Rare Wall" accent="cerise" />

    {/* ARTIST SERIES — looping carousel of 1/1 guest-artist rares */}
    <ArtistRares />

    <NeonDivider aisle="04" label="The Odds" accent="cerise" />

    {/* RARITY — headline odds, linking into the full vault */}
    <RarityTeaser />

    <NeonDivider aisle="05" label="The Mint" accent="cyan" />

    {/* UPCOMING MINT — LaunchMyNFT embed */}
    <MintSection />

    {/* AGENTIC CHECKOUT — mint via PayBox in the user's own assistant */}
    <AgentMint />

    <NeonDivider aisle="06" label="The Arcade" accent="cerise" />

    {/* GAMES — Clean Navigation Grid with Integrated Arrows */}
    <section className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <SectionHeading
        eyebrow="The Arcade"
        title="Pick your poison"
        sub="Step into the scene and walk up to a machine."
        accent="cyan"
        className="mb-16"
      />

      <div className="sw-reveal grid grid-cols-1 gap-8 md:grid-cols-2">
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

    <NeonDivider aisle="07" label="The Roadmap" accent="cyan" />

    {/* ROADMAP — three beats toward PVP on Solana */}
    <Roadmap />

    <NeonDivider aisle="08" label="The Sounds" accent="cyan" />

    {/* HIGHLIGHTED MUSIC FEATURE — Audius player */}
    <MusicFeature />

    <NeonDivider aisle="09" label="The Team" accent="cerise" />

    {/* THE TEAM — everyone behind Sweetardio */}
    <Team />

    <NeonDivider aisle="10" label="The Maker" accent="cyan" />

    {/* THE MAKER — who's behind the counter */}
    <MakerBio />

    <NeonDivider aisle="11" label="The Ecosystem" accent="cerise" />

    {/* ECOSYSTEM / MARKETPLACE LINKS */}
    <GetStarted />

    {/* LEADERBOARD / MINT PERKS CTA */}
    <section className="relative mx-auto max-w-6xl px-6 pb-4 pt-8">
      <div className="sw-bulbs sw-reveal">
        <div className="flex flex-col items-center gap-8 bg-[#081038] px-8 py-10 md:flex-row md:gap-10 md:px-12">
          <div className="text-6xl drop-shadow-[0_0_25px_rgba(52,237,243,0.5)]" aria-hidden>🏆</div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">The Arcade Cup is live</p>
            <h2 className="font-heading mt-2 text-3xl text-white sm:text-4xl">Play now, mint free at launch</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100/70">
              Every round in either game banks tickets for the Arcade Cup — 55 free Sweetardio mints,
              drawn across ten winners when entries close. Ten tickets a day is the cap, so showing up
              beats grinding. Connect any Solana wallet so the draw can reach you.
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
        {FEATURES.map((f, i) => {
          const card = (
            <>
              <div className="text-3xl transition-transform group-hover:scale-110">{f.icon}</div>
              <h4 className="font-heading mt-3 text-lg text-white">{f.title}</h4>
              <p className="mt-1.5 text-sm text-blue-100/60">{f.desc}</p>
            </>
          );
          const className =
            'sw-lightbar sw-reveal group block border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-sweetardios-cyan/50 hover:bg-white/[0.05]';
          const stagger = { '--rv-i': i } as React.CSSProperties;
          return f.to ? (
            <Link key={f.title} to={f.to} className={className} style={stagger}>
              {card}
            </Link>
          ) : (
            <div key={f.title} className={className} style={stagger}>
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
              href="#weather"
              onClick={(e) => { e.preventDefault(); document.getElementById('weather')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="transition-colors hover:text-sweetardios-cerise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan"
            >
              Weather
            </a>
            <a
              href="#rares"
              onClick={(e) => { e.preventDefault(); document.getElementById('rares')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="transition-colors hover:text-sweetardios-cerise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan"
            >
              Rares
            </a>
            <a
              href="#music"
              onClick={(e) => { e.preventDefault(); document.getElementById('music')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="transition-colors hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan"
            >
              Music
            </a>
            <Link to="/rarity" className="transition-colors hover:text-sweetardios-cerise">Rarity</Link>
            <a
              href="#roadmap"
              onClick={(e) => { e.preventDefault(); document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="transition-colors hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan"
            >
              Roadmap
            </a>
            <Link to="/leaderboard" className="transition-colors hover:text-sweetardios-cyan">Leaderboard</Link>
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
                className="inline-flex items-center gap-2 font-bold text-sweetardios-cyan/80 transition-colors hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sweetardios-cyan"
              >
                <SocialIcon platform={item.icon} className="h-3.5 w-3.5" />
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
          Made in America 2026
        </p>
      </div>
    </footer>
  </div>
  );
};

export default Landing;
