import React, { useState } from 'react';
import { Building2, Download, Globe, Moon, ShieldCheck, SlidersHorizontal, Sun, WifiOff } from 'lucide-react';
import type { ActiveAuthSession, LocaleCode, PortalRealm, ThemeMode } from '../types/kora';
import { LOCALE_OPTIONS, type TranslationDictionary } from '../utils/i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PwaOfflineSyncButton } from './PwaOfflineSyncButton';
import { EndSessionPopover, type EndSessionDetails } from './EndSessionPopover';

interface WorkspaceUtilitiesProps {
  locale: LocaleCode;
  onChangeLocale: (locale: LocaleCode) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isOnline: boolean;
  queuedCount: number;
  isSignedIn: boolean;
  isSyncing: boolean;
  lastSyncedIso?: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  activePortal: PortalRealm;
  activeSession: ActiveAuthSession | null;
  onSyncNow: () => void;
  onOpenAccountSync: () => void;
  onOpenPrivacyModal?: () => void;
  onOpenAccessComfort?: () => void;
  hasCustomAccessComfort?: boolean;
  onEndSession?: (details?: EndSessionDetails) => void;
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
  lastSyncedIso = null,
  userEmail,
  userDisplayName,
  activePortal,
  activeSession,
  onSyncNow,
  onOpenAccountSync,
  onOpenPrivacyModal,
  onOpenAccessComfort,
  hasCustomAccessComfort = false,
  onEndSession,
  t,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isPartnerPortal = activePortal === 'partner';

  return (
    <div className="border-b border-[#E8E3DB] dark:border-[#2C3037] bg-[#F3EFE9]/65 dark:bg-[#1A1C20]/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Connectivity & Isolated Session Context */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
          {!isOnline ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#9A5B13] dark:text-[#E5A95E]">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{t.offlineBanner}</span>
            </span>
          ) : isPartnerPortal && activeSession?.realm === 'partner' ? (
            <span
              data-testid="partner-session-context-strip"
              className="inline-flex items-center gap-1.5 font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              <Building2 className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46]" />
              <span>{activeSession.claims.orgName}</span>
              <span aria-hidden="true" className="text-[#A3A7AE]">·</span>
              <span className="text-[#146C53] dark:text-[#2EB88B] font-semibold">
                {activeSession.claims.memberRole === 'partner_admin' ? 'Partner Admin' : 'Hiring Lead'}
              </span>
              <span aria-hidden="true" className="hidden sm:inline text-[#A3A7AE]">·</span>
              <span className="hidden sm:inline font-mono-tabular text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                {activeSession.claims.workEmail}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              {activeSession?.realm === 'talent' && (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                  <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    {activeSession.claims.displayName}
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
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
            </span>
          )}
        </div>

        {/* Right: PWA Offline Sync, Account Sync (Talent Studio), Language, Theme, and PWA Install */}
        <div className="flex flex-wrap items-center gap-2">
          {!isPartnerPortal && (
            <>
              <PwaOfflineSyncButton
                isOnline={isOnline}
                isSyncing={isSyncing}
                queuedCount={queuedCount}
                lastSyncedIso={lastSyncedIso}
                syncedEmail={userEmail}
                onSyncNow={onSyncNow}
                onOpenEmailVault={onOpenAccountSync}
                compact
              />

              {userEmail ? (
                <button
                  type="button"
                  data-testid="topnav-account-sync-btn"
                  onClick={onOpenAccountSync}
                  title={`${userEmail} — Manage synced email providers`}
                  className="min-h-[36px] px-3 py-1 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/80 dark:bg-[#142B24]/80 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:bg-[#D5EBE2] dark:hover:bg-[#1C3B31] transition-colors whitespace-nowrap shrink-0 max-w-[180px] truncate"
                >
                  {userDisplayName || userEmail} · Synced
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="topnav-account-sync-btn"
                  onClick={onOpenAccountSync}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span className="sm:hidden">Sync</span>
                  <span className="hidden sm:inline">{t.signInGoogle}</span>
                </button>
              )}

              {onOpenPrivacyModal && (
                <button
                  type="button"
                  data-testid="privacy-shared-access-drawer-btn"
                  onClick={onOpenPrivacyModal}
                  className="min-h-[36px] px-3 py-1 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Privacy &amp; Shared Access</span>
                  <span className="sm:hidden">Privacy</span>
                </button>
              )}
            </>
          )}

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

          {onOpenAccessComfort && (
            <button
              type="button"
              onClick={onOpenAccessComfort}
              aria-label="Access & Comfort Settings"
              title="Access & Comfort Settings (WCAG 2.2)"
              data-testid="utilities-open-access-comfort-btn"
              className={`min-h-[44px] min-w-[44px] px-3 py-1 rounded-lg border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                hasCustomAccessComfort
                  ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                  : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Access</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            data-testid="utilities-theme-toggle-btn"
            className="min-h-[36px] px-3 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#F3EFE9] dark:hover:bg-[#23262B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{theme === 'dark' ? t.themeLight : t.themeDark}</span>
          </button>

          {onEndSession && (
            <EndSessionPopover
              portal={activePortal}
              buttonTestId="utilities-end-session-btn"
              ariaLabel="End Session and lock workspace"
              titleAttr="End Session — lock workspace and return to landing page"
              onConfirmEndSession={(details) => onEndSession(details)}
            />
          )}

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
