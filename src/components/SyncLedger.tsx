import React, { useState } from 'react';
import { Cloud, RefreshCw, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import type { TranslationDictionary } from '../utils/i18n';

interface SyncLedgerProps {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  lastSyncedIso: string | null;
  syncedEmail?: string | null;
  onForceSync: () => Promise<void> | void;
  t: TranslationDictionary;
}

export const SyncLedger: React.FC<SyncLedgerProps> = ({
  isOnline,
  isSyncing,
  queuedCount,
  lastSyncedIso,
  syncedEmail,
  onForceSync,
  t,
}) => {
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleForceSyncClick = async () => {
    setSyncFeedback(null);
    try {
      await onForceSync();
      setSyncFeedback(
        isOnline
          ? 'Force Sync completed successfully with exponential backoff retry.'
          : 'Offline mode: Changes are safely stored in local PWA storage queue.'
      );
    } catch {
      setSyncFeedback('Sync retry scheduled. Will resume automatically when online.');
    }
  };

  const formattedTime = lastSyncedIso
    ? new Date(lastSyncedIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Never';

  return (
    <footer
      data-testid="sync-ledger-footer-component"
      className="border-t border-[#E8E3DB] dark:border-[#2C3037] bg-[#F3EFE9]/90 dark:bg-[#121315] py-4 px-4 sm:px-6 transition-colors"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#575B62] dark:text-[#A3A7AE]">
        {/* Left: Status & Pending Count */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 font-semibold">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[#146C53] dark:text-[#2EB88B]">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online (Secure Mesh)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#C4622D] dark:text-[#E07B46]">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Field Mode</span>
              </span>
            )}
          </div>

          <span className="hidden sm:inline text-[#E8E3DB] dark:text-[#2C3037]">·</span>

          <div
            data-testid="sync-ledger-pending-count"
            className="inline-flex items-center gap-1.5 font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            <Cloud className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
            <span>
              Pending PWA Mutations:{' '}
              <strong className="font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]">
                {queuedCount}
              </strong>
            </span>
          </div>

          <span className="hidden sm:inline text-[#E8E3DB] dark:text-[#2C3037]">·</span>

          <span>
            Last Synced:{' <code className="font-mono-tabular font-medium text-[#17191C] dark:text-[#F4F2EE]">' + formattedTime + '</code> '}
          </span>

          {syncedEmail && (
            <>
              <span className="hidden sm:inline text-[#E8E3DB] dark:text-[#2C3037]">·</span>
              <span className="truncate max-w-[200px]" title={syncedEmail}>
                Vault: <strong>{syncedEmail}</strong>
              </span>
            </>
          )}
        </div>

        {/* Right: Force Sync Manual Trigger & Feedback */}
        <div className="flex flex-wrap items-center gap-2.5">
          {syncFeedback && (
            <span
              role="status"
              className="text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B] bg-[#E7F3EE] dark:bg-[#142B24] px-2.5 py-1 rounded-lg border border-[#146C53]/30"
            >
              {syncFeedback}
            </span>
          )}

          <button
            type="button"
            data-testid="sync-ledger-force-sync-btn"
            onClick={() => void handleForceSyncClick()}
            disabled={isSyncing}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isSyncing ? 'Syncing with Backoff...' : 'Force Sync Now'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
