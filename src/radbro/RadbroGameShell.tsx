import { useEffect, type ReactNode } from 'react';
import {
  listenForRadbroReadyRequests,
  postRadbroReady,
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

  return <main className="h-screen w-screen overflow-hidden bg-black">{children}</main>;
}
