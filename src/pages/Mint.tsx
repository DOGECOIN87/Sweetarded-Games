import { Link } from 'react-router-dom';
import MintSection from '../components/MintSection';

const MintPage = () => (
  <div className="relative min-h-[calc(100vh-var(--navbar-height,56px))] overflow-hidden text-white">
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/games-bg.png)' }}
      />
      <div className="absolute inset-0 bg-sweetardios-oxford/75" />
      <div className="sw-scanlines absolute inset-0 opacity-[0.1]" />
    </div>

    <MintSection asPage />

    <div className="mx-auto -mt-10 flex max-w-4xl justify-center px-6 pb-16 sm:pb-20">
      <Link
        to="/"
        className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/60 transition-colors hover:text-sweetardios-cyan"
      >
        ← Back to Sweetardio.fun
      </Link>
    </div>
  </div>
);

export default MintPage;
