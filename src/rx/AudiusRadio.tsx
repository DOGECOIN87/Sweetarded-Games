import { useEffect, useRef, useState } from 'react';
import { At } from './Stage';
import type { Rect } from './scenes';

import { fetchStation, withApp, FALLBACK_HOSTS, type AudiusTrack } from './audiusStation';

/** The beat tracker at rest: no kick heard, nothing shaking. */
const QUIET = { prev: 0, avg: 0, peak: 0.02, env: 0, energy: 0, strength: 0, lastBeat: -Infinity, hitAt: -Infinity };

function PlayIcon({ pause = false }: { pause?: boolean }) {
  return pause ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
  );
}

export function AudiusRadio({ r }: { r: Rect }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hostRef = useRef(FALLBACK_HOSTS[0]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const radioRef = useRef<HTMLDivElement>(null);
  const pendingPlayRef = useRef(false);
  const failuresRef = useRef(0);
  const [queue, setQueue] = useState<AudiusTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('');
  const [buffering, setBuffering] = useState(false);
  const dynamicsRef = useRef({ ...QUIET });
  const kickRef = useRef<{ analyser: AnalyserNode; samples: Float32Array<ArrayBuffer>; latency: number } | null>(null);
  const track = queue[index] ?? null;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playing, setPlaying] = useState(false);

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setMessage('');
    fetchStation(controller.signal).then(({ host, tracks }) => {
      if (controller.signal.aborted) return;
      hostRef.current = host;
      setIndex(0);
      setQueue(tracks);
      setStatus('ready');
    }).catch(() => {
      if (!controller.signal.aborted) {
        setStatus('error');
        setMessage('Signal lost. Tap the artwork to retry.');
      }
    });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    kickRef.current = null;
  }, []);

  const stopReactiveMeter = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    radioRef.current?.closest<HTMLElement>('.rx-radio')?.style.setProperty('--radio-energy', '0');
    radioRef.current?.querySelectorAll<HTMLElement>('.rx-radio__visualizer i').forEach(bar => { bar.style.transform = 'scaleY(0.12)'; });
    const scene = radioRef.current?.closest<HTMLElement>('.rx-stage');
    scene?.style.removeProperty('--radio-light');
    scene?.style.removeProperty('--radio-shake-x');
    scene?.style.removeProperty('--radio-shake-y');
    scene?.style.removeProperty('--radio-stomp');
    dynamicsRef.current = { ...QUIET };
    radioRef.current?.closest<HTMLElement>('.rx-radio')?.style.setProperty('--radio-beat', '0');
  };

  const startReactiveMeter = () => {
    const audio = audioRef.current;
    if (!audio || !('AudioContext' in window)) return;
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const context = audioContextRef.current;
      if (!analyserRef.current) {
        analyserRef.current = context.createAnalyser();
        analyserRef.current.fftSize = 1024;
        analyserRef.current.smoothingTimeConstant = 0.45;
        sourceRef.current = context.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(context.destination);
      }
      if (!kickRef.current && sourceRef.current) {
        // A low-passed copy of the signal just for the kick drum. Its raw waveform
        // reacts within ~10 ms, far sooner than the smoothed spectrum above.
        const lowpass = context.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 140;
        lowpass.Q.value = 0.7;
        const kick = context.createAnalyser();
        kick.fftSize = 512;
        const silent = context.createGain();
        silent.gain.value = 0;
        sourceRef.current.connect(lowpass);
        lowpass.connect(kick);
        kick.connect(silent);
        silent.connect(context.destination);
        kickRef.current = { analyser: kick, samples: new Float32Array(kick.fftSize), latency: 0 };
      }
      void context.resume();
      const analyser = analyserRef.current;
      const kick = kickRef.current;
      // What the analysers see reaches the speakers this much later; hits wait for it.
      if (kick) kick.latency = Math.min(150, Math.max(0, ((context.outputLatency || 0) + (context.baseLatency || 0)) * 1000));
      const bins = new Uint8Array(analyser.frequencyBinCount);
      const read = () => {
        analyser.getByteFrequencyData(bins);
        const band = (from: number, to: number) => {
          let sum = 0;
          for (let i = from; i < to; i += 1) sum += bins[i];
          return sum / ((to - from) * 255);
        };
        // ~40–170 Hz at 44.1 kHz: the kick drum and bassline, skipping the DC bin.
        const bass = band(1, 5);
        const overall = band(1, Math.min(bins.length, 186));
        const now = performance.now();
        const dynamics = dynamicsRef.current;
        // Loudness of the low end right now, scaled against the track's own recent
        // peaks so quiet and loud masters both hit.
        let level = bass * 0.5;
        if (kick) {
          kick.analyser.getFloatTimeDomainData(kick.samples);
          let sum = 0;
          for (const sample of kick.samples) sum += sample * sample;
          level = Math.sqrt(sum / kick.samples.length);
        }
        dynamics.peak = Math.max(level, dynamics.peak * 0.9995, 0.02);
        const low = Math.min(1, level / dynamics.peak);
        // A kick is a sharp jump in the low end above its recent average.
        const beat = low > 0.45 && low > dynamics.avg * 1.35 && low - dynamics.prev > 0.08 && now - dynamics.lastBeat > 180;
        dynamics.prev = low;
        dynamics.avg += (low - dynamics.avg) * 0.08;
        dynamics.energy += (overall - dynamics.energy) * 0.05;
        if (beat) {
          dynamics.lastBeat = now;
          dynamics.hitAt = now + (kick?.latency ?? 0);
          dynamics.strength = Math.min(1, 0.6 + (low - dynamics.avg));
        }
        // Everything below is timed from the moment the kick is heard, not detected.
        const since = now - dynamics.hitAt;
        const pulse = since >= 0 && since < 220 ? (1 - since / 220) ** 2 : 0;
        const face = radioRef.current;
        // Set on the whole radio so the glow and the flying notes feel the beat too.
        const root = face?.closest<HTMLElement>('.rx-radio');
        root?.style.setProperty('--radio-energy', Math.min(1, overall * 0.8 + bass * 0.6).toFixed(3));
        root?.style.setProperty('--radio-beat', pulse.toFixed(3));
        face?.querySelectorAll<HTMLElement>('.rx-radio__visualizer i').forEach((bar, index) => {
          // Log-spaced bands so the bars follow what you hear, not empty treble bins.
          const start = Math.max(1, Math.round(2 ** (index * 1.25)));
          const end = Math.max(start + 1, Math.round(2 ** ((index + 1) * 1.25)));
          bar.style.transform = `scaleY(${Math.max(0.12, band(start, Math.min(end, bins.length)))})`;
        });
        // Deliberately runs even with reduced motion on: the radio's show is the point.
        const scene = face?.closest<HTMLElement>('.rx-stage');
        if (scene) {
          // The room sits dark and its lights pump with the bass: they swell with the
          // low end and flash on each kick. Never a full blackout (0.28 to 1).
          dynamics.env = Math.max(low, dynamics.env * 0.88);
          const light = 0.28 + dynamics.env * 0.4 + pulse * 0.32;
          scene.style.setProperty('--radio-light', Math.min(1, light).toFixed(3));
          // The ground shakes on each kick: a hard jolt that rings out in a quarter
          // second, plus a faint rumble while the bass is loud.
          const quake = since >= 0 && since < 280 ? Math.exp(-since / 75) * dynamics.strength : 0;
          const rumble = Math.max(0, low - 0.55) * 1.2;
          const x = quake * 4 * Math.sin(since * 0.09 + 1) + rumble * Math.sin(now * 0.07);
          const y = quake * 8 * Math.cos(since * 0.11) + rumble * Math.cos(now * 0.09);
          scene.style.setProperty('--radio-shake-x', `${x.toFixed(2)}px`);
          scene.style.setProperty('--radio-shake-y', `${y.toFixed(2)}px`);
          scene.style.setProperty('--radio-stomp', (1 + quake * 0.012).toFixed(4));
        }
        if (!audio.paused && !document.hidden) frameRef.current = requestAnimationFrame(read);
        else frameRef.current = null;
      };
      if (frameRef.current === null) read();
    } catch {
      // Some browsers block cross-origin analysis; playback still works normally.
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.src = withApp(hostRef.current, `/tracks/${track.id}/stream`);
    audio.load();
    setMessage('');
    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      void audio.play().catch(() => setMessage('Tap the radio to keep listening.'));
    }
    const onTime = () => {
      const share = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
      radioRef.current?.style.setProperty('--radio-progress', Math.min(1, share).toFixed(4));
    };
    radioRef.current?.style.setProperty('--radio-progress', '0');
    const onPlay = () => {
      document.querySelectorAll('audio').forEach((other) => {
        if (other !== audio) other.pause();
      });
      setPlaying(true);
      setBuffering(false);
      setMessage('');
      startReactiveMeter();
    };
    const onPause = () => { setPlaying(false); setBuffering(false); stopReactiveMeter(); };
    const onEnded = () => {
      setPlaying(false); stopReactiveMeter();
      if (queue.length > 1) { pendingPlayRef.current = true; setIndex(value => (value + 1) % queue.length); }
      else audio.currentTime = 0;
    };
    const onError = () => { setPlaying(false); setBuffering(false); stopReactiveMeter(); failuresRef.current += 1;
      // Skip a dead stream, but stop after a lap so a dead station never spins.
      if (queue.length > 1 && failuresRef.current < queue.length) { pendingPlayRef.current = true; setIndex(value => (value + 1) % queue.length); }
      else { failuresRef.current = 0; setMessage('Stream unavailable. Tap to retry.'); }
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => { failuresRef.current = 0; setBuffering(false); startReactiveMeter(); };
    const onVisibility = () => { if (document.hidden) stopReactiveMeter(); else if (!audio.paused) startReactiveMeter(); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    document.addEventListener('visibilitychange', onVisibility);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      document.removeEventListener('visibilitychange', onVisibility);
      audio.pause();
      setPlaying(false);
      stopReactiveMeter();
    };
  }, [track, queue.length]);

  const toggle = async () => {
    if (status === 'error') { setAttempt(value => value + 1); return; }
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (!audio.paused) { audio.pause(); return; }
    try {
      if (audioContextRef.current) await audioContextRef.current.resume();
      await audio.play();
    } catch {
      setPlaying(false);
      setMessage('Playback could not start. Tap to try again.');
    }
  };

  const artwork = track?.artwork?.['480x480'] || track?.artwork?.['1000x1000'] || track?.artwork?.['150x150'];
  const title = status === 'loading' ? 'TUNING IN…' : status === 'error' ? 'SIGNAL LOST' : track?.title || 'NO TRACK';
  const artist = track?.user?.name || 'Audius trending';


  const label = status === 'error' ? 'Retry Audius radio' : playing ? 'Pause Audius radio' : `Play ${title} by ${artist}`;
  const notes = ['♪', '♫', '♬', '♪', '♫', '♬', '♪', '♫', '♬', '♪', '♫', '♬'];
  const time = clock.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
  const date = clock.toLocaleDateString([], { month: 'numeric', day: 'numeric', weekday: 'short' });

  return (
    <At r={r} className={`rx-radio ${playing ? 'is-playing' : ''}`}>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
      <div className="rx-radio__notes" aria-hidden="true">
        {notes.map((note, i) => <span key={i}><b>{note}</b></span>)}
      </div>
      {/* A floating-screen head unit: the whole thing is one tap target. */}
      <button className="rx-radio__tap" type="button" onClick={toggle} disabled={status === 'loading'} aria-label={label} title={message || label}>
        <span className="rx-radio__mount" aria-hidden="true" />
        <span className="rx-radio__unit" aria-hidden="true">
          <span className="rx-radio__rail"><i>▦</i><i>◖</i><i>+</i><i>−</i></span>
          <span className="rx-radio__face" ref={radioRef}>
            <span className="rx-radio__now">
              <span className="rx-radio__art">
                {artwork
                  ? <img key={artwork} src={artwork} alt="" loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
                  : <span className="rx-radio__art-blank">♪</span>}
                <PlayIcon pause={playing} />
              </span>
              <span className="rx-radio__progress"><i /></span>
              <span className="rx-radio__title">{title}</span>
              <span className="rx-radio__artist">{buffering ? 'BUFFERING…' : artist}</span>
            </span>
            <span className="rx-radio__side">
              <span className="rx-radio__clock"><b>{time}</b><small>{date}</small></span>
              <span className="rx-radio__eq">
                <span className="rx-radio__visualizer">
                  {Array.from({ length: 6 }, (_, index) => <i key={index} style={{ transform: 'scaleY(0.12)' }} />)}
                </span>
                <small>{playing ? 'ON AIR' : 'AUDIUS'}</small>
              </span>
            </span>
            <span className="rx-radio__dock"><i>◉</i><i className="is-hd">HD</i><i className="is-bt">ᛒ</i><i>⇪</i><i>≋</i><i>⚙</i><i className="is-call">✆</i></span>
          </span>
          <span className="rx-radio__brand">SWEETARDIO</span>
        </span>
      </button>
      <span className="rx-radio__sr" role="status">{message}</span>
    </At>
  );
}
