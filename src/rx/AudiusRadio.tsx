import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { At } from './Stage';
import type { Rect } from './scenes';

const env = import.meta.env as Record<string, string | undefined>;
const APP_NAME = env.VITE_AUDIUS_APP_NAME || 'Sweetardio.fun';
const API_KEY = env.VITE_AUDIUS_API_KEY;
const FALLBACK_HOSTS = [
  'https://discoveryprovider.audius.co',
  'https://discoveryprovider2.audius.co',
  'https://discoveryprovider3.audius.co',
];

interface AudiusTrack {
  id: string;
  title: string;
  user?: { name?: string; handle?: string };
  artwork?: { '150x150'?: string; '480x480'?: string; '1000x1000'?: string } | null;
  duration?: number;
  is_streamable?: boolean;
  is_premium?: boolean;
}

const withApp = (host: string, path: string) =>
  `${host}/v1${path}${path.includes('?') ? '&' : '?'}app_name=${encodeURIComponent(APP_NAME)}${API_KEY ? `&api_key=${encodeURIComponent(API_KEY)}` : ''}`;

async function resolveHost() {
  try {
    const response = await fetch('https://api.audius.co');
    if (response.ok) {
      const hosts: string[] = (await response.json())?.data ?? [];
      if (hosts.length) return hosts[0];
    }
  } catch {
    // Use a known public discovery node when host discovery is unavailable.
  }
  return FALLBACK_HOSTS[0];
}

async function fetchTopTrack(host: string): Promise<AudiusTrack | null> {
  const response = await fetch(withApp(host, '/tracks/trending?limit=1'));
  if (!response.ok) throw new Error('Audius is unavailable');
  const track = (await response.json())?.data?.[0] as AudiusTrack | undefined;
  if (!track || track.is_streamable === false || track.is_premium) return null;
  return track;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 1) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function PlayIcon({ pause = false }: { pause?: boolean }) {
  return pause ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
  );
}

function AudiusMark() {
  return <span className="rx-radio__mark" aria-hidden="true">A</span>;
}

export function AudiusRadio({ r }: { r: Rect }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hostRef = useRef(FALLBACK_HOSTS[0]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const bassCooldownRef = useRef(false);
  const bassTimerRef = useRef<number | null>(null);
  const [track, setTrack] = useState<AudiusTrack | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [spectrum, setSpectrum] = useState([0, 0, 0, 0, 0, 0]);
  const [bassHit, setBassHit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const host = await resolveHost();
        const topTrack = await fetchTopTrack(host);
        if (cancelled) return;
        hostRef.current = host;
        setTrack(topTrack);
        setStatus(topTrack ? 'ready' : 'error');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stopReactiveMeter = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setEnergy(0);
    setSpectrum([0, 0, 0, 0, 0, 0]);
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
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.72;
        sourceRef.current = context.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(context.destination);
      }
      void context.resume();
      const analyser = analyserRef.current;
      const bins = new Uint8Array(analyser.frequencyBinCount);
      const read = () => {
        analyser.getByteFrequencyData(bins);
        const lowBins = Math.min(9, bins.length);
        const bass = bins.slice(0, lowBins).reduce((sum, value) => sum + value, 0) / (lowBins * 255);
        const overall = bins.reduce((sum, value) => sum + value, 0) / (bins.length * 255);
        setEnergy(Math.min(1, overall * 0.7 + bass * 0.7));
        setSpectrum(Array.from({ length: 6 }, (_, index) => {
          const start = Math.floor((index / 6) * bins.length);
          const end = Math.max(start + 1, Math.floor(((index + 1) / 6) * bins.length));
          return bins.slice(start, end).reduce((sum, value) => sum + value, 0) / ((end - start) * 255);
        }));
        if (bass > 0.58 && bass > overall * 1.3 && !bassCooldownRef.current) {
          bassCooldownRef.current = true;
          setBassHit(true);
          if (bassTimerRef.current !== null) window.clearTimeout(bassTimerRef.current);
          bassTimerRef.current = window.setTimeout(() => {
            bassCooldownRef.current = false;
            setBassHit(false);
          }, 170);
        }
        frameRef.current = requestAnimationFrame(read);
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
    const update = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };
    const onPlay = () => {
      document.querySelectorAll('audio').forEach((other) => {
        if (other !== audio) other.pause();
      });
      setPlaying(true);
      startReactiveMeter();
    };
    const onPause = () => { setPlaying(false); stopReactiveMeter(); };
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0); stopReactiveMeter(); };
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      stopReactiveMeter();
      if (bassTimerRef.current !== null) window.clearTimeout(bassTimerRef.current);
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    };
  }, [track]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  };

  const artwork = track?.artwork?.['480x480'] || track?.artwork?.['1000x1000'] || track?.artwork?.['150x150'];
  const title = status === 'loading' ? 'TUNING IN…' : status === 'error' ? 'SIGNAL LOST' : track?.title || 'NO TRACK';
  const artist = track?.user?.name || 'Audius trending';
  const reactiveStyle = { '--radio-energy': energy.toFixed(3) } as CSSProperties;

  return (
    <At r={r} className={`rx-radio ${playing ? 'is-playing' : ''} ${bassHit ? 'is-bass' : ''}`} style={reactiveStyle}>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
      <div className="rx-radio__notes" aria-hidden="true"><span className="rx-note-a">♪</span><span className="rx-note-b">♫</span><span className="rx-note-c">♬</span></div>
      <div className="rx-radio__face">
        <div className="rx-radio__geometry" aria-label={`${title} by ${artist}`}>
          <i className="rx-radio__circle rx-radio__circle--left-a" />
          <i className="rx-radio__circle rx-radio__circle--left-b" />
          <button className="rx-radio__core" type="button" onClick={toggle} disabled={!track} aria-label={playing ? 'Pause Audius radio' : 'Play top Audius track'}>
            {artwork ? <img src={artwork} alt="Original Audius album art" /> : <span>♪</span>}
            <PlayIcon pause={playing} />
          </button>
          <i className="rx-radio__circle rx-radio__circle--right-a" />
          <i className="rx-radio__circle rx-radio__circle--right-b" />
        </div>
        <div className="rx-radio__visualizer" aria-hidden="true">
          {spectrum.map((level, index) => <i key={index} style={{ transform: `scaleY(${Math.max(0.12, level)})` }} />)}
        </div>
        <div className="rx-radio__readout" aria-hidden="true"><span>{formatTime(currentTime)}</span><span>{track ? formatTime(track.duration ?? 0) : '—:——'}</span></div>
      </div>
    </At>
  );
}
