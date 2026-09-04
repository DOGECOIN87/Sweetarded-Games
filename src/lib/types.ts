export interface GameConfig {
  debugEmptyPool: boolean;
  debugAutoplay: boolean;
  debugMaxSpeed: boolean;
  debugColliders: boolean;
  debugHideCabinet: boolean;
  debugPolygons: boolean;
  debugControls: boolean;
  debugFps: boolean;
}

/** A coin the player just collected — drives the floating payout popups. */
export interface CollectEvent {
  /** Coin tier index (see COIN_TIERS). */
  tier: number;
  /** Credits actually awarded, after any rain multiplier. */
  amount: number;
  /** True when a rain multiplier was applied. */
  boosted: boolean;
}

export interface GameState {
  score: number;
  balance: number;
  netProfit: number;
  fps: number;
  isPaused: boolean;
  /** 0–1 bump recharge. 1 = ready. */
  bumpCharge: number;
  /** Machine is tilted: bumping is locked out for a few seconds. */
  tilted: boolean;
  /** Seconds left on the tilt lockout, so the HUD can count it down. */
  tiltSecondsLeft: number;
  /** Total value of every prize coin (tier > 0) currently on the playfield. */
  prizeValueOnField: number;
  /** Most recent collection, for payout popups. */
  lastCollect: CollectEvent | null;
}

export type GameEventCallback = (state: Partial<GameState>) => void;
