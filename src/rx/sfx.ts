/**
 * The counter's two sounds, synthesised so there is no audio asset to load:
 * the service bell and the stamp. Only ever played from a click.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Desk bell: a few inharmonic partials with a long bright decay. */
export function ding(): void {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = 0.22;
  out.connect(ac.destination);
  for (const [freq, level, decay] of [
    [1864, 1, 1.9],
    [2517, 0.5, 1.2],
    [4190, 0.28, 0.7],
    [5270, 0.16, 0.45],
  ] as const) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + decay + 0.05);
  }
}

/** Rubber stamp on paper: a dull knock plus a short burst of paper noise. */
export function thud(): void {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;

  const knock = ac.createOscillator();
  const knockGain = ac.createGain();
  knock.type = 'sine';
  knock.frequency.setValueAtTime(140, now);
  knock.frequency.exponentialRampToValueAtTime(55, now + 0.14);
  knockGain.gain.setValueAtTime(0.5, now);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  knock.connect(knockGain).connect(ac.destination);
  knock.start(now);
  knock.stop(now + 0.2);

  const len = Math.floor(ac.sampleRate * 0.09);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const noise = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const noiseGain = ac.createGain();
  noise.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  noiseGain.gain.value = 0.35;
  noise.connect(filter).connect(noiseGain).connect(ac.destination);
  noise.start(now);
}
