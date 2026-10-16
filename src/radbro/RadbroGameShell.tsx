import { useEffect, type ReactNode } from 'react';
import {
  listenForRadbroReadyRequests,
  postRadbroReady,
  SWEETARDIO_URL,
  type RadbroGameMetadata,
} from './bridge';

interface RadbroGameShellProps {
  metadata: RadbroGameMetadata;
  children: ReactNode;
}

export function RadbroGameShell({ metadata, children }: RadbroGameShellProps) {
  useEffect(() => {
    postRadbroReady(metadata);
    return listenForRadbroReadyRequests(metadata);
  }, [metadata]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {children}
      {/* Our home, shown wherever the game is embedded (radbro.fun, radbro.gg, ...). */}
      <a
        href={SWEETARDIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="More from Sweetardio at sweetardio.fun"
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          zIndex: 50,
          padding: '3px 8px',
          borderRadius: 999,
          background: 'rgba(7, 15, 52, 0.72)',
          border: '1px solid rgba(52, 237, 243, 0.45)',
          color: '#34EDF3',
          font: '600 11px/1.3 system-ui, sans-serif',
          letterSpacing: '0.02em',
          textDecoration: 'none',
        }}
      >
        by Sweetardio · sweetardio.fun
      </a>
    </main>
  );
}
