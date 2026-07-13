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

/** The current player's row key (wallet address if connected, else anon id). */
export function currentPlayerId(walletAddress?: string | null): string {
  return walletAddress || getLocalPlayer().id;
}
