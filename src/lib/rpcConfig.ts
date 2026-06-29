/**
 * Centralized RPC Configuration
 *
 * The site is no longer a dapp — the games run in free play and make no
 * on-chain calls. Solana wallet-adapter still requires a connection endpoint,
 * so the default below is an inert placeholder (a public Solana RPC). It is not
 * actually contacted during normal use; there is no project RPC to point at.
 */

// Inert placeholder. Wallet-adapter needs a valid URL, but nothing on-chain is called.
const PLACEHOLDER_RPC = 'https://api.mainnet-beta.solana.com';

export const RPC_ENDPOINTS = {
  /** Default connection endpoint (inert placeholder — see note above) */
  GORBAGANA: PLACEHOLDER_RPC,

  /** WebSocket endpoint (unused) */
  GORBAGANA_WS: '',

  /** Legacy REST API base (used by the marketplace service only if re-enabled) */
  GORBAGANA_API: import.meta.env?.VITE_API_BASE_URL || '',

  /** Solana mainnet-beta RPC */
  SOLANA_MAINNET: PLACEHOLDER_RPC,

  /** Solana devnet RPC */
  SOLANA_DEVNET: 'https://api.devnet.solana.com',
} as const;

/** Gorbagana block explorer */
export const EXPLORER_URLS = {
  GORBAGANA: 'https://explorer.gorbagana.wtf',
  SOLANA_MAINNET: 'https://explorer.solana.com',
  SOLANA_DEVNET: 'https://explorer.solana.com',
} as const;

export type RpcEndpoint = (typeof RPC_ENDPOINTS)[keyof typeof RPC_ENDPOINTS];
