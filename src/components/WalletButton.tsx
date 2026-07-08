import React, { useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { shortAddress } from '../lib/playerIdentity';

/**
 * Site-wide wallet connect button for the top nav.
 *
 * Opens the wallet-adapter modal (Phantom, Backpack, Nightly, Solflare and any
 * Wallet Standard wallet the visitor has installed). Once connected it shows
 * the short address with a small menu to copy the address or disconnect.
 */
const WalletButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!connected || !publicKey) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className={`inline-flex items-center gap-2 border border-sweetardios-cyan/50 bg-sweetardios-cyan/10 font-bold uppercase tracking-wide text-sweetardios-cyan transition-colors hover:border-sweetardios-cyan hover:bg-sweetardios-cyan/20 hover:text-white ${
          compact ? 'px-3 py-2 text-[11px]' : 'px-4 py-2 text-xs'
        }`}
      >
        <span aria-hidden className="h-1.5 w-1.5 bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]" style={{ borderRadius: '9999px' }} />
        Connect Wallet
      </button>
    );
  }

  const address = publicKey.toBase58();

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 border border-sweetardios-cyan/40 bg-white/[0.04] font-mono text-sweetardios-cyan transition-colors hover:border-sweetardios-cyan hover:text-white ${
          compact ? 'px-3 py-2 text-[11px]' : 'px-4 py-2 text-xs'
        }`}
      >
        <span aria-hidden className="h-1.5 w-1.5 animate-pulse bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]" style={{ borderRadius: '9999px' }} />
        {shortAddress(address)}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 border border-sweetardios-violet/50 bg-sweetardios-oxford/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-100/50">
              {wallet?.adapter.name ?? 'Wallet'} connected
            </p>
            <p className="mt-1 break-all font-mono text-xs text-white/90">{address}</p>
          </div>
          <button
            type="button"
            onClick={copyAddress}
            className="block w-full px-4 py-2.5 text-left text-xs text-blue-100/80 transition-colors hover:bg-white/5 hover:text-sweetardios-cyan"
          >
            {copied ? 'Copied!' : 'Copy address'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              disconnect();
            }}
            className="block w-full px-4 py-2.5 text-left text-xs text-blue-100/80 transition-colors hover:bg-white/5 hover:text-sweetardios-cerise"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletButton;
