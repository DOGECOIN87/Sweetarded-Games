import React, { useMemo, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NetworkProvider } from './contexts/NetworkContext';
import { WalletProvider } from './contexts/WalletContext';
import { DynamicConnectionProvider } from './contexts/DynamicConnectionProvider';
import Landing from './components/Landing';
import MascotGuide from './components/MascotGuide';

// Lazy-load each game so they stay independent code-split bundles
const SlotsPage = lazy(() => import('./pages/Slots'));
const JunkPusherPage = lazy(() => import('./pages/JunkPusher'));

const NAV_HEIGHT = 56;

const AppInner: React.FC = () => (
  <div
    className="min-h-screen text-white font-mono antialiased selection:bg-sweetardios-cerise selection:text-sweetardios-oxford"
    style={{ ['--navbar-height' as string]: `${NAV_HEIGHT}px` } as React.CSSProperties}
  >
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-sweetardios-violet/40 bg-sweetardios-oxford/80 px-4 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg tracking-tight">
          <img src="/sweetardios-logo.svg" alt="Sweetardios" className="h-9 w-9" />
          <span className="hidden sm:inline">
            <span className="sw-glow-cerise text-sweetardios-cerise">SWEET</span>
            <span className="sw-glow-cyan text-sweetardios-cyan">ARDED</span>
          </span>
        </Link>
        <Link to="/slots" className="text-sm text-blue-100/70 transition-colors hover:text-sweetardios-cerise">
          Slots
        </Link>
        <Link to="/junk-pusher" className="text-sm text-blue-100/70 transition-colors hover:text-sweetardios-cyan">
          Junk Pusher
        </Link>
      </div>
      <WalletMultiButton />
    </nav>

    <main>
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-56px)] items-center justify-center text-sweetardios-cyan">
            Loading…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/slots" element={<SlotsPage />} />
          <Route path="/junk-pusher" element={<JunkPusherPage />} />
        </Routes>
      </Suspense>
    </main>

    <MascotGuide />
  </div>
);

const App: React.FC = () => {
  const wallets = useMemo(() => [], []);

  return (
    <NetworkProvider>
      <WalletProvider>
        <DynamicConnectionProvider wallets={wallets}>
          <WalletModalProvider>
            <Router>
              <AppInner />
            </Router>
          </WalletModalProvider>
        </DynamicConnectionProvider>
      </WalletProvider>
    </NetworkProvider>
  );
};

export default App;
