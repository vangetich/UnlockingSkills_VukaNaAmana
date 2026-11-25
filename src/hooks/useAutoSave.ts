import { useCallback, useEffect, useRef } from 'react';

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
  const serializedData = JSON.stringify(data);

  const persistAndSync = useCallback(
    async (payload: T, serialized: string) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`vna_autosave_${key}`, serialized);
          window.localStorage.setItem('vna_last_autosave_iso', new Date().toISOString());
        }

        if (syncedEmail && syncedEmail.includes('@')) {
          try {
            await fetch('/api/sync/email-vault', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'VukaNaAmana',
              },
              body: JSON.stringify({
                email: syncedEmail,
                provider: 'autosave-vault',
                payload: {
                  storeKey: key,
                  data: payload,
                  savedAtIso: new Date().toISOString(),
                },
              }),
            });
          } catch {
            // Silently fallback to local offline persistence if network fails
          }
        }

        onAutoSaved?.(payload);
      } catch (err) {
        console.error('AutoSave persistence error:', err);
      }
    },
    [key, syncedEmail, onAutoSaved]
  );

  // Debounced auto-save every 5 seconds when data changes
  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(() => {
      void persistAndSync(dataRef.current, JSON.stringify(dataRef.current));
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [serializedData, debounceMs, enabled, persistAndSync]);

  // Flush immediately if user exits section or closes/navigates away
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleBeforeExit = () => {
      try {
        const currentSerialized = JSON.stringify(dataRef.current);
        window.localStorage.setItem(`vna_autosave_${key}`, currentSerialized);
        window.localStorage.setItem('vna_last_autosave_iso', new Date().toISOString());
      } catch {
        // Ignore storage quota issues on unload
      }
    };

    window.addEventListener('beforeunload', handleBeforeExit);
    return () => {
      handleBeforeExit();
      window.removeEventListener('beforeunload', handleBeforeExit);
    };
  }, [key, enabled]);
}

