import { useEffect, useState } from 'react';
import { MINT_TARGET_MS } from './MintSection';

function parts(ms: number) {
  const clamped = Math.max(0, ms);
  const s = Math.floor(clamped / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

function Flap({
  digit,
  half,
  extra,
  onEnd,
}: {
  digit: string;
  half: 'top' | 'bottom';
  extra?: string;
  onEnd?: () => void;
}) {
  return (
    <div className={`flip-flap ${half}${extra ? ` ${extra}` : ''}`} onAnimationEnd={onEnd}>
      <span className="flip-num">{digit}</span>
    </div>
  );
}

function FlipDigit({ value }: { value: string }) {
  const reduced = usePrefersReducedMotion();
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value === current) return;
    if (reduced) {
      setPrevious(value);
      setCurrent(value);
      setFlipping(false);
      return;
    }
    setPrevious(current);
    setCurrent(value);
    setFlipping(true);
  }, [value, current, reduced]);

  return (
    <div className="flip" data-digit={current}>
      <Flap digit={current} half="top" />
      <Flap digit={flipping ? previous : current} half="bottom" />
      {flipping ? (
        <>
          <Flap key={`fold-${previous}-${current}`} digit={previous} half="top" extra="fold" />
          <Flap
            key={`unfold-${previous}-${current}`}
            digit={current}
            half="bottom"
            extra="unfold"
            onEnd={() => {
              setPrevious(current);
              setFlipping(false);
            }}
          />
        </>
      ) : null}
      <span className="flip-hinge" aria-hidden />
      <span className="flip-axle left" aria-hidden />
      <span className="flip-axle right" aria-hidden />
    </div>
  );
}

function Pair({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  const display = String(value).padStart(2, '0');
  return (
    <div className={`count-unit${accent ? ' is-accent' : ''}`}>
      <div className="count-pair">
        <FlipDigit value={display[0]} />
        <FlipDigit value={display[1]} />
      </div>
      <span className="count-label">{label}</span>
    </div>
  );
}

function Colon() {
  return (
    <div className="count-colon" aria-hidden>
      <span />
      <span />
    </div>
  );
}

export default function FlipCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (MINT_TARGET_MS === null) {
    return (
      <div className="count-board" aria-label="Mint date to be announced">
        <p className="count-kicker">Mint date</p>
        <p className="count-caption">TBA</p>
      </div>
    );
  }

  const left = MINT_TARGET_MS - now;
  if (left <= 0) {
    return (
      <div className="count-live" role="status">
        <span className="count-live-dot" />
        Mint is live
      </div>
    );
  }

  const t = parts(left);
  const spoken = `${t.d} days, ${t.h} hours, ${t.m} minutes, ${t.s} seconds until mint`;

  return (
    <div className="count-board" aria-label={spoken}>
      <p className="count-kicker">
        <span className="count-live-dot" />
        Mint opens in
      </p>
      <div className="count-row">
        <Pair value={t.d} label="Days" />
        <Colon />
        <Pair value={t.h} label="Hours" />
        <Colon />
        <Pair value={t.m} label="Mins" />
        <Colon />
        <Pair value={t.s} label="Secs" accent />
      </div>
      <p className="count-caption">September 14 · 12:00 UTC</p>
    </div>
  );
}
