import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  getLeaderboard,
  findPlayerRank,
  type LeaderboardEntry,
  type LeaderboardGame,
  type SortField,
} from '../services/leaderboardService';
import {
  currentPlayerId,
  shortAddress,
  getLocalPlayer,
  setPlayerName,
} from '../lib/playerIdentity';
import { STARTING_CREDITS } from '../lib/credits';

/* ── Metric definitions per game ─────────────────────────────── */

interface Metric {
  id: SortField;
  label: string;
  hint: string;
  signed: boolean; // render +/- and red when negative
}

const METRICS: Record<LeaderboardGame, Metric[]> = {
  slots: [
    { id: 'netProfit', label: 'Net Profit', hint: 'Credits won minus credits wagered', signed: true },
    { id: 'score', label: 'Biggest Win', hint: 'Largest single spin or bonus payout', signed: false },
    { id: 'balance', label: 'Credits', hint: 'Current SWEET credit stack', signed: false },
  ],
  coinpusher: [
    { id: 'score', label: 'Coins Pushed', hint: 'Total coins collected over the edge', signed: false },
    { id: 'netProfit', label: 'Net Profit', hint: 'Credits won minus credits dropped', signed: true },
    { id: 'balance', label: 'Credits', hint: 'Current SWEET credit stack', signed: false },
  ],
};

const GAMES: { id: LeaderboardGame; label: string; accent: 'cerise' | 'cyan' }[] = [
  { id: 'slots', label: 'Slots', accent: 'cerise' },
  { id: 'coinpusher', label: 'Coinpusher', accent: 'cyan' },
];

const MEDALS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const fmtValue = (v: number, signed: boolean) =>
  `${signed && v > 0 ? '+' : ''}${v.toLocaleString()}`;

const fmtDate = (seconds: number) =>
  seconds > 0 ? new Date(seconds * 1000).toLocaleDateString() : '—';

/* ── Podium card for the top 3 ───────────────────────────────── */

const PodiumCard: React.FC<{
  entry: LeaderboardEntry;
  metric: Metric;
  isMe: boolean;
}> = ({ entry, metric, isMe }) => {
  const medal = MEDALS[entry.rank - 1];
  const first = entry.rank === 1;
  const value = entry[metric.id];
  return (
    <div
      className={`relative flex flex-col items-center border bg-sweetardios-oxford/80 px-4 pb-5 backdrop-blur transition-transform hover:-translate-y-1 ${
        first ? 'border-yellow-400/60 pt-8 sm:-mt-4' : 'border-white/15 pt-6'
      } ${isMe ? 'outline outline-1 outline-sweetardios-cyan' : ''}`}
      style={first ? { boxShadow: '0 24px 70px -30px rgba(255,215,0,0.45)' } : undefined}
    >
      <span
        className="flex h-10 w-10 items-center justify-center font-heading text-lg text-sweetardios-oxford"
        style={{ background: medal, borderRadius: '9999px', boxShadow: `0 0 18px ${medal}66` }}
      >
        {entry.rank}
      </span>
      <p className="mt-3 max-w-full truncate font-heading text-lg text-white" title={entry.name}>
        {entry.name}
      </p>
      <p className="font-mono text-[10px] text-blue-100/40">{shortAddress(entry.player)}</p>
      <p
        className={`mt-2 font-mono text-xl font-bold ${
          metric.signed && value < 0 ? 'text-red-400' : 'text-sweetardios-cyan'
        }`}
      >
        {fmtValue(value, metric.signed)}
      </p>
      <p className="text-[9px] uppercase tracking-[0.25em] text-blue-100/40">{metric.label}</p>
      {isMe && (
        <span className="absolute right-2 top-2 bg-sweetardios-cyan px-1.5 py-0.5 text-[9px] font-bold uppercase text-sweetardios-oxford">
          You
        </span>
      )}
    </div>
  );
};

