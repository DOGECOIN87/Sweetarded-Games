import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  COMPETITION,
  PRIZE_LADDER,
  TOTAL_PRIZE_MINTS,
  hasEnded,
  timeLeftLabel,
} from '../../lib/competition';
import { getPoolSize } from '../../services/competitionService';
import { currentPlayerId, resolvePlayer } from '../../lib/playerIdentity';
import { useCompetition } from '../../lib/useCompetition';

/**
 * The Arcade Cup, explained on the leaderboard page.
 *
 * Everything a player needs to decide to play: what the prizes are, how
 * entries are earned, what they hold right now, and — because the games are
 * client-side and this pays out real mints — exactly how the draw is decided
 * and why it cannot be gamed by posting a big score.
 */

const closeLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
}).format(new Date(COMPETITION.endsAt));

export default function CompetitionPanel() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const address = publicKey?.toBase58() ?? null;

  const comp = useCompetition(currentPlayerId(address), resolvePlayer(address).name, address);
  const [pool, setPool] = useState<{ entrants: number; tickets: number } | null>(null);
  const [left, setLeft] = useState(() => timeLeftLabel());
  const ended = hasEnded();

  useEffect(() => {
    getPoolSize().then(setPool).catch(() => setPool(null));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setLeft(timeLeftLabel()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const odds =
    pool && pool.tickets > 0 && comp.state.tickets > 0
      ? (comp.state.tickets / pool.tickets) * 100
      : null;

  return (
    <section className="mx-auto mt-10 max-w-4xl">
      <div className="relative bg-gradient-to-br from-[#FFC93C]/45 via-sweetardios-cerise/25 to-sweetardios-cyan/40 p-px">
        <div className="relative overflow-hidden bg-sweetardios-oxford/90 px-5 py-7 backdrop-blur-xl sm:px-9">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFC93C]/60 to-transparent"
          />

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                🎟
              </span>
              <div>
                <h2 className="font-heading text-2xl text-white sm:text-3xl">
                  Arcade <span className="text-[#FFC93C]">Cup</span>
                </h2>
                <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100/50">
                  {TOTAL_PRIZE_MINTS} free Sweetardio mints
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-heading text-2xl tabular-nums text-white">
                {ended ? 'Closed' : left}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-blue-100/45">
                {ended ? `Closed ${closeLabel}` : `Entries close ${closeLabel}`}
              </div>
            </div>
          </div>

          {/* Prize ladder */}
          <div className="mt-7">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-blue-100/55">
              Prize ladder — 10 winners drawn
            </h3>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
              {PRIZE_LADDER.map((mints, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center border px-1 py-2 ${
                    i === 0
                      ? 'border-[#FFC93C]/70 bg-[#FFC93C]/10'
                      : i < 3
                        ? 'border-white/25 bg-white/[0.04]'
                        : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-blue-100/45">
                    {i + 1}
                    {['st', 'nd', 'rd'][i] ?? 'th'}
                  </span>
                  <span
                    className={`font-heading text-lg tabular-nums ${i === 0 ? 'text-[#FFC93C]' : 'text-white'}`}
                  >
                    {mints}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-blue-100/35">
                    mint{mints > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Your entry */}
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="border border-white/12 bg-white/[0.03] px-4 py-3">
              <div className="font-heading text-3xl tabular-nums text-[#FFC93C]">
                {comp.loaded ? comp.state.tickets : '—'}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-blue-100/45">
                Your tickets
              </div>
            </div>
            <div className="border border-white/12 bg-white/[0.03] px-4 py-3">
              <div className="font-heading text-3xl tabular-nums text-white">
                {comp.loaded ? comp.room : '—'}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-blue-100/45">
                Left today (of {COMPETITION.dailyCap})
              </div>
            </div>
            <div className="border border-white/12 bg-white/[0.03] px-4 py-3">
              <div className="font-heading text-3xl tabular-nums text-white">
                {odds !== null ? `${odds < 0.1 ? '<0.1' : odds.toFixed(1)}%` : '—'}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-blue-100/45">
                Your share of the pool
                {pool ? ` · ${pool.entrants} in` : ''}
              </div>
            </div>
          </div>

          {/* Eligibility */}
          {!address && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-sweetardios-cerise/40 bg-sweetardios-cerise/10 px-4 py-3">
              <p className="text-sm text-blue-100/85">
                <span className="font-bold text-sweetardios-cerise">Connect a wallet to be eligible.</span>{' '}
                Keep playing without one — tickets bank either way — but the draw needs an address
                to send mints to.
              </p>
              <button
                type="button"
                onClick={() => setVisible(true)}
                className="shrink-0 bg-sweetardios-cerise px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
              >
                Connect wallet
              </button>
            </div>
          )}
          {address && comp.loaded && comp.state.tickets > 0 && (
            <div className="mt-4 border border-sweetardios-cyan/40 bg-sweetardios-cyan/10 px-4 py-3 text-sm text-blue-100/85">
              <span className="font-bold text-sweetardios-cyan">You're in the draw.</span> Mints go
              to the connected wallet.
            </div>
          )}

          {/* How it works */}
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Play either game',
                d: `${COMPETITION.earnRates.slots.per} spins or ${COMPETITION.earnRates.coinpusher.per} coins pushed earns one ticket. Both games feed the same pool.`,
              },
              {
                n: '02',
                t: 'Come back daily',
                d: `${COMPETITION.dailyCap} tickets a day is the cap, so a short run every day beats one long session. Resets at 00:00 UTC.`,
              },
              {
                n: '03',
                t: 'Winners are drawn',
                d: `At close, 10 names are drawn from the ticket pool. More tickets, better odds — nobody wins twice.`,
              },
            ].map((s) => (
              <div key={s.n} className="border-l-2 border-[#FFC93C]/50 pl-3">
                <div className="font-heading text-sm text-[#FFC93C]">{s.n}</div>
                <div className="mt-0.5 text-sm font-bold text-white">{s.t}</div>
                <p className="mt-1 text-xs leading-relaxed text-blue-100/60">{s.d}</p>
              </div>
            ))}
          </div>

          {/* Fairness — the part that earns trust */}
          <details className="mt-7 border border-white/10 bg-black/25 px-4 py-3">
            <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/60 hover:text-white">
              How the draw is kept honest
            </summary>
            <div className="mt-3 space-y-2 text-xs leading-relaxed text-blue-100/65">
              <p>
                <span className="font-bold text-white">Nothing is won by scoring higher.</span> The
                games run in your browser, so a leaderboard score can never be fully verified — which
                is exactly why prizes are not tied to one. Tickets are capped at{' '}
                {COMPETITION.dailyCap}/day and {COMPETITION.maxTotalTickets} in total, enforced by
                the database itself, so the most anyone can hold is what an ordinary player reaches
                by turning up. There is no number worth faking.
              </p>
              <p>
                <span className="font-bold text-white">The draw is seeded and public.</span> A random
                seed is published before the draw is run, and the draw script is in the repo
                (<code className="text-sweetardios-cyan">scripts/draw-competition.mjs</code>). Anyone
                can re-run it against the public entries and get exactly the same winners.
              </p>
              <p>
                <span className="font-bold text-white">Winners are reviewed.</span> One person
                running many handles is the one thing caps cannot stop, so entries are checked for
                duplicate wallets before mints are allocated. Obvious farming is disqualified.
              </p>
              <p className="text-blue-100/45">
                The live leaderboards are for bragging rights and do not affect the draw.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
