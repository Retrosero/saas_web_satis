/**
 * localStorage yardımcıları (SSR-safe). auth token'ları vb. için.
 */
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!isBrowser) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota error
    }
  },
  remove(key: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
  clear(): void {
    if (!isBrowser) return;
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  },
};
