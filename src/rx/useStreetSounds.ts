/**
 * The street's sound (ROOM 1), and nowhere else:
 *
 *   - a background loop, gapless (Web Audio), fading in on arrival and out
 *     on leaving;
 *   - the supplied voice recordings over it, one at a time, shuffled so each
 *     plays once before any repeats, with a pause between.
 *
 * Browsers block sound until a visitor has touched the page, so on a first
 * visit both wait for the first tap, click or key press. A hidden tab goes
 * quiet and picks up where it left off.
 */
import { useEffect } from 'react';
import { audioContext } from './sfx';

const BED = '/rx/audio/street-bed.mp3';
const BED_VOLUME = 0.35;

const CLIPS = [
  'dr-siebert',
  'but-you-prescribed-it',
  'fda-black-box',
  'drowsy',
  'medication-alarm',
  'take-your-pills-lewber',
  'meds',
  '1_5102687100612903363',
].map((name) => `/rx/audio/${name}.mp3`);
const CLIP_VOLUME = 0.85;

/** After arriving on the street. */
const FIRST_MS: [number, number] = [1500, 4000];
/** After a clip ends. */
const GAP_MS: [number, number] = [6000, 15000];
/** After the first touch unlocks sound (long enough that a tap on the door leaves first). */
const UNLOCK_MS = 1200;

const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo);

export function useStreetSounds(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    const stopBed = startBed();
    const stopClips = startClips();
    return () => {
      stopBed();
      stopClips();
    };
  }, [active]);
}

// ── the background loop ────────────────────────────────────────────────────

let bedBuffer: Promise<{ buffer: AudioBuffer; start: number; end: number } | null> | null = null;

function loadBed(ctx: AudioContext) {
  bedBuffer ??= fetch(BED)
    .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(`${res.status}`))))
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => ({ buffer, ...audibleSpan(buffer) }))
    .catch(() => {
      bedBuffer = null;
      return null;
    });
  return bedBuffer;
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

function startBed(): () => void {
  const ctx = audioContext();
  if (!ctx) return () => {};
  let stopped = false;
  let starting = false;
  let source: AudioBufferSourceNode | null = null;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);

  const begin = async () => {
    if (stopped || source || starting || ctx.state !== 'running') return;
    starting = true;
    const bed = await loadBed(ctx);
    starting = false;
    if (stopped || source || !bed) return;
    source = ctx.createBufferSource();
    source.buffer = bed.buffer;
    source.loop = true;
    source.loopStart = bed.start;
    source.loopEnd = bed.end;
    source.connect(gain);
    source.start(0, bed.start);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(BED_VOLUME, now + 1.5);
  };
  const unlock = () => {
    ctx.resume().then(begin, () => {});
  };
  const onVisibility = () => {
    if (document.hidden) void ctx.suspend();
    else unlock();
  };

  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', onVisibility);
  void loadBed(ctx); // fetch and decode now; decoding works before sound is allowed
  if (!document.hidden) unlock(); // plays straight away if sound is already allowed

  return () => {
    stopped = true;
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    document.removeEventListener('visibilitychange', onVisibility);
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.6);
    source?.stop(now + 0.65);
    window.setTimeout(() => gain.disconnect(), 1000);
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

function fadeOut(el: HTMLAudioElement): void {
  const from = el.volume;
  const start = performance.now();
  const step = () => {
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
  let playing: HTMLAudioElement | null = null;
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
    const el = new Audio(src);
    el.volume = CLIP_VOLUME;
    playing = el;
    const done = () => {
      if (playing !== el) return;
      playing = null;
      if (!stopped) schedule(between(GAP_MS));
    };
    el.addEventListener('ended', done, { once: true });
    el.addEventListener('error', done, { once: true });
    el.play().catch(() => {
      // Not allowed to make sound yet: keep this clip for the first touch.
      if (playing !== el) return;
      playing = null;
      bag.unshift(src);
      if (!stopped) waitUntil([window, 'pointerdown'], [window, 'keydown']);
    });
  }

  schedule(between(FIRST_MS));
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    stopWaiting();
    if (playing) fadeOut(playing);
    playing = null;
  };
}
