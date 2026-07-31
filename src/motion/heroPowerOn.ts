/**
 * Landing hero "power-on" — Theatre.js choreography.
 *
 * @theatre/core plays back the committed state in src/motion/sweetardio-motion.json.
 * In `npm run dev`, the Theatre Studio overlay attaches automatically (see
 * src/index.tsx) so the sequence can be re-choreographed visually; export the
 * new state from the Studio menu and replace the JSON. Full flow in MOTION.md.
 *
 * The hook writes styles straight to the DOM via refs — no React re-renders
 * during playback. If the sequence is disabled (reduced motion, or it already
 * played this session), elements simply keep their CSS resting state.
 */
import { useCallback, useLayoutEffect, useRef } from 'react';
import { getProject, types as t } from '@theatre/core';
import state from './sweetardio-motion.json';

const project = getProject('Sweetardio', { state });
const sheet = project.sheet('Hero');

const num = (v: number) => t.number(v, { range: [-60, 60] });
const fade = (v: number) => t.number(v, { range: [0, 1] });

/** Element keys the hero registers; each maps 1:1 to a sheet object. */
export type HeroEl =
  | 'panel' | 'badge' | 'chip' | 'wordmark' | 'fun'
  | 'tagline' | 'kicker' | 'arrowL' | 'arrowC' | 'arrowR';

const OBJECTS = {
  panel:    sheet.object('Panel',    { opacity: fade(1), y: num(0), scale: t.number(1, { range: [0.9, 1.1] }) }),
  badge:    sheet.object('Badge',    { opacity: fade(1), y: num(0) }),
  chip:     sheet.object('Chip',     { opacity: fade(1), y: num(0) }),
  wordmark: sheet.object('Wordmark', { opacity: fade(1), y: num(0) }),
  fun:      sheet.object('Fun',      { opacity: fade(1), y: num(0) }),
  tagline:  sheet.object('Tagline',  { opacity: fade(1), y: num(0) }),
  kicker:   sheet.object('Kicker',   { opacity: fade(1), y: num(0) }),
  arrowL:   sheet.object('ArrowL',   { opacity: fade(1), y: num(0) }),
  arrowC:   sheet.object('ArrowC',   { opacity: fade(1), y: num(0) }),
  arrowR:   sheet.object('ArrowR',   { opacity: fade(1), y: num(0) }),
} as const;

const SESSION_KEY = 'sw-poweron-played';

/** True when the intro should run on this mount. */
export function shouldPlayPowerOn(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}

/**
 * Registers hero elements and plays the sequence once.
 * Usage: const reg = useHeroPowerOn(enabled); ... <div ref={reg('badge')}>
 */
export function useHeroPowerOn(enabled: boolean) {
  const els = useRef<Partial<Record<HeroEl, HTMLElement | null>>>({});

  const register = useCallback(
    (key: HeroEl) => (node: HTMLElement | null) => {
      els.current[key] = node;
    },
    [],
  );

  useLayoutEffect(() => {
    if (!enabled) return;

    /* onValuesChange fires synchronously with position-0 values, so the
       "everything dark" pose lands before first paint — no flash. */
    const unsubs = (Object.keys(OBJECTS) as HeroEl[]).map((key) =>
      OBJECTS[key].onValuesChange((v: { opacity: number; y: number; scale?: number }) => {
        const el = els.current[key];
        if (!el) return;
        el.style.opacity = String(v.opacity);
        el.style.transform =
          `translateY(${v.y}px)` + (v.scale !== undefined ? ` scale(${v.scale})` : '');
      }),
    );

    let cancelled = false;
    let began = false;
    const begin = (via: string) => {
      if (cancelled || began) return;
      began = true;
      (window as any).__poweron = via; /* diag marker — console is stripped in prod */
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch { /* private mode — replaying is fine */ }
      sheet.sequence.position = 0;
      void sheet.sequence.play();
    };

    const fontsReady =
      'fonts' in document ? document.fonts.ready.catch(() => undefined) : Promise.resolve();
    const fontTimeout = new Promise((r) => setTimeout(r, 600));

    Promise.race([fontsReady, fontTimeout]).then(() => {
      if (cancelled) return;
      /* Start when the project reports ready — but don't trust that promise
         with the whole show: begin on resolve OR reject, and if it simply
         never settles, a stuck-detector kicks playback off anyway. */
      project.ready.then(() => begin('ready'), () => begin('ready-rejected'));
      setTimeout(() => begin('fallback'), 900);
    });

    return () => {
      cancelled = true;
      sheet.sequence.pause();
      unsubs.forEach((u) => u());
      /* Leave elements at their CSS resting state if we unmount mid-play. */
      (Object.keys(els.current) as HeroEl[]).forEach((key) => {
        const el = els.current[key];
        if (el) {
          el.style.opacity = '';
          el.style.transform = '';
        }
      });
    };
  }, [enabled]);

  return register;
}
