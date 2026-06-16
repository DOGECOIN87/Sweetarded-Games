import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Choppa Cone — the site mascot. Sits in the corner with a white/cyan speech
 * bubble that rotates contextual tips based on the current route. Click him to
 * toggle the bubble; dismiss with the ×.
 */
const TIPS: Record<string, string[]> = {
  '/': [
    "Yo! Welcome to Sweetarded Games — pick a game below to jump in.",
    "Everything's free to play for fun right now. Go nuts. 🍦",
    "I'm Choppa Cone, your guide. Tap me anytime for tips.",
  ],
  '/slots': [
    "Line up 3 Sweetardios on a payline to bag a win.",
    "Trigger the bonus round for the big sugar rush.",
    "Free play — spin as much as you want, no tokens needed.",
  ],
  '/coinpusher': [
    "Drop candy tokens and shove the pile over the edge.",
    "Bump the table to knock a fat stack loose.",
    "It's free to play — stack 'em sky high!",
  ],
};
const FALLBACK = ["Need a hand? I'm Choppa Cone — your guide around the site."];

const MascotGuide: React.FC = () => {
  const { pathname } = useLocation();
  const tips = useMemo(() => TIPS[pathname] ?? FALLBACK, [pathname]);
  const [open, setOpen] = useState(true);
  const [idx, setIdx] = useState(0);

  // reset to the first tip + reopen whenever the route changes
  useEffect(() => {
    setIdx(0);
    setOpen(true);
  }, [pathname]);

  // rotate through the page's tips
  useEffect(() => {
    if (!open || tips.length < 2) return;
    const t = setInterval(() => setIdx((v) => (v + 1) % tips.length), 6500);
    return () => clearInterval(t);
  }, [open, tips]);

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-40 flex items-end gap-2 sm:bottom-5 sm:left-5">
      {/* Mascot */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle guide"
        className="pointer-events-auto relative shrink-0"
      >
        <span
          aria-hidden
          className="sw-blob absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2"
          style={{ background: '#34EDF3', opacity: 0.5 }}
        />
        <img
          src="/mascot.png"
          alt="Choppa Cone mascot"
          className="sw-float relative h-24 w-24 drop-shadow-[0_10px_22px_rgba(0,0,0,0.5)] sm:h-32 sm:w-32"
        />
      </button>

      {/* Speech bubble (white w/ cyan accent) */}
      {open && (
        <div className="pointer-events-auto relative mb-10 max-w-[15rem] border-2 border-sweetardios-cyan bg-white px-4 py-3 shadow-[0_0_26px_rgba(52,237,243,0.5)] sm:max-w-[18rem]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Dismiss guide"
            className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center border-2 border-sweetardios-cyan bg-white text-xs font-bold leading-none text-sweetardios-oxford transition-colors hover:bg-sweetardios-cyan"
          >
            ×
          </button>
          <p key={idx} className="sw-rise text-[13px] font-semibold leading-snug text-sweetardios-oxford">
            {tips[idx]}
          </p>
          {/* tail pointing left toward the mascot */}
          <span
            aria-hidden
            className="absolute -left-[9px] bottom-4 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-sweetardios-cyan bg-white"
          />
        </div>
      )}
    </div>
  );
};

export default MascotGuide;
