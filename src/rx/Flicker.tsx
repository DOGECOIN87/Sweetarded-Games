/**
 * The lights. A tired tube somewhere overhead: steady most of the time, a
 * faint hum always, and every so often it stutters — a couple of quick dips,
 * now and then a longer brownout before it catches again. Once sound is
 * allowed, some stutters come with the tube's own buzz and zap, and then the
 * dips land on the zaps in the recording. One screen-wide layer of shadow
 * that never takes a tap. Dips stay shallow and the bursts short; anyone who
 * asks for reduced motion gets steady lights.
 */
import { useEffect, useRef } from 'react';
import { audioContext } from './sfx';

const SRC = '/rx/audio/light-flicker.mp3';
const VOLUME = 0.45;
/** Share of stutters that buzz (when sound is allowed). */
const AUDIBLE = 0.5;

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

/** A silent stutter: a few dips back to full light, sometimes a slow brownout at the end. */
function stutter(): Stutter {
  const dips = 1 + Math.floor(Math.random() * 4);
  const steps: Array<[number, number]> = [];
  for (let i = 0; i < dips; i++) {
    steps.push([between(40, 90), between(0.18, 0.42)]); // out
    steps.push([between(50, 160), between(0, 0.06)]); // back
  }
  if (Math.random() < 0.3) {
    steps.push([between(260, 520), between(0.3, 0.45)]); // sag
    steps.push([between(70, 130), 0.12]);
    steps.push([between(80, 160), 0.38]);
  }
  steps.push([between(120, 260), 0]); // caught
  return held(steps);
}

/** The recording's stutter: the light dips wherever the tube zaps (loud spikes over the buzz). */
function fromRecording(buffer: AudioBuffer): Stutter {
  const data = buffer.getChannelData(0);
  const win = Math.floor(buffer.sampleRate * 0.025);
  const rms: number[] = [];
  for (let i = 0; i + win <= data.length; i += win) {
    let s = 0;
    for (let j = i; j < i + win; j++) s += data[j] * data[j];
    rms.push(Math.sqrt(s / win));
  }
  const median = [...rms].sort((a, b) => a - b)[Math.floor(rms.length / 2)] || 1e-4;
  const winMs = (win / buffer.sampleRate) * 1000;
  const steps: Array<[number, number]> = rms.map((r) => {
    const k = r / median;
    return [winMs, k < 1.8 ? 0 : Math.min(0.45, 0.14 + (k - 1.8) * 0.08)];
  });
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

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

    const flick = () => {
      if (ctx && buzz && recorded && audible.current && ctx.state === 'running' && Math.random() < AUDIBLE) {
        const gain = ctx.createGain();
        gain.gain.value = VOLUME;
        source = ctx.createBufferSource();
        source.buffer = buzz;
        source.connect(gain).connect(ctx.destination);
        source.start();
        anim = el.animate(recorded.frames, { duration: recorded.ms });
      } else {
        const { frames, ms } = stutter();
        anim = el.animate(frames, { duration: ms });
      }
    };

    const next = (first = false) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => {
          if (!document.hidden) flick();
          next();
        },
        first ? between(1800, 4200) : between(6000, 14000),
      );
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
