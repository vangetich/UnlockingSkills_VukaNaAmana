import React, { useState } from 'react';
import { Download, Globe, Moon, RefreshCw, Sun, WifiOff } from 'lucide-react';
import type { LocaleCode, ThemeMode } from '../types/kora';
import { LOCALE_OPTIONS, type TranslationDictionary } from '../utils/i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface WorkspaceUtilitiesProps {
  locale: LocaleCode;
  onChangeLocale: (locale: LocaleCode) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isOnline: boolean;
  queuedCount: number;
  isSignedIn: boolean;
  isSyncing: boolean;
  onSyncNow: () => void;
  t: TranslationDictionary;
}

export const WorkspaceUtilities: React.FC<WorkspaceUtilitiesProps> = ({
  locale,
  onChangeLocale,
  theme,
  onToggleTheme,
  isOnline,
  queuedCount,
  isSignedIn,
  isSyncing,
  onSyncNow,
  t,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  return (
    <div className="border-b border-[#E8E3DB] dark:border-[#2C3037] bg-[#F3EFE9]/65 dark:bg-[#1A1C20]/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Connectivity & Offline Sync status */}
        <div className="flex items-center gap-3 text-xs text-[#575B62] dark:text-[#A3A7AE]">
          {!isOnline ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#9A5B13] dark:text-[#E5A95E]">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{t.offlineBanner}</span>
            </span>
          ) : (
            <span>
              {t.onlineReady}
              <span aria-hidden="true"> · </span>
              {isSignedIn ? t.syncedAccount : t.guestLocalMode}
              {queuedCount > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    {queuedCount} {t.queuedUpdatesSuffix}
                  </span>
                </>
              )}
            </span>
          )}

          {isSignedIn && isOnline && queuedCount > 0 && (
            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#23262B] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#FAF8F5] dark:hover:bg-[#2C3037] transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{t.syncNow}</span>
            </button>
          )}
        </div>

        {/* Right: Language, Theme, and PWA Install */}
        <div className="flex items-center gap-2.5">
          <div className="relative inline-flex items-center">
            <Globe className="w-3.5 h-3.5 text-[#575B62] dark:text-[#A3A7AE] pointer-events-none absolute start-2.5" />
            <select
              aria-label="Select language"
              value={locale}
              onChange={(e) => onChangeLocale(e.target.value as LocaleCode)}
              className="min-h-[36px] ps-8 pe-3 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.nativeLabel}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            className="min-h-[36px] px-3 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#F3EFE9] dark:hover:bg-[#23262B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{theme === 'dark' ? t.themeLight : t.themeDark}</span>
          </button>

          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={() => void install()}
              className="min-h-[36px] px-3 py-1 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.installApp}</span>
            </button>
          )}

          {!isInstalled && !isInstallable && isIOS && (
            <button
              type="button"
              onClick={() => setShowIosGuide(true)}
              className="min-h-[36px] px-3 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] whitespace-nowrap shrink-0"
            >
              {t.installIos}
            </button>
          )}
        </div>
      </div>

      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6">
            <h3 className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
              Install Vuka na Amana on iOS
            </h3>
            <p className="mt-2 text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
              1. Tap the Share icon in Safari.
              <br />
              2. Select Add to Home Screen for offline access.
            </p>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-lg bg-[#146C53] text-white text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
