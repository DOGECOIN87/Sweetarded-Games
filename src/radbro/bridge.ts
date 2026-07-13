export type RadbroResultStatus = 'run' | 'clear' | 'gameover';

export interface RadbroGameMetadata {
  game: string;
  title: string;
  objective: string;
  hint: string;
  controls: string[];
  viewport: {
    width: number;
    height: number;
    minHeight?: number;
    maxHeight?: number;
  };
}

declare global {
  interface Window {
    __SWEETARDIO_RADBRO__?: boolean;
    __SWEETARDIO_RADBRO_GAME__?: string;
  }
}

export function enableRadbroRuntime(game?: string): void {
  window.__SWEETARDIO_RADBRO__ = true;
  window.__SWEETARDIO_RADBRO_GAME__ = game;
}

export function isRadbroRuntime(): boolean {
  return typeof window !== 'undefined' && window.__SWEETARDIO_RADBRO__ === true;
}

export function postRadbroReady(metadata: RadbroGameMetadata): void {
  if (!isRadbroRuntime()) return;
  window.parent.postMessage({ type: 'radbro:game-ready', ...metadata }, '*');
}

export function postRadbroResult(status: RadbroResultStatus, score?: number): void {
  if (!isRadbroRuntime()) return;
  const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.round(score ?? 0)) : undefined;
  window.parent.postMessage(
    {
      type: 'radbro:game-result',
      status,
      ...(window.__SWEETARDIO_RADBRO_GAME__ ? { game: window.__SWEETARDIO_RADBRO_GAME__ } : {}),
      ...(normalizedScore === undefined ? {} : { score: normalizedScore }),
    },
    '*',
  );
}

export function listenForRadbroReadyRequests(metadata: RadbroGameMetadata): () => void {
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'radbro:game-ready-request') postRadbroReady(metadata);
  };
  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}

export function gameAsset(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}
