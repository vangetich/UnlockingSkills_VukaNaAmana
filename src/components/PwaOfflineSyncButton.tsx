import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  CloudUpload,
  Download,
  HardDriveDownload,
  Mail,
  RefreshCw,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PwaOfflineSyncButtonProps {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  lastSyncedIso: string | null;
  syncedEmail?: string | null;
  onSyncNow: () => Promise<void> | void;
  onOpenEmailVault: () => void;
  compact?: boolean;
}

export const PwaOfflineSyncButton: React.FC<PwaOfflineSyncButtonProps> = ({
  isOnline,
  isSyncing,
  queuedCount,
  lastSyncedIso,
  syncedEmail,
  onSyncNow,
  onOpenEmailVault,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    if ('serviceWorker' in navigator) {
      setSwReady(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleTriggerSync = async () => {
    setSyncFeedback(null);
    await onSyncNow();
    setSyncFeedback(
      isOnline
        ? 'Offline queue & local PWA ledger synced.'
        : 'Saved to local IndexedDB/Storage queue — will auto-sync when online.'
    );
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const formattedLastSync = lastSyncedIso
    ? new Date(lastSyncedIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Local-First Ready';

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        data-testid="pwa-offline-sync-btn"
        aria-expanded={open}
        aria-label="PWA Offline Sync and Field Resilience Controls"
        title="PWA Offline Sync & Local Queue Status"
        className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] ${
          !isOnline
            ? 'border-[#C4622D]/50 bg-[#FDF1EB] dark:bg-[#2B1B12] text-[#C4622D] dark:text-[#E07B46]'
            : queuedCount > 0
              ? 'border-[#146C53]/40 bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
              : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#1A1C20] hover:border-[#146C53] text-[#17191C] dark:text-[#F4F2EE]'
        }`}
      >
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#146C53] dark:text-[#2EB88B]" />
        ) : !isOnline ? (
          <WifiOff className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46]" />
        ) : (
          <HardDriveDownload className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
        )}
        <span className={compact ? 'hidden sm:inline' : ''}>
          {!isOnline
            ? `Offline PWA (${queuedCount})`
            : queuedCount > 0
              ? `PWA Sync (${queuedCount})`
              : 'PWA Offline Ready'}
        </span>
      </button>

      {open && (
        <div
          data-testid="pwa-offline-sync-popover"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-xl p-4 z-50 space-y-3.5 text-left"
        >
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                OFFLINE-FIRST PWA · FIELD RESILIENCE
              </p>
              <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                PWA Offline Cache &amp; Queue Sync
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close PWA Sync menu"
              className="p-1 rounded-lg text-[#575B62] hover:text-[#17191C] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Status Indicators */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46]" />
                )}
                <span>{isOnline ? 'Online · Connected' : 'Offline Field Mode'}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                {swReady ? 'PWA Service Worker Active' : 'Local Storage Vault Active'}
              </p>
            </div>

            <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                <CloudUpload className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                <span>{queuedCount} Queued</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                Last sync: {formattedLastSync}
              </p>
            </div>
          </div>

          {syncedEmail && (
            <div className="rounded-xl bg-[#E7F3EE]/60 dark:bg-[#142B24]/60 border border-[#146C53]/25 px-3 py-2 flex items-center gap-2 text-xs text-[#146C53] dark:text-[#2EB88B]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Synced to Email Vault: <strong>{syncedEmail}</strong>
              </span>
            </div>
          )}

          {syncFeedback && (
            <div
              role="status"
              className="rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] px-3 py-2 text-xs font-medium text-[#146C53] dark:text-[#2EB88B] flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              data-testid="pwa-sync-now-action"
              className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Syncing Offline Queue…'
                  : queuedCount > 0
                    ? `Sync ${queuedCount} Queued Item${queuedCount === 1 ? '' : 's'} Now`
                    : 'Verify & Sync Offline PWA Queue Now'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenEmailVault();
              }}
              data-testid="pwa-open-email-vault-btn"
              className="w-full min-h-[38px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
              <span>Backup / Restore Personal Data by Email</span>
            </button>

            {deferredPrompt && !isInstalled && (
              <button
                type="button"
                onClick={handleInstallPwa}
                data-testid="pwa-install-app-btn"
                className="w-full min-h-[38px] px-3.5 py-2 rounded-xl border border-[#C4622D]/35 bg-[#FDF1EB] dark:bg-[#2B1B12] text-xs font-semibold text-[#C4622D] dark:text-[#E07B46] inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Offline App to Device</span>
              </button>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
            Every capability, Living Proof photo, and sprint milestone is cached locally first so field connectivity drops never lose practitioner work.
          </p>
        </div>
      )}
    </div>
  );
};
