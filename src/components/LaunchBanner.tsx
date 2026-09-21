import { Link } from 'react-router-dom';
import { LAUNCH_HEADLINE, LAUNCH_NOTICE, LAUNCH_SUBLINE } from '../content/announcement';

/**
 * Site-wide launch status bar, sitting directly under the nav on every route.
 * It is deliberately outside <header> so the sticky nav keeps its 56px
 * --navbar-height, which the page min-height calculations depend on.
 */
const LaunchBanner = () => (
  <aside
    aria-label={LAUNCH_NOTICE}
    className="relative border-b border-sweetardios-violet/40 bg-gradient-to-r from-sweetardios-cerise/20 via-sweetardios-violet/20 to-sweetardios-cyan/20 backdrop-blur"
  >
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sweetardios-cyan/60 to-transparent" />
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-1.5 px-4 py-2.5 text-center sm:flex-row sm:gap-3 sm:py-2">
      <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white sm:text-xs sm:tracking-[0.2em]">
        <span className="count-live-dot" aria-hidden />
        {LAUNCH_HEADLINE}
      </span>
      <Link
        to="/whitelist"
        className="sw-glow-cyan text-[11px] font-extrabold uppercase tracking-[0.16em] text-sweetardios-cyan transition-colors hover:text-white sm:text-xs sm:tracking-[0.2em]"
      >
        {LAUNCH_SUBLINE} <span aria-hidden>→</span>
      </Link>
    </div>
  </aside>
);

export default LaunchBanner;
