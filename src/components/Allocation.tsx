import { useState } from 'react';

/**
 * Mint-proceeds / treasury allocation (totals 100%):
 *   Cookie Chain community 40% · Creators 40% · Partners 15% · Marketing 5%.
 * The Creators wallet address has not been provided yet.
 */
interface Bucket {
  label: string;
  pct: number;
  color: string;
  blurb: string;
  wallet?: string;
}

const BUCKETS: Bucket[] = [
  {
    label: 'Cookie Chain Community',
    pct: 40,
    color: '#F715AB',
    blurb:
      'Ownership for the $Cook / Cookie Chain community. This is a $Cook wallet and belongs to the Cook community.',
    wallet: 'FDQtSAh8Lz1JUNA9qB6yduPyTns4yxtVrqi248dWuARa',
  },
  {
    label: 'Creators',
    pct: 40,
    color: '#9201CB',
    blurb: 'Allocated to the Sweetardio creators.',
  },
  {
    label: 'Partners',
    pct: 15,
    color: '#34EDF3',
    blurb: 'Allocated to associate partner(s) for services and management associated with the collection.',
    wallet: '9sLDbv3wDiWkWjGkRRMGvBiSFwhTV4dVxZMCe8sfyHpw',
  },
  {
    label: 'Marketing',
    pct: 5,
    color: '#F7C815',
    blurb:
      'Marketing, plus specials, airdrops and rewards. Held as $Cook in this wallet until distributed to Sweetardio owners.',
    wallet: 'MmKJ9wR2aD9U8zfc5wVXCsXCwxBdxjoaeD4ijhn1BXf',
  },
];

const short = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`;

const WalletAddress = ({ wallet }: { wallet: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(wallet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <div className="mt-3 flex items-center gap-2 text-[11px]">
      <code className="font-mono text-blue-100/60">{short(wallet)}</code>
      <button
        type="button"
        onClick={copy}
        className="border border-white/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-white/60 transition-colors hover:border-white/30 hover:text-white"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <a
        href={`https://solscan.io/account/${wallet}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sweetardios-cyan/70 transition-colors hover:text-sweetardios-cyan"
      >
        Solscan ↗
      </a>
    </div>
  );
};

const Allocation = () => (
  <section id="allocation" className="relative mx-auto max-w-5xl px-6 py-20 sm:py-24">
    <header className="mb-10 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">Transparency</p>
      <h2 className="font-heading mt-2 text-4xl text-white sm:text-5xl">Mint Allocation</h2>
      <p className="mt-3 text-sm text-blue-100/55">Where the mint proceeds go. On-chain, accountable, honored.</p>
    </header>

    {/* Stacked split bar */}
    <div className="mb-3 flex h-4 w-full overflow-hidden rounded-full border border-white/10">
      {BUCKETS.map((b) => (
        <div key={b.label} style={{ width: `${b.pct}%`, background: b.color }} title={`${b.label} — ${b.pct}%`} />
      ))}
    </div>
    <div className="mb-12 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-blue-100/60">
      {BUCKETS.map((b) => (
        <span key={b.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5" style={{ background: b.color }} /> {b.label} · {b.pct}%
        </span>
      ))}
    </div>

    {/* Cards */}
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {BUCKETS.map((b) => (
        <div key={b.label} className="relative border border-white/10 bg-white/[0.03] p-6">
          <div aria-hidden className="absolute left-0 top-0 h-full w-1" style={{ background: b.color }} />
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-lg text-white">{b.label}</h3>
            <span className="font-heading text-2xl" style={{ color: b.color }}>{b.pct}%</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/65">{b.blurb}</p>
          {b.wallet && <WalletAddress wallet={b.wallet} />}
        </div>
      ))}
    </div>
  </section>
);

export default Allocation;
