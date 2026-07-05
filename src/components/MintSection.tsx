import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MintEmbed, { MINT_URL } from './MintEmbed';

/**
 * Mint day: rescheduled — new date TBA.
 *
 * When the new date is locked in, set both values below and the countdown
 * comes back automatically (label shows everywhere the date is mentioned):
 *   MINT_DATE_LABEL = 'August 1, 2026 · 2:00 PM ET'
 *   MINT_TARGET_MS  = Date.UTC(2026, 7, 1, 18, 0, 0)   // month is 0-based; use UTC
 */
export const MINT_DATE_LABEL = 'TBA';
const MINT_TARGET_MS: number | null = null;

interface Remaining { days: number; hours: number; minutes: number; seconds: number; done: boolean; }

const getRemaining = (): Remaining => {
  const diff = (MINT_TARGET_MS ?? 0) - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
    done: false,
  };
};

const CountdownCell = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="font-heading text-3xl tabular-nums text-white sm:text-4xl">
      {String(value).padStart(2, '0')}
    </span>
    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-100/50">{label}</span>
  </div>
);

const Countdown = () => {
  const [t, setT] = useState<Remaining>(getRemaining);
  useEffect(() => {
    const id = setInterval(() => setT(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  if (t.done) {
    return (
      <p className="sw-glow-cerise font-heading text-2xl text-sweetardios-cerise sm:text-3xl">
        Mint is live — go go go 🍬
      </p>
    );
  }

  return (
    <div className="flex items-start justify-center gap-4 sm:gap-6">
      <CountdownCell value={t.days} label="Days" />
      <span className="font-heading text-3xl text-sweetardios-violet sm:text-4xl">:</span>
      <CountdownCell value={t.hours} label="Hrs" />
      <span className="font-heading text-3xl text-sweetardios-violet sm:text-4xl">:</span>
      <CountdownCell value={t.minutes} label="Min" />
      <span className="font-heading text-3xl text-sweetardios-violet sm:text-4xl">:</span>
      <CountdownCell value={t.seconds} label="Sec" />
    </div>
  );
};

/* Upcoming Sweetardio mint — date, countdown, LaunchMyNFT embed + CTAs. */
const MintSection = () => (
  <section id="mint" className="relative mx-auto max-w-4xl px-6 py-20 sm:py-24">
    <div className="relative bg-gradient-to-br from-sweetardios-cerise/50 via-sweetardios-violet/25 to-sweetardios-cyan/50 p-px shadow-[0_40px_120px_-40px_rgba(247,21,171,0.6)]">
      <div className="relative overflow-hidden bg-sweetardios-oxford/85 px-8 py-12 text-center backdrop-blur-2xl sm:px-14 sm:py-14">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <span className="mb-5 inline-flex items-center gap-2.5 border border-sweetardios-cerise/40 bg-white/[0.04] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-sweetardios-cerise backdrop-blur">
          <span className="h-1.5 w-1.5 bg-sweetardios-cerise shadow-[0_0_8px_#F715AB]" style={{ borderRadius: '9999px' }} />
          Upcoming Mint · LaunchMyNFT
        </span>

        <h2 className="font-heading text-4xl text-white sm:text-5xl">
          <span className="sw-glow-cerise text-sweetardios-cerise">Mint</span>{' '}
          <span className="sw-glow-cyan text-sweetardios-cyan">a Sweetardio</span>
        </h2>

        {/* Mint day — countdown when a date is set, TBA note otherwise */}
        {MINT_TARGET_MS === null ? (
          <>
            <p className="mt-4 font-heading text-2xl text-white sm:text-3xl">
              New mint date: <span className="sw-glow-cyan text-sweetardios-cyan">TBA</span>
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-blue-100/70">
              The mint has been rescheduled — the new date drops on{' '}
              <Link to="/board" className="font-semibold text-sweetardios-cerise transition-colors hover:text-white">
                The Board
              </Link>{' '}
              first. Join the whitelist below so you don't miss it.
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 font-heading text-2xl text-white sm:text-3xl">{MINT_DATE_LABEL}</p>
            <div className="mt-8">
              <Countdown />
            </div>
          </>
        )}

        <div className="mt-10">
          <MintEmbed />
        </div>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={MINT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="sw-shine inline-flex items-center gap-2 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5"
            style={{ background: '#F715AB' }}
          >
            Mint on LaunchMyNFT <span aria-hidden>↗</span>
          </a>
          <Link
            to="/whitelist"
            className="inline-flex items-center gap-2 border border-sweetardios-cyan/50 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-cyan transition-colors hover:bg-sweetardios-cyan hover:text-sweetardios-oxford"
          >
            Join the whitelist <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default MintSection;
