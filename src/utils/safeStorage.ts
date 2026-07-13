const persistentFallback = new Map<string, string>();
const sessionFallback = new Map<string, string>();

export interface SafeStorage {
  readonly length: number;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
}

function createSafeStorage(kind: 'localStorage' | 'sessionStorage', fallback: Map<string, string>): SafeStorage {
  let resolvedStorage: Storage | null | undefined;
  const nativeStorage = (): Storage | null => {
    if (resolvedStorage !== undefined) return resolvedStorage;
    if (typeof window === 'undefined') return null;
    try {
      const storage = window[kind];
      const probe = '__sweetardio_storage_probe__';
      storage.setItem(probe, probe);
      storage.removeItem(probe);
      resolvedStorage = storage;
    } catch {
      resolvedStorage = null;
    }
    return resolvedStorage;
  };

  return {
    get length() {
      return nativeStorage()?.length ?? fallback.size;
    },
    getItem(key) {
      return nativeStorage()?.getItem(key) ?? fallback.get(key) ?? null;
    },
    setItem(key, value) {
      const storage = nativeStorage();
      if (storage) storage.setItem(key, value);
      else fallback.set(key, value);
    },
    removeItem(key) {
      const storage = nativeStorage();
      if (storage) storage.removeItem(key);
      else fallback.delete(key);
    },
    key(index) {
      return nativeStorage()?.key(index) ?? [...fallback.keys()][index] ?? null;
    },
  };
}

export const safeLocalStorage = createSafeStorage('localStorage', persistentFallback);
export const safeSessionStorage = createSafeStorage('sessionStorage', sessionFallback);
