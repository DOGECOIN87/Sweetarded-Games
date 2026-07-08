/**
 * Shared arcade credits ("SWEET credits") — the off-chain, just-for-fun economy.
 *
 * Every player starts with the same stack of credits. Both games (Slots and
 * Coinpusher) draw from and pay into this one balance, keyed by the player's
 * leaderboard identity (wallet address when connected, persistent anonymous id
 * otherwise). Connecting a wallet therefore ties your credits — and your spot
 * on the leaderboards — to your wallet address, which is what will be used to
 * reward top players when the NFT collection launches.
 *
 * Credits are persisted in localStorage behind the HMAC integrity envelope
 * (see utils/localStorageIntegrity): a tampered value fails verification and
 * the balance falls back to the starting stack. Because Net Profit — not raw
 * balance — is the headline leaderboard metric, refilling an empty stack never
 * improves a player's standing.
 */
import { setWithIntegrity, getWithIntegrity } from '../utils/localStorageIntegrity';

/** Credits every player starts with (and refills back to when busted). */
export const STARTING_CREDITS = 10_000;

const keyFor = (playerId: string) => `sweet_credits_${playerId}`;

function sanitize(value: number): number {
  if (!Number.isFinite(value)) return STARTING_CREDITS;
  return Math.max(0, Math.min(1_000_000_000_000, Math.floor(value)));
}

/**
 * Read the player's credit balance, minting the starting stack on first play
 * (or when the stored value is missing/tampered).
 */
export async function getCredits(playerId: string): Promise<number> {
  if (!playerId || typeof window === 'undefined') return STARTING_CREDITS;
  try {
    const raw = await getWithIntegrity(keyFor(playerId));
    if (raw !== null) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed >= 0) return sanitize(parsed);
    }
  } catch {
    /* fall through to mint */
  }
  await setCredits(playerId, STARTING_CREDITS);
  return STARTING_CREDITS;
}

/** Persist the player's credit balance (fire-and-forget safe). */
export async function setCredits(playerId: string, value: number): Promise<void> {
  if (!playerId || typeof window === 'undefined') return;
  try {
    await setWithIntegrity(keyFor(playerId), String(sanitize(value)));
  } catch {
    /* storage unavailable — balance stays in-memory for the session */
  }
}

/** Refill a busted stack back to the starting amount. Returns the new balance. */
export async function refillCredits(playerId: string): Promise<number> {
  await setCredits(playerId, STARTING_CREDITS);
  return STARTING_CREDITS;
}
