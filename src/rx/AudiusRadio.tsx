import { useEffect, useRef, useState } from 'react';
import { At } from './Stage';
import type { Rect } from './scenes';
import { fetchStation, withApp, FALLBACK_HOSTS, type AudiusTrack } from './audiusStation';

function TransportIcon({ kind }: { kind: 'play' | 'pause' | 'prev' | 'next' }) {
  if (kind === 'pause') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>;
  if (kind === 'prev') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h2v14H5zm14 0v14L8 12z" /></svg>;
  if (kind === 'next') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 5h2v14h-2zM5 5v14l11-7z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>;
}

const clock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

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
  const [time, setTime] = useState(0);
  const [bassHit, setBassHit] = useState(false);
  const dynamicsRef = useRef({ bass: 0, prev: 0, energy: 0, lastBeat: 0 });
  const bassTimerRef = useRef<number | null>(null);
  const track = queue[index] ?? null;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
        setMessage('Signal lost. Tap the radio to retry.');
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
      const band = (from: number, to: number) => {
        let sum = 0;
        for (let i = from; i < to; i += 1) sum += bins[i];
        return sum / ((to - from) * 255);
      };
      const read = () => {
        analyser.getByteFrequencyData(bins);
        const bass = band(1, 5);
        const overall = band(1, Math.min(bins.length, 186));
        const now = performance.now();
        const dynamics = dynamicsRef.current;
        const rise = bass - dynamics.prev;
        const beat = bass > 0.32 && bass > dynamics.bass * 1.15 && rise > 0.04 && now - dynamics.lastBeat > 200;
        dynamics.prev = bass;
        dynamics.bass += (bass - dynamics.bass) * 0.06;
        dynamics.energy += (overall - dynamics.energy) * 0.05;
        if (beat) dynamics.lastBeat = now;
        const since = now - dynamics.lastBeat;
        const pulse = since < 220 ? (1 - since / 220) ** 2 : 0;
        const face = radioRef.current;
        const root = face?.closest<HTMLElement>('.rx-radio');
        root?.style.setProperty('--radio-energy', Math.min(1, overall * 0.8 + bass * 0.6).toFixed(3));
        root?.style.setProperty('--radio-beat', pulse.toFixed(3));
        face?.querySelectorAll<HTMLElement>('.rx-radio__visualizer i').forEach((bar, i) => {
          const start = Math.max(1, Math.round(2 ** (i * 1.25)));
          const end = Math.max(start + 1, Math.round(2 ** ((i + 1) * 1.25)));
          bar.style.transform = `scaleY(${Math.max(0.12, band(start, Math.min(end, bins.length)))})`;
        });
        const scene = face?.closest<HTMLElement>('.rx-stage');
        if (scene) {
          const light = 0.68 + Math.min(0.12, dynamics.energy * 0.3) + pulse * 0.3;
          scene.style.setProperty('--radio-light', Math.min(1.05, light).toFixed(3));
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
    } catch { /* Playback still works when Web Audio analysis is unavailable. */ }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.src = withApp(hostRef.current, `/tracks/${track.id}/stream`);
    audio.load();
    setTime(0);
    setMessage('');
    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      void audio.play().catch(() => setMessage('Tap play to keep listening.'));
    }
    const onPlay = () => {
      document.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); });
      setPlaying(true); setBuffering(false); setMessage(''); startReactiveMeter();
    };
    const onPause = () => { setPlaying(false); setBuffering(false); stopReactiveMeter(); };
    const onEnded = () => { setPlaying(false); setTime(audio.duration || track.duration || 0); stopReactiveMeter(); };
    const onError = () => {
      setPlaying(false); setBuffering(false); stopReactiveMeter(); failuresRef.current += 1;
      if (queue.length > 1 && failuresRef.current < queue.length) { pendingPlayRef.current = true; setIndex(value => (value + 1) % queue.length); }
      else { failuresRef.current = 0; setMessage('Stream unavailable. Tap to retry.'); }
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => { failuresRef.current = 0; setBuffering(false); startReactiveMeter(); };
    const onVisibility = () => { if (document.hidden) stopReactiveMeter(); else if (!audio.paused) startReactiveMeter(); };
    const onTimeUpdate = () => setTime(audio.currentTime || 0);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('timeupdate', onTimeUpdate);
    document.addEventListener('visibilitychange', onVisibility);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError); audio.removeEventListener('waiting', onWaiting); audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('timeupdate', onTimeUpdate); document.removeEventListener('visibilitychange', onVisibility);
      audio.pause(); setPlaying(false); stopReactiveMeter();
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
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch { setPlaying(false); setMessage('Playback could not start. Tap to try again.'); }
  };

  const touchRadio = () => {
    if (!expanded) {
      setExpanded(true);
      if (status === 'loading') pendingPlayRef.current = true;
      else void toggle();
      return;
    }
    audioRef.current?.pause();
    setExpanded(false);
  };

  const changeTrack = (direction: number) => {
    if (!queue.length) return;
    pendingPlayRef.current = playing;
    setIndex(value => (value + direction + queue.length) % queue.length);
  };
  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    audio.currentTime = ((event.clientX - bounds.left) / bounds.width) * audio.duration;
    setTime(audio.currentTime);
  };

  const artwork = track?.artwork?.['480x480'] || track?.artwork?.['1000x1000'] || track?.artwork?.['150x150'];
  const title = status === 'loading' ? 'TUNING IN…' : status === 'error' ? 'SIGNAL LOST' : track?.title || 'NO TRACK';
  const artist = track?.user?.name || 'Audius trending';
  const duration = audioRef.current?.duration || track?.duration || 0;
  const progress = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  const label = status === 'error' ? 'Retry Audius radio' : playing ? 'Pause radio' : `Play ${title} by ${artist}`;
  const apps = [{ icon: '◉', name: 'SOURCE' }, { icon: '♫', name: 'AUDIO' }, { icon: 'USB', name: 'USB' }, { icon: '⚙', name: 'SETUP' }, { icon: '☎', name: 'PHONE' }];

  return (
    <At r={r} className={`rx-radio ${expanded ? 'is-expanded' : ''} ${playing ? 'is-playing' : ''} ${bassHit ? 'is-bass' : ''}`}>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
      <section className="rx-radio__unit" role="group" tabIndex={0} aria-label={expanded ? 'Touch the radio bezel to pause and return it to the counter' : 'Touch the radio to expand and play'} onClick={touchRadio} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); touchRadio(); } }}>
        <div className="rx-radio__display">
          <div className="rx-radio__album" aria-label={label}>
            {artwork ? <img key={artwork} src={artwork} alt={`${title} album artwork`} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /> : <span className="rx-radio__placeholder">♫</span>}
            <span className="rx-radio__album-mark"><TransportIcon kind={playing ? 'pause' : 'play'} /></span>
          </div>
          <div className="rx-radio__now">
            <div className="rx-radio__eyebrow"><span className="rx-radio__live-dot" /> NOW PLAYING <span>•</span> SWEETARDIO FM</div>
            <div className="rx-radio__song" title={title}>{title}</div>
            <div className="rx-radio__by" title={artist}>{buffering ? 'BUFFERING AUDIO…' : artist}</div>
            <div className="rx-radio__timeline" role="slider" tabIndex={0} aria-label="Track position" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(time)} onClick={event => { if (expanded) { event.stopPropagation(); seek(event); } }} onKeyDown={event => {
              event.stopPropagation();
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { const audio = audioRef.current; if (audio) audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + (event.key === 'ArrowRight' ? 5 : -5))); }
            }}><i style={{ width: `${progress}%` }} /></div>
            <div className="rx-radio__time"><span>{clock(time)}</span><span>{clock(duration)}</span></div>
            <div className="rx-radio__controls">
              <button type="button" aria-label="Previous track" title="Previous track" onClick={event => { event.stopPropagation(); if (expanded) changeTrack(-1); else touchRadio(); }} disabled={queue.length < 2}><TransportIcon kind="prev" /></button>
              <button type="button" className="rx-radio__play" aria-label={label} title={message || label} onClick={event => { event.stopPropagation(); if (expanded) void toggle(); else touchRadio(); }} disabled={status === 'loading'}><TransportIcon kind={playing ? 'pause' : 'play'} /></button>
              <button type="button" aria-label="Next track" title="Next track" onClick={event => { event.stopPropagation(); if (expanded) changeTrack(1); else touchRadio(); }} disabled={queue.length < 2}><TransportIcon kind="next" /></button>
            </div>
          </div>
          <div className="rx-radio__status-card">
            <span className="rx-radio__clock">10:58</span>
            <span className="rx-radio__date">10/07 • WED</span>
            <span className="rx-radio__signal">HD <b>RADIO</b></span>
            <div className="rx-radio__visualizer" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ transform: 'scaleY(0.12)' }} />)}</div>
          </div>
        </div>
        <nav className="rx-radio__dock" aria-label="Radio sources">
          {apps.map((app, i) => <span className={i === 1 ? 'is-selected' : ''} key={app.name}><b>{app.icon}</b><small>{app.name}</small></span>)}
        </nav>
        <span className="rx-radio__sr" role="status">{message}</span>
      </section>
    </At>
  );
}
