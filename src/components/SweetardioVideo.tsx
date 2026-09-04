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

type EmbedState = 'loading' | 'ready' | 'failed';

const SweetardioVideo = () => {
  const holderRef = useRef<HTMLDivElement>(null);
  // X embeds are blocked often enough — tracker blockers, strict tracking
  // protection, locked-down networks — that the blocked path has to look
  // deliberate rather than like a broken section.
  const [state, setState] = useState<EmbedState>('loading');

  useEffect(() => {
    let cancelled = false;

    loadWidgets()
      .then(() => {
        if (cancelled || !holderRef.current) return;
        window.twttr?.widgets?.load(holderRef.current);
      })
      .catch(() => {
        if (!cancelled) setState('failed');
      });

    // Poll for the iframe the widget swaps in, so a fast load flips to 'ready'
    // quickly instead of everyone waiting out the full timeout.
    const started = Date.now();
    const poll = setInterval(() => {
      if (cancelled) return;
      if (holderRef.current?.querySelector('iframe')) {
        setState('ready');
        clearInterval(poll);
      } else if (Date.now() - started > 6000) {
        setState('failed');
        clearInterval(poll);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(poll);
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
        <div className={`relative w-full max-w-[550px] ${state === 'ready' ? '' : 'min-h-[320px]'}`}>
          {/* The holder stays mounted and full width while loading so the
              widget measures its container correctly; `invisible` hides it
              without collapsing it, and the skeleton covers it meanwhile. An
              unstyled blockquote flashing on the page reads as a bug. */}
          {state !== 'failed' && (
            <div
              ref={holderRef}
              aria-busy={state === 'loading'}
              className={state === 'ready' ? 'w-full' : 'invisible absolute inset-x-0 top-0'}
            >
              <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true" data-align="center">
                <a href={TWEET_URL}>Watch on X</a>
              </blockquote>
            </div>
          )}

          {state === 'loading' && (
            <div
              aria-hidden
              className="flex min-h-[320px] animate-pulse flex-col items-center justify-center gap-3 border border-white/10 bg-white/[0.03]"
            >
              <span className="text-xs uppercase tracking-[0.3em] text-blue-100/35">Loading the reel…</span>
            </div>
          )}

          {state === 'failed' && (
            <a
              href={TWEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[320px] flex-col items-center justify-center gap-4 border border-sweetardios-cyan/25 bg-white/[0.03] px-6 py-12 text-center transition-all hover:-translate-y-0.5 hover:border-sweetardios-cyan/60 hover:shadow-[0_0_22px_-4px_rgba(52,237,243,0.5)]"
            >
              <span
                aria-hidden
                className="flex h-16 w-16 items-center justify-center border border-sweetardios-cyan/40 text-2xl text-sweetardios-cyan transition-transform group-hover:scale-110"
                style={{ borderRadius: '9999px' }}
              >
                ▶
              </span>
              <span className="font-heading text-xl text-sweetardios-cyan">Watch the reel on X</span>
              <span className="max-w-xs text-sm leading-relaxed text-blue-100/55">
                Your browser blocked the embed — open the post to watch it.
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default SweetardioVideo;
