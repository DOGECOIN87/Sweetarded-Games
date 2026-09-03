/* The Sweetardio reel — an X post embedded straight from the collection's feed. */

import { useEffect, useRef, useState } from 'react';
import SectionHeading from './SectionHeading';

/** The post to feature. Swap the id to feature a different one. */
const TWEET_ID = '2095050125282357719';
const TWEET_URL = `https://x.com/Sweetardio/status/${TWEET_ID}`;

const WIDGETS_SRC = 'https://platform.twitter.com/widgets.js';

declare global {
  interface Window {
    twttr?: { widgets?: { load: (el?: HTMLElement) => void } };
  }
}

/**
 * Load X's widget script once per page and resolve when it's ready.
 *
 * Several embeds on one page would otherwise each append their own copy of
 * the script, so the promise is cached on the module.
 */
let widgetsPromise: Promise<void> | null = null;
function loadWidgets(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.twttr?.widgets) return Promise.resolve();
  if (widgetsPromise) return widgetsPromise;

  widgetsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGETS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('widgets.js failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = WIDGETS_SRC;
    script.async = true;
    script.charset = 'utf-8';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('widgets.js failed'));
    document.head.appendChild(script);
  });
  return widgetsPromise;
}

const SweetardioVideo = () => {
  const holderRef = useRef<HTMLDivElement>(null);
  // The embed can be blocked by a tracker blocker or a locked-down network, so
  // the section always has a link card to fall back to.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadWidgets()
      .then(() => {
        if (cancelled || !holderRef.current) return;
        window.twttr?.widgets?.load(holderRef.current);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    // If the widget never swaps the blockquote out for an iframe, treat the
    // embed as blocked rather than leaving a bare quote sitting on the page.
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (!holderRef.current?.querySelector('iframe')) setFailed(true);
    }, 6000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <SectionHeading
        eyebrow="The Reel"
        title={
          <>
            STRAIGHT FROM THE <span className="text-sweetardios-cerise">FEED</span>
          </>
        }
        sub="Fresh off the Sweetardio timeline."
      />

      <div className="mt-10 flex justify-center">
        <div className="w-full max-w-[550px]">
          {!failed && (
            <div ref={holderRef} className="sw-tweet-embed">
              <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true" data-align="center">
                <a href={TWEET_URL}>Watch on X</a>
              </blockquote>
            </div>
          )}

          {failed && (
            <a
              href={TWEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 border border-white/10 bg-white/[0.03] px-6 py-12 text-center transition-all hover:-translate-y-0.5 hover:border-sweetardios-cyan/60 hover:shadow-[0_0_22px_-4px_rgba(52,237,243,0.5)]"
            >
              <span className="font-heading text-xl text-sweetardios-cyan">Watch on X</span>
              <span className="text-sm text-blue-100/60">
                The embed couldn&rsquo;t load here — open the post to watch it.
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default SweetardioVideo;
