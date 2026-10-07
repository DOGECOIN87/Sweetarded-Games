const env = import.meta.env as Record<string, string | undefined>;
const APP_NAME = env.VITE_AUDIUS_APP_NAME || 'Sweetardio.fun';
const API_KEY = env.VITE_AUDIUS_API_KEY;
export const FALLBACK_HOSTS = [
  'https://discoveryprovider.audius.co',
  'https://discoveryprovider2.audius.co',
  'https://discoveryprovider3.audius.co',
];

export interface AudiusTrack {
  id: string;
  title: string;
  user?: { name?: string; handle?: string };
  artwork?: { '150x150'?: string; '480x480'?: string; '1000x1000'?: string } | null;
  duration?: number;
  is_streamable?: boolean;
  is_premium?: boolean;
  is_stream_gated?: boolean;
}

export const withApp = (host: string, path: string) =>
  `${host}/v1${path}${path.includes('?') ? '&' : '?'}app_name=${encodeURIComponent(APP_NAME)}${API_KEY ? `&api_key=${encodeURIComponent(API_KEY)}` : ''}`;

async function requestJson(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]) });
  if (!response.ok) throw new Error('Audius is unavailable');
  return response.json();
}

export async function fetchStation(signal: AbortSignal) {
  let discovered: string[] = [];
  try {
    const result = await requestJson('https://api.audius.co', signal);
    discovered = Array.isArray(result.data) ? result.data.filter((host: unknown) =>
      typeof host === 'string' && /^https:\/\/[^/]+\.audius\.co\/?$/.test(host)) : [];
  } catch { /* Known discovery providers remain available. */ }
  for (const host of [...new Set([...discovered.slice(0, 2), ...FALLBACK_HOSTS])]) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      const result = await requestJson(withApp(host, '/tracks/trending?limit=20'), signal);
      const tracks = (Array.isArray(result.data) ? result.data : []).filter((track: AudiusTrack) =>
        track && typeof track.id === 'string' && typeof track.title === 'string' &&
        track.is_streamable !== false && !track.is_premium && !track.is_stream_gated);
      if (tracks.length) return { host, tracks: tracks as AudiusTrack[] };
    } catch { /* Try the next provider, unless the caller cancelled. */ }
  }
  throw new Error('No playable tracks found');
}

