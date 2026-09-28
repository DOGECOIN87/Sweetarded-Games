import { useEffect, useState } from 'react';

/** True once `ms` have passed since mount (or since `key` last changed). */
export function useLater(ms: number, key?: unknown): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const id = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(id);
  }, [ms, key]);
  return ready;
}