/* ── Page ────────────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [game, setGame] = useState<LeaderboardGame>('slots');
  const [metricId, setMetricId] = useState<SortField>('netProfit');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Display name editor (persists locally; applied on the next score submit)
  const [localName, setLocalName] = useState(() => getLocalPlayer().name);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(localName);

  const me = currentPlayerId(publicKey?.toBase58() ?? null);
  const metrics = METRICS[game];
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0];
  const accent = GAMES.find((g) => g.id === game)!.accent;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(game, metric.id, 100);
      setEntries(data);
    } catch (err) {
      console.error('[Leaderboard] load failed:', err);
      setError('Could not load the leaderboard. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [game, metric.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the metric valid when switching games
  const selectGame = (g: LeaderboardGame) => {
    setGame(g);
    setMetricId(METRICS[g][0].id);
  };

  const myRank = useMemo(() => findPlayerRank(entries, me), [entries, me]);
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  const saveName = () => {
    const trimmed = nameDraft.trim().slice(0, 24);
    if (trimmed) {
      setPlayerName(trimmed);
      setLocalName(trimmed);
    }
    setEditingName(false);
  };

  const accentText = accent === 'cerise' ? 'text-sweetardios-cerise' : 'text-sweetardios-cyan';

  return (
    <div className="relative min-h-[calc(100vh-56px)] text-white">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/games-bg.png)' }}
        />
        <div className="absolute inset-0 bg-sweetardios-oxford/80" />
        <div className="sw-scanlines absolute inset-0 opacity-[0.08]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-sweetardios-cyan">The Arcade</p>
          <h1 className="font-heading mt-2 text-4xl sm:text-6xl">
            <span className="sw-glow-cerise text-sweetardios-cerise">LEADER</span>
            <span className="sw-glow-cyan text-sweetardios-cyan">BOARDS</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-blue-100/70">
            Every player starts with {STARTING_CREDITS.toLocaleString()} SWEET credits — free, off-chain,
            just for fun. Climb by skill: refills never boost your Net Profit.
          </p>
        </header>

        {/* NFT launch perks banner */}
        <div className="mt-10 bg-gradient-to-br from-sweetardios-cerise/60 via-sweetardios-violet/30 to-sweetardios-cyan/60 p-px">
          <div className="flex flex-col items-center gap-5 bg-sweetardios-oxford/90 px-6 py-6 backdrop-blur sm:flex-row sm:gap-6">
            <img
              src="/logos/sweetardio-collection-badge-512.png"
              alt=""
              className="h-16 w-16 shrink-0 drop-shadow-[0_0_16px_rgba(247,21,171,0.5)]"
            />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-heading text-xl text-white">Top players eat first at mint</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-blue-100/70">
                When the Sweetardios NFT collection launches, the highest climbers on these boards get
                launch perks — think whitelist priority and airdrop love. Standings are keyed to your
                wallet address, so connect before you grind to make your run count.
              </p>
            </div>
            {connected && publicKey ? (
              <div className="shrink-0 border border-sweetardios-cyan/40 bg-sweetardios-cyan/10 px-4 py-2 text-center">
                <p className="text-[9px] uppercase tracking-[0.25em] text-sweetardios-cyan/80">Competing as</p>
                <p className="font-mono text-sm text-white">{shortAddress(publicKey.toBase58())}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setVisible(true)}
                className="sw-shine shrink-0 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-sweetardios-oxford"
                style={{ background: '#34EDF3' }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Display name */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-blue-100/60">
          <span>Playing as</span>
          {editingName ? (
            <span className="inline-flex items-center gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                maxLength={24}
                autoFocus
                className="border border-sweetardios-cyan/50 bg-black/40 px-2 py-1 font-mono text-xs text-white outline-none"
              />
              <button onClick={saveName} className="font-bold uppercase text-sweetardios-cyan hover:text-white">
                Save
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="font-mono font-bold text-white">{localName}</span>
              <button
                onClick={() => {
                  setNameDraft(localName);
                  setEditingName(true);
                }}
                className="uppercase tracking-wide text-sweetardios-cerise hover:text-white"
              >
                Edit
              </button>
            </span>
          )}
        </div>

        {/* Game switcher */}
        <div className="mt-10 flex justify-center gap-3">
          {GAMES.map((g) => {
            const active = g.id === game;
            const color = g.accent === 'cerise' ? '#F715AB' : '#34EDF3';
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGame(g.id)}
                className={`px-6 py-2.5 font-heading text-sm uppercase tracking-wider transition-all ${
                  active
                    ? 'text-sweetardios-oxford'
                    : 'border border-white/15 bg-white/[0.04] text-blue-100/70 hover:border-white/40 hover:text-white'
                }`}
                style={active ? { background: color, boxShadow: `0 10px 30px -10px ${color}aa` } : undefined}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Metric tabs */}
        <div className="mt-5 flex justify-center">
          <div className="inline-flex border border-white/15 bg-sweetardios-oxford/70 backdrop-blur">
            {metrics.map((m) => (
              <button
                key={m.id}
                type="button"
                title={m.hint}
                onClick={() => setMetricId(m.id)}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  m.id === metric.id
                    ? `border-b-2 border-current bg-white/[0.06] ${accentText}`
                    : 'text-blue-100/50 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Your rank */}
        {!isLoading && !error && myRank.rank > 0 && (
          <p className="mt-4 text-center text-xs text-blue-100/60">
            Your rank:{' '}
            <span className={`font-mono text-base font-bold ${accentText}`}>#{myRank.rank}</span>{' '}
            <span className="text-blue-100/40">of {myRank.total}</span>
          </p>
        )}

        {/* Board */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center py-20">
              <div className="h-9 w-9 animate-spin border-2 border-sweetardios-cyan border-t-transparent" />
              <p className="mt-4 text-xs uppercase tracking-[0.25em] text-blue-100/50">Loading standings…</p>
            </div>
          ) : error ? (
            <div className="border border-sweetardios-cerise/40 bg-sweetardios-oxford/80 px-6 py-14 text-center backdrop-blur">
              <p className="text-sm text-blue-100/70">{error}</p>
              <button
                type="button"
                onClick={load}
                className="mt-5 bg-sweetardios-cerise px-6 py-2 text-xs font-extrabold uppercase tracking-wide text-sweetardios-oxford"
              >
                Retry
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="border border-white/10 bg-sweetardios-oxford/80 px-6 py-16 text-center backdrop-blur">
              <p className="font-heading text-2xl text-white">The board is empty</p>
              <p className="mt-2 text-sm text-blue-100/60">
                No standings yet — be the first Sweetardio on it. Go play!
              </p>
            </div>
          ) : (
            <>
              {/* Podium */}
              {podium.length > 0 && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
                  {(podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium).map((entry) => (
                    <PodiumCard key={entry.player} entry={entry} metric={metric} isMe={entry.player === me} />
                  ))}
                </div>
              )}

              {/* Table */}
              {rest.length > 0 && (
                <div className="overflow-x-auto border border-white/10 bg-sweetardios-oxford/80 backdrop-blur">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-[56px_1fr_140px_140px] border-b border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-wider text-blue-100/50">
                      <div className="p-3 text-center">#</div>
                      <div className="p-3">Player</div>
                      <div className="p-3 text-right">{metric.label}</div>
                      <div className="p-3 text-right">Last Played</div>
                    </div>
                    {rest.map((entry) => {
                      const isMe = entry.player === me;
                      const value = entry[metric.id];
                      return (
                        <div
                          key={entry.player}
                          className={`grid grid-cols-[56px_1fr_140px_140px] border-b border-white/5 transition-colors ${
                            isMe
                              ? 'border-l-2 border-l-sweetardios-cyan bg-sweetardios-cyan/10'
                              : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="p-3 text-center font-mono text-sm text-blue-100/50">{entry.rank}</div>
                          <div className="min-w-0 p-3">
                            <p className={`truncate font-mono text-sm ${isMe ? 'font-bold text-sweetardios-cyan' : 'text-white'}`}>
                              {entry.name}
                              {isMe && <span className="ml-2 text-[9px] uppercase text-sweetardios-cyan/80">← you</span>}
                            </p>
                            <p className="font-mono text-[10px] text-blue-100/35">{shortAddress(entry.player)}</p>
                          </div>
                          <div className="p-3 text-right">
                            <span
                              className={`font-mono text-sm font-bold ${
                                metric.signed && value < 0 ? 'text-red-400' : 'text-white'
                              }`}
                            >
                              {fmtValue(value, metric.signed)}
                            </span>
                          </div>
                          <div className="p-3 text-right font-mono text-xs text-blue-100/40">
                            {fmtDate(entry.lastUpdated)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.25em] text-blue-100/35">
                  Live · top {entries.length} shown
                </p>
                <button
                  type="button"
                  onClick={load}
                  className="border border-white/15 bg-white/[0.05] px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-blue-100/70 transition-colors hover:border-sweetardios-cyan/50 hover:text-sweetardios-cyan"
                >
                  Refresh
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
