export const SLOTS_OUTCOME_META = [
  { tier: -1 }, { tier: 8 }, { tier: 7 }, { tier: 6 }, { tier: 5 }, { tier: 4 },
  { tier: 3 }, { tier: 2 }, { tier: 1 }, { tier: 0 }, { tier: 9 },
] as const;
export const DEFAULT_SLOTS_WEIGHTS = [100, 200, 200, 150, 120, 100, 60, 30, 15, 5, 3];

export function subscribeToSlotsConfig(
  callback: (config: { paused: boolean; outcomeWeights: number[] }) => void,
) {
  callback({ paused: false, outcomeWeights: DEFAULT_SLOTS_WEIGHTS });
  return () => undefined;
}

export function subscribeToJunkPusherConfig(callback: (config: { paused: boolean }) => void) {
  callback({ paused: false });
  return () => undefined;
}
