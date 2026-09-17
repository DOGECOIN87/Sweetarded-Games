import { useState } from 'react';
import { MINT_URL } from './MintEmbed';
import { AGENT_MINT_ENABLED, PAYBOX, buildAgentMintPrompt } from '../content/agentMint';

/* ── Agentic checkout — "Mint by talking to your AI" ─────────────────
   PayBox (by MoonPay) lives inside the user's own assistant: connect
   once, then the agent can check the price, fund their Solana wallet,
   and walk them through the mint — with a passkey approving anything
   that moves money. This panel is signage for that rail: the setup
   link, the connector URL, and a precomposed, safety-first prompt.  */

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* Clipboard API blocked (permissions / older browser) — fall back. */
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
};

const StepTag = ({ n }: { n: string }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-sweetardios-cyan/40 bg-sweetardios-cyan/[0.07] font-heading text-base text-sweetardios-cyan">
    {n}
  </span>
);

const AgentMint = () => {
  const [copied, setCopied] = useState<'url' | 'prompt' | null>(null);
  if (!AGENT_MINT_ENABLED) return null;

  const prompt = buildAgentMintPrompt(MINT_URL);

  const copy = async (what: 'url' | 'prompt', text: string) => {
    if (await copyText(text)) {
      setCopied(what);
      window.setTimeout(() => setCopied((c) => (c === what ? null : c)), 2200);
    }
  };

  return (
    <section aria-label="Mint with your AI assistant" className="relative mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
      <div className="sw-reveal bg-gradient-to-br from-sweetardios-cyan/50 via-sweetardios-violet/25 to-sweetardios-cerise/40 p-px">
        <div className="relative overflow-hidden bg-sweetardios-oxford/85 px-7 py-10 backdrop-blur-xl sm:px-10 sm:py-12">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* Pitch */}
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 border border-sweetardios-cyan/40 bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-sweetardios-cyan backdrop-blur">
                <span aria-hidden className="h-1.5 w-1.5 animate-pulse bg-sweetardios-cyan shadow-[0_0_8px_#34EDF3]" style={{ borderRadius: '9999px' }} />
                Agentic checkout · New
              </p>
              <h3 className="font-heading mt-5 text-3xl text-white sm:text-4xl">
                <span className="sw-sign">Mint by talking to <span className="sw-glow-cyan text-sweetardios-cyan">your AI</span></span>
              </h3>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-blue-100/65 lg:mx-0">
                No wallet set up? Connect <span className="font-semibold text-white">PayBox</span> — MoonPay's
                non-custodial vault for AI agents — to Claude or ChatGPT, and your assistant handles the rest:
                checks the price, funds your Solana wallet, walks you through the mint.
              </p>
              <p className="mx-auto mt-5 max-w-md text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100/45 lg:mx-0">
                Non-custodial · You approve every transaction by passkey · Sweetardio never touches your funds
              </p>
            </div>

            {/* The three steps — a real sequence */}
            <ol className="flex flex-col gap-4">
              <li className="flex gap-4 border border-white/10 bg-white/[0.03] p-4">
                <StepTag n="1" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">Add PayBox to your assistant</p>
                  <p className="mt-1 text-xs leading-relaxed text-blue-100/60">
                    One tap opens Claude with the connector prefilled — you review, confirm, and register a passkey.
                    Using ChatGPT or another assistant? The PayBox setup page covers those too.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={PAYBOX.claudeInstallUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sw-shine inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-sweetardios-oxford"
                      style={{ background: '#34EDF3' }}
                    >
                      Add to Claude <span aria-hidden>↗</span>
                    </a>
                    <a
                      href={PAYBOX.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-blue-100/70 transition-colors hover:border-sweetardios-cyan/50 hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
                    >
                      Other setups <span aria-hidden>↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copy('url', PAYBOX.mcpUrl)}
                      className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-3 py-2 font-mono text-[11px] text-blue-100/70 transition-colors hover:border-sweetardios-cyan/50 hover:text-sweetardios-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
                      aria-label="Copy the PayBox connector URL"
                    >
                      {PAYBOX.mcpUrl.replace('https://', '')}
                      <span className={copied === 'url' ? 'text-sweetardios-cyan' : 'text-blue-100/40'} aria-hidden>
                        {copied === 'url' ? '✓' : '⧉'}
                      </span>
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex gap-4 border border-white/10 bg-white/[0.03] p-4">
                <StepTag n="2" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">Paste this prompt</p>
                    <button
                      type="button"
                      onClick={() => copy('prompt', prompt)}
                      className="inline-flex items-center gap-2 border border-sweetardios-cyan/40 bg-sweetardios-cyan/[0.06] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-sweetardios-cyan transition-all hover:bg-sweetardios-cyan hover:text-sweetardios-oxford focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sweetardios-cyan"
                    >
                      {copied === 'prompt' ? 'Copied ✓' : 'Copy prompt'}
                    </button>
                  </div>
                  <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap border border-white/10 bg-sweetardios-oxford/80 p-3 text-left font-mono text-[11px] leading-relaxed text-blue-100/70">
{prompt}
                  </pre>
                </div>
              </li>

              <li className="flex gap-4 border border-white/10 bg-white/[0.03] p-4">
                <StepTag n="3" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">Approve with your passkey</p>
                  <p className="mt-1 text-xs leading-relaxed text-blue-100/60">
                    Your assistant prepares everything; nothing moves until you approve. Always verify the
                    amount and the mint address on the approval screen before you tap.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <p className="mt-8 border-t border-white/10 pt-4 text-center text-[11px] leading-relaxed text-white/35">
            PayBox is a MoonPay product (launched July 2026) and is not affiliated with Sweetardio.
            Agentic payments are new — double-check every approval. The official mint remains{' '}
            <a href={MINT_URL} target="_blank" rel="noopener noreferrer" className="text-sweetardios-cyan/70 underline-offset-2 hover:underline">
              LaunchMyNFT
            </a>
            , with or without an agent. <a href={PAYBOX.docs} target="_blank" rel="noopener noreferrer" className="text-white/45 underline-offset-2 hover:underline">PayBox docs ↗</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default AgentMint;
