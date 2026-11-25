import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, CloudUpload, RefreshCw, WifiOff } from 'lucide-react';

interface PwaSyncStatusBarProps {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  syncProgress?: number;
  syncCompletedCount?: number;
  syncTotalCount?: number;
  onSyncNow?: () => Promise<void> | void;
}

export const PwaSyncStatusBar: React.FC<PwaSyncStatusBarProps> = ({
  isOnline,
  isSyncing,
  queuedCount,
  syncProgress = 0,
  syncCompletedCount = 0,
  syncTotalCount = 0,
  onSyncNow,
}) => {
  const [recentlySynced, setRecentlySynced] = useState(false);
  const wasSyncingRef = useRef(isSyncing);

  useEffect(() => {
    if (wasSyncingRef.current && !isSyncing && isOnline) {
      setRecentlySynced(true);
      const timer = window.setTimeout(() => setRecentlySynced(false), 2600);
      return () => window.clearTimeout(timer);
    }
    wasSyncingRef.current = isSyncing;
    return undefined;
  }, [isSyncing, isOnline]);

  useEffect(() => {
    wasSyncingRef.current = isSyncing;
  }, [isSyncing]);

  const showBar = !isOnline || isSyncing || queuedCount > 0 || recentlySynced;
  const clampedPercent = Math.max(
    0,
    Math.min(100, Math.round(isSyncing ? Math.max(15, syncProgress) : recentlySynced ? 100 : 0))
  );

  const statusKey = !isOnline
    ? 'waiting'
    : isSyncing
      ? 'syncing'
      : recentlySynced
        ? 'synced'
        : 'queued';

  return (
    <AnimatePresence initial={false}>
      {showBar && (
        <motion.div
          key="pwa-sync-status-bar"
          role="status"
          aria-live="polite"
          data-testid="pwa-sync-status-bar"
          data-sync-state={statusKey}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full border-b ${
            !isOnline
              ? 'border-[#C4622D]/30 dark:border-[#E07B46]/35 bg-[#F9ECE5] dark:bg-[#261B15] text-[#8D4119] dark:text-[#F0A47A]'
              : isSyncing || recentlySynced
                ? 'border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]'
                : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#16181C] text-[#575B62] dark:text-[#A3A7AE]'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-[11px] sm:text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 border ${
                  !isOnline
                    ? 'bg-white/85 dark:bg-[#1E1410] border-[#C4622D]/30 dark:border-[#E07B46]/35 text-[#C4622D] dark:text-[#E07B46]'
                    : isSyncing
                      ? 'bg-white/90 dark:bg-[#10231D] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
                      : recentlySynced
                        ? 'bg-white/90 dark:bg-[#10231D] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                }`}
              >
                {!isOnline ? (
                  <WifiOff className="w-3 h-3 shrink-0" />
                ) : isSyncing ? (
                  <RefreshCw className="w-3 h-3 shrink-0 animate-spin" />
                ) : recentlySynced ? (
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                ) : (
                  <CloudUpload className="w-3 h-3 shrink-0 text-[#146C53] dark:text-[#2EB88B]" />
                )}
                <span data-testid="pwa-sync-status-label">
                  {!isOnline
                    ? 'Waiting for Network'
                    : isSyncing
                      ? 'Syncing in Progress'
                      : recentlySynced
                        ? 'Synced to Firebase'
                        : 'Pending Offline Queue'}
                </span>
              </span>

              <p className="truncate sm:whitespace-normal text-[#43484E] dark:text-[#D5D9DF]">
                {!isOnline
                  ? queuedCount > 0
                    ? `${queuedCount} queued update${queuedCount === 1 ? '' : 's'} saved locally — will flush to Firebase automatically once online.`
                    : 'Offline PWA mode active — changes save locally and will sync automatically when reconnected.'
                  : isSyncing
                    ? syncTotalCount > 0
                      ? `Flushing offline mutation queue to Firebase (${syncCompletedCount}/${syncTotalCount})…`
                      : 'Flushing offline mutation queue to Firebase…'
                    : recentlySynced
                      ? 'Offline queue flushed cleanly to Firebase.'
                      : `${queuedCount} local update${queuedCount === 1 ? '' : 's'} ready to flush to Firebase.`}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {isSyncing && (
                <span
                  data-testid="pwa-sync-percent"
                  className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]"
                >
                  {clampedPercent}%
                </span>
              )}

              {!isOnline && queuedCount > 0 && (
                <span className="font-mono-tabular tabular-nums font-semibold text-[#C4622D] dark:text-[#E07B46]">
                  {queuedCount} queued
                </span>
              )}

              {isOnline && !isSyncing && queuedCount > 0 && onSyncNow && (
                <button
                  type="button"
                  onClick={() => void onSyncNow()}
                  data-testid="pwa-sync-now-btn"
                  className="px-2.5 py-1 rounded-md bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>

          {/* Distinct Animated Progress Bar during active Firebase queue flush */}
          {(isSyncing || recentlySynced) && (
            <div
              role="progressbar"
              aria-label="Firebase offline queue sync progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={clampedPercent}
              data-testid="pwa-sync-progress-bar"
              className="relative h-1.5 w-full bg-[#146C53]/15 dark:bg-[#2EB88B]/15 overflow-hidden"
            >
              <motion.div
                initial={{ width: '10%' }}
                animate={{ width: `${clampedPercent}%` }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full bg-[#146C53] dark:bg-[#2EB88B] overflow-hidden"
              >
                {isSyncing && (
                  <motion.div
                    aria-hidden="true"
                    initial={{ x: '-100%' }}
                    animate={{ x: '250%' }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.15,
                      ease: 'linear',
                    }}
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/45 dark:via-white/35 to-transparent"
                  />
                )}
              </motion.div>
            </div>
          )}

          {/* Distinct Paused/Waiting Track when offline */}
          {!isOnline && (
            <div
              aria-hidden="true"
              data-testid="pwa-waiting-network-bar"
              className="h-1 w-full bg-[repeating-linear-gradient(90deg,rgba(196,98,45,0.4)_0_10px,transparent_10px_18px)] dark:bg-[repeating-linear-gradient(90deg,rgba(224,123,70,0.45)_0_10px,transparent_10px_18px)]"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
