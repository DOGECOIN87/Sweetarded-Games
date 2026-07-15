import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MintEmbed, { MINT_URL } from './MintEmbed';

/**
 * LaunchMyNFT remains authoritative for mint availability. The site countdown
 * uses the same launch instant when VITE_MINT_START_AT is configured at build
 * time as an ISO-8601 value with a timezone, for example:
 *   VITE_MINT_START_AT=2026-08-01T18:00:00Z
 */
const configuredMintStart = import.meta.env.VITE_MINT_START_AT?.trim();
const hasExplicitTimeZone = configuredMintStart
  ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(configuredMintStart)
  : false;
const parsedMintStart = configuredMintStart && hasExplicitTimeZone
  ? Date.parse(configuredMintStart)
  : Number.NaN;

export const MINT_TARGET_MS: number | null = Number.isFinite(parsedMintStart)
  ? parsedMintStart
  : null;

export const MINT_DATE_LABEL = MINT_TARGET_MS === null
  ? 'TBA'
  : new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(MINT_TARGET_MS));

interface Remaining { days: number; hours: number; minutes: number; seconds: number; done: boolean; }

const getRemaining = (targetMs: number): Remaining => {
  const diff = targetMs - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
    done: false,
  };
};

const CountdownCell = ({ value, label }: { value: number | string; label: string }) => (
  <div className="flex min-w-0 flex-col items-center">
    <span className="font-heading text-2xl tabular-nums text-white sm:text-4xl">
      {typeof value === 'number' ? String(value).padStart(2, '0') : value}
    </span>
    <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-100/50 sm:text-[10px] sm:tracking-[0.25em]">
      {label}
    </span>
  </div>
);

const CountdownCells = ({ remaining }: { remaining: Remaining | null }) => (
  <div
    role="timer"
    aria-label={remaining ? 'Time remaining until the Sweetardio mint' : 'Mint countdown awaiting a launch date'}
    className="flex w-full items-start justify-center gap-1 sm:gap-6"
  >
    <CountdownCell value={remaining?.days ?? '--'} label="Days" />
    <span aria-hidden className="font-heading text-2xl text-sweetardios-violet sm:text-4xl">:</span>
    <CountdownCell value={remaining?.hours ?? '--'} label="Hrs" />
    <span aria-hidden className="font-heading text-2xl text-sweetardios-violet sm:text-4xl">:</span>
    <CountdownCell value={remaining?.minutes ?? '--'} label="Min" />
    <span aria-hidden className="font-heading text-2xl text-sweetardios-violet sm:text-4xl">:</span>
    <CountdownCell value={remaining?.seconds ?? '--'} label="Sec" />
  </div>
);

const Countdown = ({ targetMs }: { targetMs: number }) => {
  const [remaining, setRemaining] = useState<Remaining>(() => getRemaining(targetMs));

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = getRemaining(targetMs);
      setRemaining(next);
      if (next.done) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (remaining.done) {
    return (
      <p role="status" className="sw-glow-cerise font-heading text-xl text-sweetardios-cerise sm:text-3xl">
        Countdown ended — check mint availability below 🍬
      </p>
    );
  }

  return <CountdownCells remaining={remaining} />;
};

interface MintSectionProps {
  asPage?: boolean;
}

/* Full on-site mint controls on both the homepage and dedicated /mint route. */
const MintSection = ({ asPage = false }: MintSectionProps) => {
  const Heading = asPage ? 'h1' : 'h2';

  return (
    <section
      id={asPage ? 'on-site-mint' : 'mint'}
      className="relative mx-auto max-w-4xl px-6 py-20 sm:py-24"
    >
      <div className="relative bg-gradient-to-br from-sweetardios-cerise/50 via-sweetardios-violet/25 to-sweetardios-cyan/50 p-px shadow-[0_40px_120px_-40px_rgba(247,21,171,0.6)]">
        <div className="relative overflow-hidden bg-sweetardios-oxford/85 px-4 py-12 text-center backdrop-blur-2xl sm:px-14 sm:py-14">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <span className="mb-5 inline-flex items-center gap-2.5 border border-sweetardios-cerise/40 bg-white/[0.04] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-sweetardios-cerise backdrop-blur">
            <span className="h-1.5 w-1.5 bg-sweetardios-cerise shadow-[0_0_8px_#F715AB]" style={{ borderRadius: '9999px' }} />
            <span>On-site Mint<span className="hidden min-[400px]:inline"> · Powered by LaunchMyNFT</span></span>
          </span>

          <Heading className="font-heading text-4xl text-white sm:text-5xl">
            <span className="sw-glow-cerise text-sweetardios-cerise">Mint</span>{' '}
            <span className="sw-glow-cyan text-sweetardios-cyan">a Sweetardio</span>
          </Heading>

          {MINT_TARGET_MS === null ? (
            <>
              <p className="mt-4 font-heading text-2xl text-white sm:text-3xl">
                New mint date: <span className="sw-glow-cyan text-sweetardios-cyan">TBA</span>
              </p>
              <div className="mt-8">
                <CountdownCells remaining={null} />
              </div>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-blue-100/70">
                The confirmed date will appear here and on{' '}
                <Link to="/board" className="font-semibold text-sweetardios-cerise transition-colors hover:text-white">
                  The Board
                </Link>
                . Join the whitelist so you don't miss it.
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 font-heading text-2xl text-white sm:text-3xl">{MINT_DATE_LABEL}</p>
              <div className="mt-8">
                <Countdown targetMs={MINT_TARGET_MS} />
              </div>
            </>
          )}

          <div className="mt-10">
            <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed text-blue-100/70">
              Connect your Solana wallet and mint without leaving Sweetardio.fun. LaunchMyNFT controls
              the live price, eligibility, supply, and transaction details.
            </p>
            <MintEmbed />
          </div>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={MINT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="sw-shine inline-flex w-full items-center justify-center gap-2 px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-7 sm:text-sm"
              style={{ background: '#34EDF3' }}
            >
              Use LaunchMyNFT directly <span aria-hidden>↗</span>
            </a>
            <Link
              to="/whitelist"
              className="inline-flex w-full items-center justify-center gap-2 border border-sweetardios-cyan/50 px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-sweetardios-cyan transition-colors hover:bg-sweetardios-cyan hover:text-sweetardios-oxford sm:w-auto sm:px-7 sm:text-sm"
            >
              Join the whitelist <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MintSection;
