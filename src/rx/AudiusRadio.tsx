import { useEffect, useRef, useState } from 'react';
import { At } from './Stage';
import type { Rect } from './scenes';

import { fetchStation, withApp, FALLBACK_HOSTS, type AudiusTrack } from './audiusStation';

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
  const dynamicsRef = useRef({ bass: 0, prev: 0, energy: 0, lastBeat: 0 });
  const bassTimerRef = useRef<number | null>(null);
  const track = queue[index] ?? null;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playing, setPlaying] = useState(false);

  const [bassHit, setBassHit] = useState(false);

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
    if (bassTimerRef.current !== null) window.clearTimeout(bassTimerRef.current);
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
  }, []);

  const stopReactiveMeter = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    radioRef.current?.closest<HTMLElement>('.rx-radio')?.style.setProperty('--radio-energy', '0');
    radioRef.current?.querySelectorAll<HTMLElement>('.rx-radio__visualizer i').forEach(bar => { bar.style.transform = 'scaleY(0.12)'; });
    if (bassTimerRef.current !== null) window.clearTimeout(bassTimerRef.current);
    const scene = radioRef.current?.closest<HTMLElement>('.rx-stage');
    scene?.style.removeProperty('--radio-light');
    scene?.style.removeProperty('--radio-shake-x');
    scene?.style.removeProperty('--radio-shake-y');
    scene?.style.removeProperty('--radio-stomp');
    dynamicsRef.current = { bass: 0, prev: 0, energy: 0, lastBeat: 0 };
    radioRef.current?.closest<HTMLElement>('.rx-radio')?.style.setProperty('--radio-beat', '0');
    setBassHit(false);
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
      void context.resume();
      const analyser = analyserRef.current;
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
        // A kick is a sharp rise above the recent bass level, not just loud bass.
        const rise = bass - dynamics.prev;
        const beat = bass > 0.32 && bass > dynamics.bass * 1.15 && rise > 0.04 && now - dynamics.lastBeat > 200;
        dynamics.prev = bass;
        dynamics.bass += (bass - dynamics.bass) * 0.06;
        dynamics.energy += (overall - dynamics.energy) * 0.05;
        if (beat) dynamics.lastBeat = now;
        // The hit lands at full strength and eases out before the next kick.
        const since = now - dynamics.lastBeat;
        const pulse = since < 220 ? (1 - since / 220) ** 2 : 0;
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
          // Lights sit dimmed, swell with the track's loudness and flash up on each kick.
          // Never a strobe or blackout: brightness stays between 0.68 and 1.05.
          const light = 0.68 + Math.min(0.12, dynamics.energy * 0.3) + pulse * 0.3;
          scene.style.setProperty('--radio-light', Math.min(1.05, light).toFixed(3));
          // Stomp on the kick, plus a low rumble that follows the bassline between kicks.
          const rumble = Math.max(0, bass - 0.35) * 2.2;
          const stomp = pulse * (2.5 + bass * 2.5);
          scene.style.setProperty('--radio-shake-x', `${(Math.sin(now * 0.09) * (stomp * 0.6 + rumble)).toFixed(2)}px`);
          scene.style.setProperty('--radio-shake-y', `${(stomp + Math.cos(now * 0.13) * rumble).toFixed(2)}px`);
          scene.style.setProperty('--radio-stomp', (1 + pulse * 0.012).toFixed(4));
        }
        if (beat) {
          setBassHit(true);
          if (bassTimerRef.current !== null) window.clearTimeout(bassTimerRef.current);
          bassTimerRef.current = window.setTimeout(() => setBassHit(false), 160);
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
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      document.removeEventListener('visibilitychange', onVisibility);
      audio.pause();
      setPlaying(false);
      stopReactiveMeter();
      if (bassTimerRef.current !== null) window.clearTimeout(bassTimerRef.current);
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

  return (
    <At r={r} className={`rx-radio ${playing ? 'is-playing' : ''} ${bassHit ? 'is-bass' : ''}`}>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
      <div className="rx-radio__notes" aria-hidden="true">
        {notes.map((note, i) => <span key={i}><b>{note}</b></span>)}
      </div>
      <button className="rx-radio__tap" type="button" onClick={toggle} disabled={status === 'loading'} aria-label={label} title={message || label}>
        <div className="rx-radio__face" ref={radioRef}>
          <div className="rx-radio__geometry">
            <i className="rx-radio__circle rx-radio__circle--left-a" />
            <i className="rx-radio__circle rx-radio__circle--left-b" />
            <span className="rx-radio__core">
              {artwork ? <img key={artwork} src={artwork} alt="" loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /> : <span>♪</span>}
              <PlayIcon pause={playing} />
            </span>
            <i className="rx-radio__circle rx-radio__circle--right-a" />
            <i className="rx-radio__circle rx-radio__circle--right-b" />
          </div>
          <div className="rx-radio__visualizer" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <i key={index} style={{ transform: 'scaleY(0.12)' }} />)}
          </div>
        </div>
        <span className="rx-radio__details" aria-hidden="true">
          <span className="rx-radio__title">{title}</span>
          <span className="rx-radio__artist">{buffering ? 'BUFFERING…' : artist}</span>
        </span>
      </button>
      <span className="rx-radio__sr" role="status">{message}</span>
    </At>
  );
}
