import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * LaunchMyNFT mint embed.
 *
 * The vendor bundle reads `window.ownerId` / `window.collectionId`, then
 * hydrates the two fixed element IDs below. Because it does not expose an
 * unmount API, MintEmbedProvider owns one persistent widget and MintEmbed acts
 * as a visible slot. The same hydrated controls can therefore move between the
 * homepage and /mint without duplicate IDs, React roots, or wallet listeners.
 */

export const MINT_URL = 'https://www.launchmynft.io/mint/sweetardio';

const LMNFT_OWNER_ID = 'Hn1i7bLb7oHpAL5AoyGvkn7YgwmWrVTbVsjXA1LYnELo';
const LMNFT_COLLECTION_ID = 'f3Xa1ZHZGsDApCLATuX7';
const LMNFT_SCRIPT_SRC = 'https://storage.googleapis.com/scriptslmt/0.1.4/solana.js';
const LMNFT_STYLE_HREF = 'https://storage.googleapis.com/scriptslmt/0.1.4/solana.css';

type EmbedStatus = 'loading' | 'ready' | 'error';
type RegisterMintSlot = (slot: HTMLDivElement | null) => void;

const MintEmbedContext = createContext<RegisterMintSlot | null>(null);

const LaunchMyNftWidget = () => {
  const [status, setStatus] = useState<EmbedStatus>('loading');
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let script: HTMLScriptElement | null = null;
    let addedStylesheet: HTMLLinkElement | null = null;
    let hydrationTimeout = 0;

    // Configuration supplied by LaunchMyNFT's collection embed dialog.
    (window as unknown as { ownerId: string }).ownerId = LMNFT_OWNER_ID;
    (window as unknown as { collectionId: string }).collectionId = LMNFT_COLLECTION_ID;

    const buttonContainer = buttonContainerRef.current;
    if (!buttonContainer) {
      setStatus('error');
      return undefined;
    }

    const markReady = () => {
      if (disposed || !buttonContainer.childNodes.length) return;
      window.clearTimeout(hydrationTimeout);
      observer.disconnect();
      setStatus('ready');
    };
    const observer = new MutationObserver(markReady);

    if (buttonContainer.childNodes.length) {
      markReady();
    } else {
      observer.observe(buttonContainer, { childList: true, subtree: true });
    }

    // Defer injection by one task so React Strict Mode can finish its
    // development-only setup/cleanup pass before the vendor bundle starts.
    const injectionTimer = window.setTimeout(() => {
      if (disposed) return;

      if (!document.querySelector('link[data-lmnft-style]')) {
        addedStylesheet = document.createElement('link');
        addedStylesheet.rel = 'stylesheet';
        addedStylesheet.href = LMNFT_STYLE_HREF;
        addedStylesheet.dataset.lmnftStyle = '1';
        addedStylesheet.addEventListener(
          'error',
          () => {
            if (!disposed) setStatus('error');
          },
          { once: true },
        );
        document.head.appendChild(addedStylesheet);
      }

      script = document.createElement('script');
      script.type = 'module';
      script.src = LMNFT_SCRIPT_SRC;
      script.defer = true;
      script.dataset.lmnftScript = '1';
      script.addEventListener(
        'error',
        () => {
          if (!disposed) setStatus('error');
        },
        { once: true },
      );
      document.body.appendChild(script);

      // A script load event is not enough: the bundle fetches collection data
      // before hydrating. Treat the rendered controls as the ready signal.
      hydrationTimeout = window.setTimeout(() => {
        if (!disposed && !buttonContainer.childNodes.length) setStatus('error');
      }, 15_000);
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(injectionTimer);
      window.clearTimeout(hydrationTimeout);
      observer.disconnect();
      script?.remove();
      addedStylesheet?.remove();
    };
  }, []);

  return (
    <div
      className="lmnft-embed flex w-full flex-col items-center gap-5"
      aria-busy={status === 'loading'}
    >
      {status === 'loading' && (
        <p role="status" className="text-xs uppercase tracking-[0.22em] text-blue-100/60">
          Loading mint controls…
        </p>
      )}

      {status === 'error' && (
        <p role="alert" className="max-w-sm text-sm leading-relaxed text-rose-300">
          The embedded mint could not load. You can still use the official LaunchMyNFT page below.
        </p>
      )}

      <div
        id="mint-button-container"
        ref={buttonContainerRef}
        role="group"
        aria-label="LaunchMyNFT mint controls"
        className="min-h-[48px]"
      />

      <div id="slider-container" className="flex w-full max-w-[250px] items-center justify-center gap-2">
        <span id="mint-slider" className="inline-block min-w-0 flex-1 max-w-[200px]" />
        <span id="mint-slider-amount" className="text-sm font-bold text-sweetardios-cyan" />
      </div>

      <div id="mint-counter" aria-live="polite" className="text-sweetardios-cyan" />

      <a
        href={MINT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs uppercase tracking-[0.22em] text-blue-100/60 underline-offset-4 transition-colors hover:text-sweetardios-cerise hover:underline"
      >
        Trouble minting? Open on LaunchMyNFT ↗
      </a>
    </div>
  );
};

interface MintEmbedProviderProps {
  children: ReactNode;
}

/** Keeps the third-party widget mounted while its visible slot changes routes. */
export const MintEmbedProvider = ({ children }: MintEmbedProviderProps) => {
  const [portalNode] = useState(() => {
    const node = document.createElement('div');
    node.className = 'w-full';
    node.dataset.lmnftHost = '1';
    return node;
  });
  const [parkingNode, setParkingNode] = useState<HTMLDivElement | null>(null);
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [activated, setActivated] = useState(false);

  const registerParkingNode = useCallback((node: HTMLDivElement | null) => {
    setParkingNode(node);
  }, []);

  const registerSlot = useCallback((node: HTMLDivElement | null) => {
    setSlot(node);
    if (node) setActivated(true);
  }, []);

  useLayoutEffect(() => {
    const destination = slot ?? parkingNode;
    if (destination && portalNode.parentElement !== destination) {
      destination.appendChild(portalNode);
    }
  }, [parkingNode, portalNode, slot]);

  // LaunchMyNFT portals its wallet chooser to document.body. Close it when the
  // visible mint slot leaves the page so it cannot linger over another route.
  useEffect(() => {
    if (slot || !activated) return;
    document
      .querySelector<HTMLButtonElement>('.wallet-adapter-modal .wallet-adapter-modal-button-close')
      ?.click();
  }, [activated, slot]);

  return (
    <MintEmbedContext.Provider value={registerSlot}>
      {children}
      <div ref={registerParkingNode} hidden aria-hidden="true" />
      {activated && parkingNode && createPortal(<LaunchMyNftWidget />, portalNode)}
    </MintEmbedContext.Provider>
  );
};

/** Visible location for the persistent LaunchMyNFT widget. */
const MintEmbed = () => {
  const registerSlot = useContext(MintEmbedContext);
  const attachSlot = useCallback(
    (node: HTMLDivElement | null) => {
      registerSlot?.(node);
    },
    [registerSlot],
  );

  if (!registerSlot) {
    throw new Error('MintEmbed must be rendered inside MintEmbedProvider.');
  }

  return <div ref={attachSlot} className="flex min-h-[120px] w-full justify-center" />;
};

export default MintEmbed;
