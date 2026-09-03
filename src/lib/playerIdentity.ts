/**
 * Player identity for the arcade leaderboards.
 *
 * The games run in FREE_PLAY mode, so a wallet is optional. To still let every
 * player rank, we mint a persistent anonymous "arcade handle" on first play and
 * keep it in localStorage. When a wallet IS connected we key the leaderboard row
 * by the wallet address instead, so the same wallet maps to a single entry.
 */
import { safeLocalStorage } from '../utils/safeStorage';

const STORAGE_KEY = 'sweetardio_player';

const ADJECTIVES = [
  'Golden', 'Sugar', 'Neon', 'Choppa', 'Mega', 'Turbo', 'Cosmic', 'Sticky',
  'Frosted', 'Royal', 'Wild', 'Glazed', 'Cherry', 'Mint', 'Toxic', 'Velvet',
];

const NOUNS = [
  'Waffle', 'Twinkie', 'Cookie', 'Gummy', 'Churro', 'Cone', 'Donut', 'Smore',
  'Marshmallow', 'Poptart', 'SugarCube', 'RiceCrispy', 'ZebraCake', 'BrownieBite',
];

export interface LocalPlayer {
  /** Stable anonymous id used as the leaderboard key when no wallet is connected. */
  id: string;
  /** Friendly display name shown on the board. */
  name: string;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(): string {
  return `${pick(ADJECTIVES)}${pick(NOUNS)}${10 + Math.floor(Math.random() * 90)}`;
}

function generateId(): string {
  return `anon_${Math.random().toString(36).slice(2, 10)}`;
}

/** Read (or lazily create) the persistent local player identity. */
export function getLocalPlayer(): LocalPlayer {
  if (typeof window === 'undefined') {
    return { id: 'anon_server', name: 'Player' };
  }
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalPlayer>;
      if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
        return { id: parsed.id, name: parsed.name };
      }
    }
  } catch {
    /* fall through to regenerate */
  }
  const fresh: LocalPlayer = { id: generateId(), name: generateName() };
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    /* localStorage unavailable — identity stays in-memory for this session */
  }
  return fresh;
}

/** Update the player's display name (used on the board for both wallet & anon play). */
export function setPlayerName(name: string): void {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) return;
  const current = getLocalPlayer();
  const next: LocalPlayer = { ...current, name: trimmed };
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Truncate a wallet address for display, e.g. "5Gh7…xZ9k". */
export function shortAddress(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/**
 * Resolve the effective leaderboard identity given an optional wallet address.
 * Returns the row key (`player`) and the name to display.
 */
export function resolvePlayer(walletAddress?: string | null): { player: string; name: string } {
  const local = getLocalPlayer();
  if (walletAddress) {
    return { player: walletAddress, name: local.name || shortAddress(walletAddress) };
  }
  return { player: local.id, name: local.name };
}

/**
 * The player's portable arcade code.
 *
 * The handle lives in localStorage, which is gone the moment someone clears
 * their browser or opens the site on their phone — and with no wallet in the
 * games, that handle *is* the leaderboard identity. The code lets a player
 * carry it: copy it on one device, paste it on the next, and the same row on
 * the board keeps filling in.
 *
 * Format is `name.id` — readable enough to retype, specific enough to be the
 * document key it already is.
 */
export function getArcadeCode(): string {
  const { id, name } = getLocalPlayer();
  return `${name}.${id}`;
}

/**
 * Adopt an arcade code produced by `getArcadeCode`.
 *
 * Returns the restored identity, or null when the code doesn't parse. This
 * only rebinds which leaderboard row this browser writes to; it can't read or
 * alter anyone's stored scores.
 */
export function restoreArcadeCode(code: string): LocalPlayer | null {
  const trimmed = code.trim();
  const split = trimmed.lastIndexOf('.');
  if (split <= 0 || split === trimmed.length - 1) return null;

  const name = trimmed.slice(0, split).trim().slice(0, 24);
  const id = trimmed.slice(split + 1).trim();
  // Ids are `anon_xxxxxxxx` or a wallet address — either way, no separators.
  if (!name || !/^[A-Za-z0-9_]{4,64}$/.test(id)) return null;

  const restored: LocalPlayer = { id, name };
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
  } catch {
    /* storage unavailable — identity holds for this session only */
  }
  return restored;
}

/** The current player's row key (wallet address if connected, else anon id). */
export function currentPlayerId(walletAddress?: string | null): string {
  return walletAddress || getLocalPlayer().id;
}
