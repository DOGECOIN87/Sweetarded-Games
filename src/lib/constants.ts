export const PHYSICS = {
  GRAVITY: { x: 0.0, y: -9.81, z: 0.0 },
  TIMESTEP: 1 / 60,
  COIN_RADIUS: 0.55,
  COIN_HEIGHT: 0.1, // Thinner for realistic stacking
  PUSHER_AMPLITUDE: 1.1,
  PUSHER_PERIOD: 4.0, // Slower, heavier machine feel
  COIN_FRICTION: 0.4, // Improved friction for realistic sliding
  COIN_RESTITUTION: 0.1, // Less bouncy, heavier feel
  COIN_LINEAR_DAMPING: 2.0, // High damping so resting coins settle quickly
  COIN_ANGULAR_DAMPING: 2.0, // Stops spin fast to prevent jitter
  MAX_COINS: 800,
  COIN_DENSITY: 8.0, // Realistic metal density
};

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
