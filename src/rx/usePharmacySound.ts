/**
 * The pharmacy's sound:
 *
 *   - a background loop, gapless (Web Audio): full on the street, half as
 *     loud once you're inside, gliding between the two as you come and go;
 *   - on the street only, rain: a second gapless loop, faded out indoors;
 *   - on the street only, the supplied voice recordings over it, one at a
 *     time, shuffled so each plays once before any repeats, with a pause
 *     between.
 *
 * Browsers block sound until a visitor has touched the page, so on a first
 * visit both wait for the first tap, click or key press. A hidden tab goes
 * quiet and picks up where it left off.
 */
import { useEffect, useRef } from 'react';
import { audioContext } from './sfx';

export type Where = 'street' | 'inside';

const BED = '/rx/audio/street-bed.mp3';
/** Inside, the street is half as loud. */
const BED_VOLUME: Record<Where, number> = { street: 0.35, inside: 0.35 * 0.5 };
const RAIN = '/rx/audio/street-rain.mp3';
const RAIN_VOLUME = 0.4;

const CLIPS = [
  'dr-siebert',
  'but-you-prescribed-it',
  'fda-black-box',
  'drowsy',
  'medication-alarm',
  'take-your-pills-lewber',
  'meds',
  'box-of-twinkies',
  'american-pie',
  'dude-sweet',
].map((name) => `/rx/audio/${name}.mp3`);
const CLIP_VOLUME = 0.85;

/** After arriving on the street. */
const FIRST_MS: [number, number] = [1500, 4000];
/** After a clip ends. */
const GAP_MS: [number, number] = [6000, 15000];
/** After the first touch unlocks sound (long enough that a tap on the door leaves first). */
const UNLOCK_MS = 1200;

/**
 * What counts as a touch that allows sound. iOS doesn't accept pointerdown
 * from a finger; touchend and click it does.
 */
const GESTURES = ['pointerdown', 'touchend', 'click', 'keydown'] as const;

const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo);

/** `where` is null while nothing should play (the phone notice). */
export function usePharmacySound(where: Where | null): void {
  const bed = useRef<Bed | null>(null);
  const on = where !== null;

  // One loop for the whole visit, so walking in and out never restarts it.
  useEffect(() => {
    if (!on) return undefined;
    const b = startBed(BED);
    bed.current = b;
    return () => {
      b.stop();
      bed.current = null;
    };
  }, [on]);

  useEffect(() => {
    if (where) bed.current?.level(BED_VOLUME[where]);
  }, [where]);

  useEffect(() => {
    if (where !== 'street') return undefined;
    const rain = startBed(RAIN);
    rain.level(RAIN_VOLUME);
    return rain.stop;
  }, [where]);

  useEffect(() => (where === 'street' ? startClips() : undefined), [where]);
}

// ── the background loops ───────────────────────────────────────────────────

type Loop = { buffer: AudioBuffer; start: number; end: number } | null;
const loops = new Map<string, Promise<Loop>>();

function loadLoop(ctx: AudioContext, src: string): Promise<Loop> {
  let loop = loops.get(src);
  if (!loop) {
    loop = fetch(src)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(`${res.status}`))))
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => ({ buffer, ...audibleSpan(buffer) }))
      .catch(() => {
        loops.delete(src);
        return null;
      });
    loops.set(src, loop);
  }
  return loop;
}

/** The loop was cut to be seamless; skip any decoder padding at either end so it stays so. */
function audibleSpan(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0);
  let a = 0;
  while (a < data.length && Math.abs(data[a]) < 2e-3) a++;
  let b = data.length - 1;
  while (b > a && Math.abs(data[b]) < 2e-3) b--;
  return { start: a / buffer.sampleRate, end: (b + 1) / buffer.sampleRate };
}

interface Bed {
  /** Glide to this volume; the first one is where the fade-in ends. */
  level(volume: number): void;
  stop(): void;
}

