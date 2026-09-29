/**
 * The lights. A tired tube somewhere overhead: a hum always, and every few
 * seconds it stutters — the room drops dark for a beat or three, now and then
 * a long brownout before it catches again. Once sound is allowed, some
 * stutters come with the tube's own buzz and zap, and then the dips land on
 * the zaps in the recording. One screen-wide layer of shadow that never takes
 * a tap. No more than three dips a second, so it never strobes; anyone who
 * asks for reduced motion gets rarer, shallower, single dips.
 */
import { useEffect, useRef } from 'react';
import { audioContext } from './sfx';

const SRC = '/rx/audio/light-flicker.mp3';
const VOLUME = 0.45;
/** Share of stutters that buzz (when sound is allowed). */
const AUDIBLE = 0.5;
/** A dip and its recovery never take less than this: at most three a second. */
const MIN_CYCLE_MS = 340;

const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

type Stutter = { frames: Keyframe[]; ms: number };

/** [duration ms, dip opacity] steps → held (not tweened) keyframes. */
function held(steps: Array<[number, number]>): Stutter {
  const ms = steps.reduce((t, [d]) => t + d, 0);
  let t = 0;
  const frames: Keyframe[] = [{ opacity: 0, offset: 0, easing: 'steps(1, end)' }];
  for (const [d, opacity] of steps) {
    t += d;
    frames.push({ opacity, offset: Math.min(1, t / ms), easing: 'steps(1, end)' });
  }
  return { frames, ms };
}

/** One dip and back, never faster than MIN_CYCLE_MS. */
function dip(depth: number, out = between(70, 150)): Array<[number, number]> {
  return [
    [out, depth],
    [Math.max(MIN_CYCLE_MS - out, between(220, 420)), between(0, 0.05)],
  ];
}

/** A silent stutter: a few dips back to full light, sometimes a slow brownout at the end. */
function stutter(gentle: boolean): Stutter {
  if (gentle) return held([...dip(between(0.14, 0.24), between(160, 260)), [200, 0]]);
  const steps: Array<[number, number]> = [];
  const dips = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < dips; i++) steps.push(...dip(between(0.35, 0.62)));
  if (Math.random() < 0.3) {
    steps.push([between(500, 900), between(0.4, 0.55)]); // brownout
    steps.push([between(120, 200), 0.1]);
    steps.push(...dip(0.5));
  }
  steps.push([between(150, 300), 0]); // caught
  return held(steps);
}

/** The recording's stutter: the light dips on the tube's zaps (loud spikes over the buzz). */
function fromRecording(buffer: AudioBuffer): Stutter {
  const data = buffer.getChannelData(0);
  const win = Math.floor(buffer.sampleRate * 0.02);
  const rms: number[] = [];
  for (let i = 0; i + win <= data.length; i += win) {
    let s = 0;
    for (let j = i; j < i + win; j++) s += data[j] * data[j];
    rms.push(Math.sqrt(s / win));
  }
  const median = [...rms].sort((a, b) => a - b)[Math.floor(rms.length / 2)] || 1e-4;
  const winMs = (win / buffer.sampleRate) * 1000;

  // Each zap starts a dip, as deep as the zap is loud; zaps inside a dip's cycle ride along.
  const steps: Array<[number, number]> = [];
  let at = 0; // ms laid out so far
  rms.forEach((r, i) => {
    const t = i * winMs;
    const k = r / median;
    if (k < 1.8 || t < at) return;
    if (t > at) steps.push([t - at, 0]);
    const cycle = dip(Math.min(0.62, 0.3 + (k - 1.8) * 0.1), 110);
    steps.push(...cycle);
    at = t + cycle[0][0] + cycle[1][0];
  });
  const end = rms.length * winMs;
  steps.push([Math.max(1, end - at), 0]);
  return held(steps);
}

let buffer: Promise<AudioBuffer | null> | null = null;
function loadBuzz(ctx: AudioContext): Promise<AudioBuffer | null> {
  buffer ??= fetch(SRC)
    .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(`${res.status}`))))
    .then((data) => ctx.decodeAudioData(data))
    .catch(() => {
      buffer = null;
      return null;
    });
  return buffer;
}

/** `sound`: the buzz may play (not behind the phone notice). */
export function Flicker({ sound }: { sound: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const audible = useRef(sound);
  audible.current = sound;

  useEffect(() => {
    const el = ref.current;
    if (!el || !el.animate) return undefined;
    const gentle = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = audioContext();
    let buzz: AudioBuffer | null = null;
    let recorded: Stutter | null = null;
    if (ctx)
      void loadBuzz(ctx).then((b) => {
        buzz = b;
        recorded = b && fromRecording(b);
      });

    let timer = 0;
    let anim: Animation | null = null;
    let source: AudioBufferSourceNode | null = null;

    /** Plays a stutter; returns how long it runs (ms). */
    const flick = (): number => {
      if (ctx && buzz && recorded && audible.current && ctx.state === 'running' && Math.random() < AUDIBLE) {
        const gain = ctx.createGain();
        gain.gain.value = VOLUME;
        source = ctx.createBufferSource();
        source.buffer = buzz;
        source.connect(gain).connect(ctx.destination);
        source.start();
        const s = gentle ? stutter(true) : recorded;
        anim = el.animate(s.frames, { duration: s.ms });
        return buzz.duration * 1000;
      }
      const { frames, ms } = stutter(gentle);
      anim = el.animate(frames, { duration: ms });
      return ms;
    };

    /** `busy`: the stutter just started runs this long; the next waits for it. */
    const next = (first = false, busy = 0) => {
      window.clearTimeout(timer);
      const gap = first ? between(900, 2500) : gentle ? between(8000, 16000) : between(3000, 8000);
      timer = window.setTimeout(() => next(false, document.hidden ? 0 : flick()), Math.max(gap, busy + 800));
    };
    next(true);

    return () => {
      window.clearTimeout(timer);
      anim?.cancel();
      try {
        source?.stop();
      } catch {
        /* already ended */
      }
    };
  }, []);

  return (
    <div className="rx-lights" aria-hidden>
      <div ref={ref} className="rx-lights__dip" />
    </div>
  );
}
