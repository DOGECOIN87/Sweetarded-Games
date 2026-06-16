/**
 * Free-play mode.
 *
 * When enabled, the games are playable for fun without connecting a wallet or
 * spending tokens — balances are local/in-memory and no on-chain transactions
 * are required (the on-chain hooks already no-op without a connected wallet).
 */
export const FREE_PLAY = true;

/** Generous starting credits for free play. */
export const FREE_PLAY_BALANCE = 100_000;
