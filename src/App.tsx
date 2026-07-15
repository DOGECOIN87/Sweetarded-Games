import React, { useMemo, useState, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { NightlyWalletAdapter } from '@solana/wallet-adapter-nightly';
import { NetworkProvider } from './contexts/NetworkContext';
import { WalletProvider } from './contexts/WalletContext';
import { DynamicConnectionProvider } from './contexts/DynamicConnectionProvider';
import Landing from './components/Landing';
import MascotGuide from './components/MascotGuide';
import SiteMusic from './components/SiteMusic';
import { MintEmbedProvider } from './components/MintEmbed';
import { SocialIcon } from './components/SocialIcon';
import WalletButton from './components/WalletButton';
import { COMMUNITY_LINKS } from './content/siteLinks';

// Lazy-load each game so they stay independent code-split bundles
const SlotsPage = lazy(() => import('./pages/Slots'));
const JunkPusherPage = lazy(() => import('./pages/JunkPusher'));
const ArcadePage = lazy(() => import('./pages/Arcade'));
const WhitelistPage = lazy(() => import('./pages/Whitelist'));
const BoardPage = lazy(() => import('./pages/Board'));
const CastPage = lazy(() => import('./pages/Cast'));
const StickersPage = lazy(() => import('./pages/Stickers'));
const LeaderboardPage = lazy(() => import('./pages/Leaderboard'));
const MintPage = lazy(() => import('./pages/Mint'));

const NAV_HEIGHT = 96;

/** Site navigation. Slots / Coinpusher / The Board deep-link into the arcade
 *  walk-through; `also` keeps the item highlighted once you've stepped from
 *  the scene into the destination itself. */
const NAV_LINKS: { label: string; to: string; hover: string; also?: string[] }[] = [
  { label: 'Arcade', to: '/arcade', hover: 'hover:text-sweetardios-cerise' },
  { label: 'Slots', to: '/arcade?to=slots', hover: 'hover:text-sweetardios-cerise', also: ['/slots'] },
  { label: 'Coinpusher', to: '/arcade?to=pusher', hover: 'hover:text-sweetardios-cyan', also: ['/coinpusher'] },
  { label: 'Leaderboard', to: '/leaderboard', hover: 'hover:text-sweetardios-cyan' },
  { label: 'The Cast', to: '/cast', hover: 'hover:text-sweetardios-cerise' },
  { label: 'Stickers', to: '/stickers', hover: 'hover:text-sweetardios-cerise' },
  { label: 'The Board', to: '/arcade?to=gallery', hover: 'hover:text-sweetardios-cyan', also: ['/board'] },
  { label: 'Whitelist', to: '/whitelist', hover: 'hover:text-sweetardios-cyan' },
];

const AppInner: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isMintPage = location.pathname === '/mint';

  const isActive = (to: string, also?: string[]) => {
    if (also?.includes(location.pathname)) return true;
    const [path, query] = to.split('?');
    if (location.pathname !== path) return false;
    return query ? location.search === `?${query}` : location.search === '';
  };

  return (
  <div
    className="min-h-screen text-white font-mono antialiased selection:bg-sweetardios-cerise selection:text-sweetardios-oxford"
    style={{ ['--navbar-height' as string]: `${NAV_HEIGHT}px` } as React.CSSProperties}
  >
    <header className="sticky top-0 z-50 bg-sweetardios-oxford/90 shadow-[inset_0_-1px_0_rgba(146,1,203,0.4)] backdrop-blur-xl">
      <nav
        aria-label="Sweetardio social media"
        className="h-10 border-b border-sweetardios-cyan/25 bg-[linear-gradient(90deg,rgba(52,237,243,0.02),rgba(52,237,243,0.1),rgba(52,237,243,0.02))] shadow-[0_1px_18px_rgba(52,237,243,0.1)]"
      >
        <div className="mx-auto flex h-full w-full max-w-[1920px] items-center justify-center gap-3 px-4 sm:justify-end">
          <span className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-sweetardios-cyan/75 sm:inline-flex">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-sweetardios-cyan shadow-[0_0_10px_#34EDF3]" />
            Join the Sweetardios
          </span>
          <div className="flex items-center gap-2">
            {COMMUNITY_LINKS.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Sweetardio on ${item.name} (opens in a new tab)`}
                title={`Sweetardio on ${item.name}`}
                className="group inline-flex h-9 min-w-9 items-center justify-center gap-2 border border-sweetardios-cyan/45 bg-sweetardios-cyan/[0.06] px-2 text-sweetardios-cyan shadow-[inset_0_0_12px_rgba(52,237,243,0.06)] transition-all duration-200 hover:-translate-y-px hover:border-sweetardios-cyan hover:bg-sweetardios-cyan hover:text-sweetardios-oxford hover:shadow-[0_0_22px_rgba(52,237,243,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
              >
                <SocialIcon platform={item.icon} className="h-[18px] w-[18px] shrink-0" />
                <span className="hidden text-[10px] font-extrabold uppercase tracking-[0.14em] md:inline">
                  {item.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      <nav aria-label="Primary navigation">
        <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 font-heading text-lg tracking-tight">
            <img
              src="/logos/sweetardio-collection-badge-512.png"
              alt="Sweetardio Collection"
              className="h-10 w-10 drop-shadow-[0_0_10px_rgba(247,21,171,0.45)]"
            />
            <span className="hidden sm:inline">
              <span className="sw-glow-cerise text-sweetardios-cerise">SWEET</span>
              <span className="sw-glow-cyan text-sweetardios-cyan">ARDIO</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-4 lg:flex">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={`text-sm transition-colors ${l.hover} ${
                  isActive(l.to, l.also) ? 'font-semibold text-white' : 'text-blue-100/70'
                }`}
              >
                {l.label}
              </NavLink>
            ))}
            {/* Mint Now button covers this below xl */}
            <NavLink
              to="/mint"
              className="hidden text-sm text-blue-100/70 transition-colors hover:text-sweetardios-cyan xl:inline"
            >
              Mint
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <WalletButton />
          </div>
          <Link
            to="/mint"
            onClick={() => setMenuOpen(false)}
            className="sw-shine inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5"
            style={{ background: '#F715AB' }}
          >
            Mint Now <span aria-hidden>→</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] border border-white/15 bg-white/[0.04] lg:hidden"
          >
            <span className={`h-0.5 w-5 bg-sweetardios-cyan transition-transform ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`h-0.5 w-5 bg-sweetardios-cerise transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-5 bg-sweetardios-cyan transition-transform ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
        </div>

      {/* Mobile menu panel */}
        {menuOpen && (
          <div className="border-t border-sweetardios-violet/30 bg-sweetardios-oxford/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="pb-3 pt-1 sm:hidden">
            <WalletButton compact />
          </div>
          <div className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`border-b border-white/5 py-3 text-sm uppercase tracking-[0.18em] transition-colors ${l.hover} ${
                  isActive(l.to, l.also) ? 'font-semibold text-white' : 'text-blue-100/70'
                }`}
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/mint"
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm uppercase tracking-[0.18em] text-blue-100/70 transition-colors hover:text-sweetardios-cyan"
            >
              Mint <span aria-hidden>→</span>
            </Link>
          </div>
          </div>
        )}
      </nav>
    </header>

    <main>
      <Suspense
        fallback={
          <div className="flex h-[calc(100dvh-var(--navbar-height,96px))] items-center justify-center text-sweetardios-cyan">
            Loading…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/mint" element={<MintPage />} />
          <Route path="/whitelist" element={<WhitelistPage />} />
          <Route path="/arcade" element={<ArcadePage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/cast" element={<CastPage />} />
          <Route path="/stickers" element={<StickersPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/slots" element={<SlotsPage />} />
          <Route path="/coinpusher" element={<JunkPusherPage />} />
        </Routes>
      </Suspense>
    </main>

    {!isMintPage && <MascotGuide />}
    {!isMintPage && <SiteMusic />}
  </div>
  );
};

const App: React.FC = () => {
  // Explicit adapters guarantee Phantom / Solflare / Nightly always appear in
  // the connect modal (with install links when missing). Wallets implementing
  // the Wallet Standard — Backpack, and installed copies of these three — are
  // auto-detected on top and deduplicated by the adapter library.
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new NightlyWalletAdapter()],
    []
  );

  return (
    <NetworkProvider>
      <WalletProvider>
        <DynamicConnectionProvider wallets={wallets}>
          <WalletModalProvider>
            <Router>
              <MintEmbedProvider>
                <AppInner />
              </MintEmbedProvider>
            </Router>
          </WalletModalProvider>
        </DynamicConnectionProvider>
      </WalletProvider>
    </NetworkProvider>
  );
};

export default App;
