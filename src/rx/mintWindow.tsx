/**
 * The register behind PAY AT WINDOW: LaunchMyNFT's own Solana embed.
 *
 * LaunchMyNFT stays authoritative for price, eligibility, supply and the
 * transaction. Its script hydrates two fixed ids (#mint-button-container,
 * #mint-counter) and has no unmount, so the embed lives in one hidden host
 * for the whole visit and is only loaded the first time the bag opens.
 *
 * Nothing of the vendor UI is shown: the printed PAY AT WINDOW sticker on
 * the bag clicks the embed's button, and the embed's state (connect / mint /
 * sold out / result) is read back from its DOM. Its wallet chooser still
 * opens as normal — that part of the flow is the wallet's, not ours.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { isOfficialHost, LMNFT } from './config';

export type MintAction = 'connect' | 'mint' | 'busy' | 'shut';

export interface MintState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** What pressing PAY AT WINDOW does right now. */
  action: MintAction | null;
  soldOut: boolean;
  /** Latest result from the embed, with a counter so repeats still register. */
  result: { kind: 'success' | 'failed'; seq: number } | null;
}

interface MintWindow {
  state: MintState;
  open: () => void;
  pay: () => void;
}

const Ctx = createContext<MintWindow | null>(null);

const INITIAL: MintState = { status: 'idle', action: null, soldOut: false, result: null };
const SHUT_AFTER_MS = 8000;

/**
 * `warm`: start loading the register ahead of the bag (it is ~8 MB), so it is
 * ready by the time someone gets there. Nothing of it is ever shown until then.
 */
export function MintWindowProvider({ warm = false, children }: { warm?: boolean; children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MintState>(INITIAL);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (warm && isOfficialHost()) setOpened(true);
  }, [warm]);
  const paying = useRef(false);
  /** PAY AT WINDOW was pressed before a wallet was connected: mint once it is. */
  const payAfterConnect = useRef(0);
  /** When the Mint button went disabled without a payment in flight. */
  const disabledSince = useRef(0);
  const lastAlert = useRef('');
  const seq = useRef(0);

  const open = useCallback(() => setOpened(true), []);

  const pay = useCallback(() => {
    const button = hostRef.current?.querySelector<HTMLButtonElement>('#mint-button-container button');
    if (!button || button.disabled) return;
    if (/^mint$/i.test(button.textContent?.trim() ?? '')) paying.current = true;
    else payAfterConnect.current = Date.now();
    button.click();
  }, []);

  // Load the vendor script once, on the first visit to the bag.
  useEffect(() => {
    const host = hostRef.current;
    if (!opened || !host) return undefined;
    const container = host.querySelector<HTMLDivElement>('#mint-button-container');
    if (!container) return undefined;

    const w = window as unknown as { ownerId: string; collectionId: string };
    w.ownerId = LMNFT.ownerId;
    w.collectionId = LMNFT.collectionId;
    setState((s) => ({ ...s, status: 'loading' }));
    let recheck = 0;

    const read = () => {
      const button = container.querySelector<HTMLButtonElement>('button');
      const text = (button?.textContent ?? '').trim().toLowerCase();
      const counter = (host.querySelector('#mint-counter')?.textContent ?? '').match(/(\d+)\s*\/\s*(\d+)/);
      const counterSoldOut = counter ? Number(counter[2]) > 0 && Number(counter[1]) >= Number(counter[2]) : false;
      const soldOut = counterSoldOut || text === 'sold out';

      const alert = (host.querySelector('.MuiAlert-message, [role="alert"]')?.textContent ?? '').trim().toLowerCase();
      let result: MintState['result'] | undefined;
      if (alert && alert !== lastAlert.current) {
        if (alert.includes('success')) result = { kind: 'success', seq: ++seq.current };
        else if (alert.includes('fail')) result = { kind: 'failed', seq: ++seq.current };
        if (result) paying.current = false;
      }
      lastAlert.current = alert;

      let action: MintAction | null = null;
      if (!button) action = null;
      else if (soldOut) action = 'shut';
      else if (text === 'mint') {
        if (!button.disabled) {
          disabledSince.current = 0;
          action = 'mint';
        } else if (paying.current) {
          action = 'busy';
        } else {
          // Right after connecting, the embed disables Mint while it loads the
          // wallet's eligibility. Only a button that stays disabled means shut.
          disabledSince.current ||= Date.now();
          const settled = Date.now() - disabledSince.current >= SHUT_AFTER_MS;
          action = settled ? 'shut' : 'busy';
          if (!settled) {
            window.clearTimeout(recheck);
            recheck = window.setTimeout(read, SHUT_AFTER_MS + 50);
          }
        }
      } else if (text.includes('connecting')) action = 'busy';
      else action = 'connect';

      // One press of PAY AT WINDOW covers both steps: connect, then the wallet asks to pay.
      if (action === 'mint' && button && payAfterConnect.current) {
        const fresh = Date.now() - payAfterConnect.current < 120_000;
        payAfterConnect.current = 0;
        if (fresh) {
          paying.current = true;
          action = 'busy';
          window.setTimeout(() => button.click(), 0);
        }
      }

      setState((s) => {
        const next: MintState = { status: button ? 'ready' : s.status, action, soldOut, result: result ?? s.result };
        const same =
          next.status === s.status && next.action === s.action && next.soldOut === s.soldOut && next.result === s.result;
        return same ? s : next;
      });
    };

    const observer = new MutationObserver(read);
    observer.observe(host, { childList: true, subtree: true, characterData: true, attributes: true });

    let style: HTMLLinkElement | null = null;
    if (!document.querySelector('link[data-lmnft-style]')) {
      style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = LMNFT.style;
      style.dataset.lmnftStyle = '1';
      document.head.appendChild(style);
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = LMNFT.script;
    script.addEventListener('error', () => setState((s) => ({ ...s, status: 'error' })), { once: true });
    document.body.appendChild(script);

    // The script (~8 MB) loads, then fetches the collection before it renders
    // anything. If it gets there late, read() flips the status back to ready.
    const timeout = window.setTimeout(() => {
      if (!container.childNodes.length) setState((s) => ({ ...s, status: 'error' }));
    }, 45_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(recheck);
      observer.disconnect();
    };
  }, [opened]);

  return (
    <Ctx.Provider value={{ state, open, pay }}>
      {children}
      <div ref={hostRef} className="rx-register" aria-hidden="true">
        <div id="mint-button-container" />
        <div id="mint-counter" />
      </div>
    </Ctx.Provider>
  );
}

export function useMintWindow(): MintWindow {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMintWindow needs MintWindowProvider');
  return ctx;
}

export interface CollectionDoc {
  cost: string | null;
  soldOut: boolean;
}

/** The collection's public LaunchMyNFT config — the live price and sold-out flag. */
export async function fetchCollectionDoc(): Promise<CollectionDoc | null> {
  try {
    const res = await fetch(LMNFT.doc);
    if (!res.ok) return null;
    const doc = (await res.json()) as { fields?: Record<string, Record<string, unknown>> };
    const f = doc.fields ?? {};
    const minted = Number(f.totalMints?.stringValue ?? f.totalMints?.integerValue ?? NaN);
    const supply = Number(f.maxSupply?.stringValue ?? f.maxSupply?.integerValue ?? NaN);
    return {
      cost: typeof f.cost?.stringValue === 'string' ? f.cost.stringValue : null,
      soldOut: f.soldOut?.booleanValue === true || (supply > 0 && minted >= supply),
    };
  } catch {
    return null;
  }
}
