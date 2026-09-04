export const PHYSICS = {
  GRAVITY: { x: 0.0, y: -9.81, z: 0.0 },
  TIMESTEP: 1 / 60,
  COIN_RADIUS: 0.55,
  COIN_HEIGHT: 0.1, // Thinner for realistic stacking
  PUSHER_AMPLITUDE: 1.1,
  PUSHER_PERIOD: 2.6, // One push every 2.6s — fast enough to read, slow enough to plan
  COIN_FRICTION: 0.4, // Improved friction for realistic sliding
  COIN_RESTITUTION: 0.1, // Less bouncy, heavier feel
  COIN_LINEAR_DAMPING: 2.0, // High damping so resting coins settle quickly
  COIN_ANGULAR_DAMPING: 2.0, // Stops spin fast to prevent jitter
  MAX_COINS: 800,
  COIN_DENSITY: 8.0, // Realistic metal density
};

/**
 * Coin tiers — the reason to care where you aim.
 *
 * Every coin costs 1 credit to drop, but what's already sitting on the
 * playfield is worth wildly different amounts. Nudging a gold medallion over
 * the lip is worth 100 drops, so the field is a puzzle rather than a treadmill.
 *
 * Index is the tier id, stored on each coin body. `weight` is the relative
 * chance of a coin spawning at that tier when the machine seeds or restocks
 * the field — the coins the player drops are always tier 0.
 */
export const COIN_TIERS = [
  // value, spawn weight, size, and the emissive tint that makes it readable at a glance
  { value: 1,   weight: 100, radiusScale: 1.0,  color: 0x2a2a2a, emissive: 0xffffff, intensity: 0.7, label: 'SWEET',    hex: '#e8ecff' },
  { value: 5,   weight: 26,  radiusScale: 1.0,  color: 0x0d3a4a, emissive: 0x34EDF3, intensity: 1.1, label: 'CHROME',   hex: '#34EDF3' },
  { value: 25,  weight: 7,   radiusScale: 1.15, color: 0x4a0d33, emissive: 0xF715AB, intensity: 1.3, label: 'CERISE',   hex: '#F715AB' },
  { value: 100, weight: 2,   radiusScale: 1.3,  color: 0x4a3a0d, emissive: 0xFFC93C, intensity: 1.6, label: 'MEDALLION', hex: '#FFC93C' },
];

/** Per-tier instance caps — prize coins are rare, so they need far fewer slots. */
export const COIN_TIER_CAPS = [PHYSICS.MAX_COINS, 160, 80, 32];

export const TIMING = {
  /** Minimum gap between dropped coins — stops hold-to-spam flooding the field. */
  DROP_COOLDOWN_MS: 160,
  /**
   * Bump recharge — short on purpose.
   *
   * A long cooldown makes bumping safe and boring: you can never take enough
   * of them in a row to get into trouble, so there is no decision. Keeping it
   * short means you *can* bump a medallion off the lip with three quick
   * shoves, and the tilt below is what makes that a gamble rather than a
   * free action.
   */
  BUMP_COOLDOWN_MS: 1200,
  /**
   * Bumps allowed inside TILT_WINDOW_MS before the machine tilts.
   *
   * Tuned against the recharge so only genuine rapid-fire trips it: four
   * attempts at the 1.2s recharge span 3.6s and tilt, while anything slower
   * than roughly one every 2.7s never does. Ordinary eager play stays safe.
   */
  TILT_LIMIT: 3,
  TILT_WINDOW_MS: 8000,
  /** How long the machine locks out bumping after a tilt. */
  TILT_LOCKOUT_MS: 8000,
};

/** Cost in credits of a single bump. Matches the paytable and button labels. */
export const BUMP_COST = 20;

/** Payout multiplier applied to collected coins while it's raining. */
export const RAIN_MULTIPLIER = 2;

export const DIMENSIONS = {
  PLAYFIELD_WIDTH: 8,
  PLAYFIELD_LENGTH: 10,
  WALL_HEIGHT: 2,
};


export const COLORS = {
  COIN: 0xD4A574, // Cookie golden brown
  COIN_EMISSIVE: 0x8B6F47, // Cookie edge brown
  FLOOR: 0x0a1230, // Dark Oxford floor (coins pop against it)
  PUSHER: 0x24306b, // Oxford/zaffre slate pusher
  CABINET: 0x0c1745, // Deep Oxford cabinet walls
  LIGHT_AMBIENT: 0xeef2ff, // Cool neutral ambient
  LIGHT_MAIN: 0xfff4e6, // Soft warm-white key light (neutral, no green cast)
};
