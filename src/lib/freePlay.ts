/**
 * Free-play mode.
 *
 * When enabled, the games are playable for fun without connecting a wallet or
 * spending tokens — balances are off-chain credits and no on-chain transactions
 * are required (the on-chain hooks already no-op without a connected wallet).
 *
 * Every player starts with the same STARTING_CREDITS stack (see lib/credits),
 * shared between both games and keyed to their wallet when one is connected.
 */
import { STARTING_CREDITS } from './credits';

export const FREE_PLAY = true;

/** Starting credits for free play — one shared stack across the arcade. */
export const FREE_PLAY_BALANCE = STARTING_CREDITS;
