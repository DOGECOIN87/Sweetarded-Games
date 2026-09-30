/**
 * The counter's sounds: the service bell (a supplied recording), the stamp
 * and the vending keypad (synthesised, no asset). Only ever played from a click.
 */
let ctx: AudioContext | null = null;

/** The page's one Web Audio context (the stamp, and the street's background loop). */
export function audioContext(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

let bell: HTMLAudioElement | null = null;

/** Start loading the bell, so the first ring sounds straight away. */
export function primeBell(): void {
  if (bell) return;
  bell = new Audio('/rx/audio/bell.mp3');
  bell.preload = 'auto';
}

/** RING FOR SERVICE. Ringing again restarts it. */
export function ding(): void {
  primeBell();
  if (!bell) return;
  bell.currentTime = 0;
  void bell.play().catch(() => {});
}

/** Rubber stamp on paper: a dull knock plus a short burst of paper noise. */
export function thud(): void {
  const ac = audioContext();
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

/** A vending-machine key: a short square chirp, pitched by key. `low` is the buzz for a wrong code. */
export function beep(step = 0, low = false): void {
  const ac = audioContext();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(low ? 110 : 880 + step * 45, now);
  const len = low ? 0.32 : 0.07;
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + len);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + len + 0.02);
}
