import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MINT_DATE_LABEL } from '../components/MintSection';
import { MINT_URL } from '../components/MintEmbed';
import { submitWhitelist, isValidSolanaAddress } from '../services/whitelistService';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WhitelistPage() {
  const [wallet, setWallet] = useState('');
  const [handle, setHandle] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const walletLooksValid = wallet.trim() === '' || isValidSolanaAddress(wallet);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setMessage('');
    const res = await submitWhitelist(wallet, handle);
    setStatus(res.ok ? 'success' : 'error');
    setMessage(res.message);
  };

  return (
    <div className="relative min-h-[calc(100vh-var(--navbar-height,56px))] overflow-hidden text-white">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/games-bg.png)' }} />
        <div className="absolute inset-0 bg-sweetardios-oxford/75" />
        <div className="sw-scanlines absolute inset-0 opacity-[0.1]" />
      </div>

      <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-16 sm:py-20">
        <div className="relative w-full bg-gradient-to-br from-sweetardios-cerise/50 via-sweetardios-violet/25 to-sweetardios-cyan/50 p-px shadow-[0_40px_120px_-40px_rgba(247,21,171,0.55)]">
          <div className="relative overflow-hidden bg-sweetardios-oxford/85 px-7 py-10 backdrop-blur-2xl sm:px-10 sm:py-12">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <header className="text-center">
              <span className="mb-5 inline-flex items-center gap-2.5 border border-sweetardios-cyan/40 bg-white/[0.04] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-sweetardios-cyan backdrop-blur">
                <span className="h-1.5 w-1.5 bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]" style={{ borderRadius: '9999px' }} />
                Whitelist
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl">
                <span className="sw-glow-cerise text-sweetardios-cerise">Secure</span>{' '}
                <span className="sw-glow-cyan text-sweetardios-cyan">your spot</span>
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-blue-100/70">
                Drop your Solana wallet to join the Sweetardio whitelist. Mint day:{' '}
                <span className="font-semibold text-white">{MINT_DATE_LABEL}</span>.
              </p>
            </header>

            {status === 'success' ? (
              <div className="mt-9 text-center">
                <div className="text-5xl">🍬</div>
                <p className="font-heading mt-4 text-2xl text-sweetardios-cyan">{message}</p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href={MINT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sw-shine inline-flex items-center gap-2 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford"
                    style={{ background: '#34EDF3' }}
                  >
                    View on LaunchMyNFT <span aria-hidden>↗</span>
                  </a>
                  <Link to="/" className="text-sm uppercase tracking-[0.2em] text-blue-100/60 transition-colors hover:text-white">
                    Back home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-9 space-y-5">
                <div>
                  <label htmlFor="wl-wallet" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-blue-100/70">
                    Solana wallet address <span className="text-sweetardios-cerise">*</span>
                  </label>
                  <input
                    id="wl-wallet"
                    type="text"
                    required
                    autoComplete="off"
                    spellCheck={false}
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    placeholder="e.g. 7pYJTEX…CEnJd"
                    className={`w-full border bg-sweetardios-oxford/60 px-4 py-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sweetardios-cyan ${
                      walletLooksValid ? 'border-white/15' : 'border-rose-500/70'
                    }`}
                  />
                  {!walletLooksValid && (
                    <p className="mt-1.5 text-xs text-rose-400">That doesn’t look like a valid Solana address.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="wl-handle" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-blue-100/70">
                    X / Twitter handle <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    id="wl-handle"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full border border-white/15 bg-sweetardios-oxford/60 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sweetardios-cyan"
                  />
                </div>

                {status === 'error' && message && (
                  <p className="text-sm text-rose-400">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting' || !wallet.trim() || !walletLooksValid}
                  className="sw-shine inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-sweetardios-oxford transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  style={{ background: '#F715AB' }}
                >
                  {status === 'submitting' ? 'Joining…' : 'Join the whitelist'}
                </button>

                <p className="text-center text-[11px] leading-relaxed text-white/40">
                  We only store your wallet address and optional handle for the mint. No private keys, ever.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
