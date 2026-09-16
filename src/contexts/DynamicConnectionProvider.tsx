import React, { useMemo } from 'react';
// Aliased: the site has its own WalletProvider in ./WalletContext, and App.tsx
// nests both. The alias keeps which is which obvious at the call site.
import { ConnectionProvider, WalletProvider as AdapterWalletProvider } from '@solana/wallet-adapter-react';
import { AnchorContextProvider } from './AnchorContext';
import { useNetwork } from './NetworkContext';
import type { Adapter } from '@solana/wallet-adapter-base';

interface DynamicConnectionProviderProps {
  children: React.ReactNode;
  wallets: Adapter[];
}

/**
 * DynamicConnectionProvider wraps ConnectionProvider with the RPC endpoint
 * from NetworkContext, so the wallet connects to the Gorbagana network.
 */
export const DynamicConnectionProvider: React.FC<DynamicConnectionProviderProps> = ({ children, wallets }) => {
  const { rpcEndpoint } = useNetwork();

  // Memoize to prevent unnecessary re-renders
  const endpoint = useMemo(() => rpcEndpoint, [rpcEndpoint]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <AdapterWalletProvider wallets={wallets} autoConnect>
        <AnchorContextProvider>
          {children}
        </AnchorContextProvider>
      </AdapterWalletProvider>
    </ConnectionProvider>
  );
};
