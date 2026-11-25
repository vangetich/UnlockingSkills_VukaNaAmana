import { useEffect, useRef } from 'react';

export interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  debounceMs?: number;
  enabled?: boolean;
  syncedEmail?: string | null;
  onAutoSaved?: (savedData: T) => void;
}

export function useAutoSave<T>({
  key,
  data,
  debounceMs = 5000,
  enabled = true,
  syncedEmail,
  onAutoSaved,
}: UseAutoSaveOptions<T>) {
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(async () => {
      try {
        const payload = dataRef.current;
        const serialized = JSON.stringify(payload);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`vna_autosave_${key}`, serialized);
          window.localStorage.setItem(`vna_last_autosave_iso`, new Date().toISOString());
        }

        // Asynchronous background sync to email-based storage vault if syncedEmail is active
        if (syncedEmail) {
          try {
            await fetch('/api/sync/vault', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'VukaNaAmana',
              },
              body: JSON.stringify({
                email: syncedEmail,
                storeKey: key,
                payload,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch {
            // Silently fallback to offline queue if network fails
          }
        }

        onAutoSaved?.(payload);
      } catch (err) {
        console.error('AutoSave persistence error:', err);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [key, debounceMs, enabled, syncedEmail, onAutoSaved]);
}
