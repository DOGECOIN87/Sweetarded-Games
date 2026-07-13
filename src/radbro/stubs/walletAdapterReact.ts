const disconnectedWallet = {
  publicKey: null,
  connected: false,
  connecting: false,
  wallet: null,
  signTransaction: null,
  signMessage: null,
  disconnect: async () => undefined,
};

export function useWallet() {
  return disconnectedWallet;
}

export function useConnection() {
  return { connection: null };
}
