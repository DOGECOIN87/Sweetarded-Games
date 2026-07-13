const nothing = async () => null;
const emptyList = async () => [];

export function useJunkPusherOnChain() {
  return {
    debrisBalance: 0,
    programAvailable: false,
    isProgramReady: false,
    isLoadingBalance: false,
    lastTxSignature: null,
    txStatus: 'idle' as const,
    txLabel: '' as const,
    error: null,
    canPlay: true,
    refreshBalances: nothing,
    initializeGame: nothing,
    recordCoinCollection: nothing,
    recordScore: nothing,
    depositBalance: nothing,
    withdrawBalance: nothing,
    updateBalance: nothing,
    syncBalance: nothing,
    syncAndWithdraw: nothing,
    getOnChainGameBalance: nothing,
    fetchHighScores: emptyList,
    fetchPlayerRank: nothing,
  };
}

export default useJunkPusherOnChain;