function startBed(src: string): Bed {
  const ctx = audioContext();
  if (!ctx) return { level() {}, stop() {} };
  let stopped = false;
  let starting = false;
  let volume = 0;
  let source: AudioBufferSourceNode | null = null;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);

  const glide = (to: number, seconds: number) => {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(to, now + seconds);
  };

  const begin = async () => {
    if (stopped || source || starting || ctx.state !== 'running') return;
    starting = true;
    const bed = await loadLoop(ctx, src);
    starting = false;
    if (stopped || source || !bed) return;
    source = ctx.createBufferSource();
    source.buffer = bed.buffer;
    source.loop = true;
    source.loopStart = bed.start;
    source.loopEnd = bed.end;
    source.connect(gain);
    source.start(0, bed.start);
    glide(volume, 1.5);
  };
  const unlock = () => {
    ctx.resume().then(begin, () => {});
  };
  const onVisibility = () => {
    if (document.hidden) void ctx.suspend();
    else unlock();
  };

  GESTURES.forEach((type) => window.addEventListener(type, unlock));
  document.addEventListener('visibilitychange', onVisibility);
  void loadLoop(ctx, src); // fetch and decode now; decoding works before sound is allowed
  if (!document.hidden) unlock(); // plays straight away if sound is already allowed

  return {
    level(to) {
      if (to === volume) return;
      volume = to;
      if (source) glide(to, 1);
    },
    stop() {
      stopped = true;
      GESTURES.forEach((type) => window.removeEventListener(type, unlock));
      document.removeEventListener('visibilitychange', onVisibility);
      glide(0, 0.6);
      source?.stop(ctx.currentTime + 0.65);
      window.setTimeout(() => gain.disconnect(), 1000);
    },
  };
}

// ── the voices ─────────────────────────────────────────────────────────────

let bag: string[] = [];
let last: string | null = null;

function nextClip(): string {
  if (!bag.length) {
    bag = [...CLIPS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag[0] === last && bag.length > 1) [bag[0], bag[1]] = [bag[1], bag[0]];
  }
  last = bag.shift() ?? CLIPS[0];
  return last;
}

/**
 * Every clip plays through one element: iOS lets an element make sound only
 * after it has been started from a touch, and a new element each time would
 * never be. (iOS also ignores volume, so there the clips play at full level.)
 */
let voice: HTMLAudioElement | null = null;
let take = 0;
const voiceElement = () => (voice ??= new Audio());

/** Inside a touch: start and stop the voice element so later clips may sound. */
function primeVoice(): void {
  const el = voiceElement();
  if (el.dataset.primed || !el.paused) return;
  el.dataset.primed = '1';
  if (!el.src) el.src = CLIPS[0];
  el.muted = true;
  el.play().then(
    () => {
      el.pause();
      el.muted = false;
    },
    () => {
      el.muted = false;
      delete el.dataset.primed;
    },
  );
}

function fadeOut(el: HTMLAudioElement, which: number): void {
  const from = el.volume;
  const start = performance.now();
  const step = () => {
    if (take !== which) return; // a new clip has taken over the element
    const k = Math.min(1, (performance.now() - start) / 400);
    el.volume = from * (1 - k);
    if (k < 1) requestAnimationFrame(step);
    else el.pause();
  };
  requestAnimationFrame(step);
}

function startClips(): () => void {
  let stopped = false;
  let timer = 0;
  let playing: number | null = null;
  let waitFor: Array<[EventTarget, string]> = [];

  const schedule = (ms: number) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(play, ms);
  };
  const stopWaiting = () => {
    waitFor.forEach(([target, type]) => target.removeEventListener(type, resume));
    waitFor = [];
  };
  function resume() {
    stopWaiting();
    primeVoice();
    if (!stopped) schedule(document.hidden ? between(FIRST_MS) : UNLOCK_MS);
  }
  const waitUntil = (...events: Array<[EventTarget, string]>) => {
    stopWaiting();
    events.forEach(([target, type]) => target.addEventListener(type, resume));
    waitFor = events;
  };

  function play() {
    if (stopped || playing) return;
    if (document.hidden) {
      waitUntil([document, 'visibilitychange']);
      return;
    }
    const src = nextClip();
    const el = voiceElement();
    const mine = ++take;
    el.src = src;
    el.muted = false;
    el.volume = CLIP_VOLUME;
    playing = mine;
    const done = () => {
      if (playing !== mine) return;
      playing = null;
      if (!stopped) schedule(between(GAP_MS));
    };
    el.onended = done;
    el.onerror = done;
    el.play().catch(() => {
      // Not allowed to make sound yet: keep this clip for the first touch.
      if (playing !== mine) return;
      playing = null;
      bag.unshift(src);
      if (!stopped) waitUntil(...GESTURES.map((type): [EventTarget, string] => [window, type]));
    });
  }

  schedule(between(FIRST_MS));
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    stopWaiting();
    if (playing !== null && voice) fadeOut(voice, playing);
    playing = null;
  };
}
