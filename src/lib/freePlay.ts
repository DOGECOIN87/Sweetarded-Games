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

/**
 * Whether the games show any wallet UI at all.
 *
 * Nothing in the arcade costs money — credits are free, they refill when you
 * bust, and the on-chain program isn't deployed — so asking players to connect
 * a wallet before they can play is a barrier that buys them nothing. Leaderboard
 * identity comes from the persistent arcade handle in lib/playerIdentity, which
 * never needed a wallet in the first place.
 *
 * The on-chain plumbing (deposit / withdraw / balance sync) is left intact
 * behind this flag: flip it back to `FREE_PLAY === false` to restore the
 * connect, deposit and withdraw controls once a program is actually deployed.
 */
export const WALLET_IN_GAMES = false;

/** Starting credits for free play — one shared stack across the arcade. */
export const FREE_PLAY_BALANCE = STARTING_CREDITS;
