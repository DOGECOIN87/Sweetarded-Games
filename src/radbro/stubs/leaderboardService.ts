export interface LeaderboardEntry {
  player: string;
  name: string;
  score: number;
  balance: number;
  netProfit: number;
  rank: number;
  lastUpdated: number;
}

export type SortField = 'score' | 'balance' | 'netProfit';

export async function submitScore(): Promise<void> {}
export async function getLeaderboard(): Promise<LeaderboardEntry[]> { return []; }
export function findPlayerRank(): null { return null; }
