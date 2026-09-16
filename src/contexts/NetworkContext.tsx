import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { RPC_ENDPOINTS, EXPLORER_URLS } from '../lib/rpcConfig';

// Network type — Gorbagana is the only chain the site talks to.
export type NetworkType = 'GORBAGANA';

// Gorbagana Network Configuration
export const GORBAGANA_CONFIG = {
  name: 'Gorbagana',
  chainId: 'gorbagana-mainnet',
  rpcEndpoint: RPC_ENDPOINTS.GORBAGANA,
  explorerUrl: EXPLORER_URLS.GORBAGANA,
  currency: {
    symbol: 'GOR',
    decimals: 9,
    displaySymbol: 'G',
  },
  networkLabel: 'Gorbagana_L2',
  tpsLabel: 'GPS', // Gorbagana Per Second
  programId: 'FreEcfZtek5atZJCJ1ER8kGLXB1C17WKWXqsVcsn1kPq', // Bridge program on Gorbagana
};

interface NetworkContextType {
  // Current network
  currentNetwork: NetworkType;
  network: string;
  currency: string;
  networkName: string;
  tpsLabel: string;
  accentColor: string;
  rpcEndpoint: string;
  explorerUrl: string;
  programId: string | null;

  isGorbagana: boolean;

  // Helper functions
  getExplorerLink: (type: 'tx' | 'address' | 'token', value: string) => string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = GORBAGANA_CONFIG;

  const getExplorerLink = useCallback((type: 'tx' | 'address' | 'token', value: string): string => {
    const baseUrl = config.explorerUrl;

    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${value}`;
      case 'address':
        return `${baseUrl}/address/${value}`;
      case 'token':
        return `${baseUrl}/token/${value}`;
      default:
        return baseUrl;
    }
  }, [config.explorerUrl]);

  const value = useMemo(() => ({
    currentNetwork: 'GORBAGANA' as const,
    network: 'GOR',
    currency: config.currency.displaySymbol,
    networkName: config.networkLabel,
    tpsLabel: config.tpsLabel,
    accentColor: 'text-magic-blue',
    rpcEndpoint: config.rpcEndpoint,
    explorerUrl: config.explorerUrl,
    programId: config.programId,
    isGorbagana: true,
    getExplorerLink
  }), [config, getExplorerLink]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) throw new Error('useNetwork must be used within NetworkProvider');
  return context;
};
