import { useEffect, useState } from 'react';

/**
 * Official Audius embed player.
 *
 * Resolves the featured artist's latest streamable track at runtime (in the
 * visitor's browser, which can reach Audius) and renders Audius's own embed
 * iframe — the recognizable player widget — for it. Falls back to a link card
 * if the artist/track can't be resolved.
 */
const env = import.meta.env as Record<string, string | undefined>;
const APP_NAME = env.VITE_AUDIUS_APP_NAME || 'Sweetardio.fun';
const ARTIST_HANDLE = env.VITE_AUDIUS_HANDLE || 'MATTRICKBEATS';
export const ARTIST_URL = `https://audius.co/${ARTIST_HANDLE}`;

const FALLBACK_HOSTS = [
  'https://discoveryprovider.audius.co',
  'https://discoveryprovider2.audius.co',
  'https://discoveryprovider3.audius.co',
];

const app = (path: string) => `${path}${path.includes('?') ? '&' : '?'}app_name=${encodeURIComponent(APP_NAME)}`;

async function resolveHost(): Promise<string> {
  try {
    const res = await fetch('https://api.audius.co');
    if (res.ok) {
      const hosts: string[] = (await res.json())?.data ?? [];
      if (hosts.length) return hosts[Math.floor(Math.random() * hosts.length)];
    }
  } catch {
    /* fall through */
  }
  return FALLBACK_HOSTS[Math.floor(Math.random() * FALLBACK_HOSTS.length)];
}

/** The artist's newest streamable track id, or null. */
async function resolveLatestTrackId(host: string): Promise<string | null> {
  try {
    const userRes = await fetch(`${host}/v1/${app(`users/handle/${encodeURIComponent(ARTIST_HANDLE)}`)}`);
    if (!userRes.ok) return null;
    const userId = (await userRes.json())?.data?.id;
    if (!userId) return null;
    const res = await fetch(`${host}/v1/${app(`users/${userId}/tracks?limit=15&sort=date`)}`);
    if (!res.ok) return null;
    const tracks: any[] = (await res.json())?.data ?? [];
    const t = tracks.find((x) => x.is_streamable !== false && !x.is_premium) ?? tracks[0];
    return t?.id ?? null;
  } catch {
    return null;
  }
}

const AudiusEmbed = () => {
  const [trackId, setTrackId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const host = await resolveHost();
      const id = await resolveLatestTrackId(host);
      if (cancelled) return;
      if (id) setTrackId(id);
      else setFailed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const frame = 'w-full max-w-[420px] overflow-hidden rounded-xl border border-sweetardios-cyan/30 bg-sweetardios-oxford/70 shadow-[0_0_30px_rgba(52,237,243,0.18)]';

  // Resolved → official Audius widget.
  if (trackId) {
    return (
      <div className={frame}>
        <iframe
          title="Audius player"
          src={`https://audius.co/embed/track/${trackId}?flavor=card`}
          width="100%"
          height={480}
          allow="encrypted-media"
          loading="lazy"
          style={{ border: 0, display: 'block', background: 'transparent' }}
        />
      </div>
    );
  }

  // Couldn't resolve a track → graceful link card.
  if (failed) {
    return (
      <a
        href={ARTIST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${frame} flex h-[280px] flex-col items-center justify-center gap-3 px-6 text-center transition-colors hover:border-sweetardios-cyan/60`}
      >
        <span className="text-3xl">🎧</span>
        <span className="font-heading text-lg text-white">Listen on Audius</span>
        <span className="text-xs text-blue-100/60">Open the full catalogue in a new tab</span>
      </a>
    );
  }

  // Loading skeleton.
  return (
    <div className={`${frame} flex h-[480px] items-center justify-center`} aria-busy="true">
      <div className="flex flex-col items-center gap-3 text-sweetardios-cyan/70">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sweetardios-cyan/40 border-t-sweetardios-cyan" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Loading player…</span>
      </div>
    </div>
  );
};

export default AudiusEmbed;
