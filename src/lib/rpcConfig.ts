/**
 * Centralized RPC Configuration
 *
 * The site is no longer a dapp — the games run in free play and make no
 * on-chain calls. The wallet adapter still requires a connection endpoint, so
 * the default below points at the public Gorbagana RPC. It is not actually
 * contacted during normal use.
 */

// Gorbagana RPC. Wallet-adapter needs a valid URL, but nothing on-chain is called.
const GORBAGANA_RPC = import.meta.env?.VITE_GORBAGANA_RPC || 'https://rpc.trashscan.io';

export const RPC_ENDPOINTS = {
  /** Default connection endpoint (inert in free play — see note above) */
  GORBAGANA: GORBAGANA_RPC,

  /** WebSocket endpoint (unused) */
  GORBAGANA_WS: '',

  /** Legacy REST API base (used by the marketplace service only if re-enabled) */
  GORBAGANA_API: import.meta.env?.VITE_API_BASE_URL || '',
} as const;

/** Gorbagana block explorer */
export const EXPLORER_URLS = {
  GORBAGANA: 'https://explorer.gorbagana.wtf',
} as const;

export type RpcEndpoint = (typeof RPC_ENDPOINTS)[keyof typeof RPC_ENDPOINTS];
