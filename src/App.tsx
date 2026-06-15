import React, { useMemo, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NetworkProvider } from './contexts/NetworkContext';
import { WalletProvider } from './contexts/WalletContext';
import { DynamicConnectionProvider } from './contexts/DynamicConnectionProvider';

// Lazy-load each game so they stay independent code-split bundles
const SlotsPage = lazy(() => import('./pages/Slots'));
const JunkPusherPage = lazy(() => import('./pages/JunkPusher'));

const NAV_HEIGHT = 56;

/** Simple landing page that links to each game. */
const Home: React.FC = () => (
  <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center gap-10 p-6">
    <div className="text-center">
      <h1 className="text-5xl font-bold text-magic-blue glow-blue mb-3">Sweetarded Games</h1>
      <p className="text-gray-400">Slots &amp; Junk Pusher — front-end design workspace</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
      <Link
        to="/slots"
        className="group border border-gray-700 hover:border-magic-blue bg-magic-card hover:bg-magic-hover p-8 text-center transition-colors"
      >
        <div className="text-6xl mb-4">🎰</div>
        <div className="text-2xl font-bold text-white group-hover:text-magic-blue">Slots</div>
        <p className="text-sm text-gray-500 mt-2">Trash-themed skill slots</p>
      </Link>

      <Link
        to="/junk-pusher"
        className="group border border-gray-700 hover:border-green-400 bg-magic-card hover:bg-magic-hover p-8 text-center transition-colors"
      >
        <div className="text-6xl mb-4">🪙</div>
        <div className="text-2xl font-bold text-white group-hover:text-green-400">Junk Pusher</div>
        <p className="text-sm text-gray-500 mt-2">Coin-pusher arcade</p>
      </Link>
    </div>
  </div>
);

const AppInner: React.FC = () => (
  <div
    className="min-h-screen text-white font-mono antialiased selection:bg-magic-blue selection:text-black"
    style={{ ['--navbar-height' as string]: `${NAV_HEIGHT}px` } as React.CSSProperties}
  >
    <nav className="h-14 flex items-center justify-between px-4 border-b border-gray-800 bg-black/80 backdrop-blur sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-magic-blue tracking-tight">SWEETARDED</Link>
        <Link to="/slots" className="text-sm text-gray-300 hover:text-white transition-colors">Slots</Link>
        <Link to="/junk-pusher" className="text-sm text-gray-300 hover:text-white transition-colors">Junk Pusher</Link>
      </div>
      <WalletMultiButton />
    </nav>

    <main>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[calc(100vh-56px)] text-magic-blue">
            Loading…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/slots" element={<SlotsPage />} />
          <Route path="/junk-pusher" element={<JunkPusherPage />} />
        </Routes>
      </Suspense>
    </main>
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
