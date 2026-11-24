import React from 'react';
import { BarChart3, CheckCircle2, Compass, Globe, Search, WifiOff, Wrench } from 'lucide-react';
import type { WorkspaceTab } from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';

interface TopNavProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  userEmail: string | null;
  userDisplayName: string | null;
  isOnline: boolean;
  queuedCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  onBackToHome: () => void;
  onOpenScaleDrawer: () => void;
  onOpenCommandPalette?: () => void;
  t: TranslationDictionary;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  userEmail,
  userDisplayName,
  isOnline,
  queuedCount,
  onSignIn,
  onSignOut,
  onBackToHome,
  onOpenScaleDrawer,
  onOpenCommandPalette,
  t,
}) => {
  const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
    { id: 'verify', label: t.navVerify, icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'unlock', label: t.navUnlock, icon: <Compass className="w-4 h-4" /> },
    { id: 'solve', label: t.navSolve, icon: <Wrench className="w-4 h-4" /> },
    { id: 'pulse', label: t.navPulse, icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#121315]/95 backdrop-blur-sm border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="max-w-6xl mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Clickable Official Bridge Logo + Vuka na Amana lockup -> returns to Landing Funnel */}
          <button
            type="button"
            onClick={onBackToHome}
            aria-label={`${t.brandName} — ${t.backToHome}`}
            title={t.backToHome}
            data-testid="topnav-brand-home-btn"
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0 text-start group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded-md py-1"
          >
            <img
              src="/bridge.jpeg"
              alt="Vuka na Amana Bridge Logo"
              className="h-8 max-w-[96px] sm:h-10 sm:max-w-[140px] w-auto object-contain rounded-md shrink-0"
            />
            <div className="leading-tight min-w-0">
              <span className="block font-display text-sm sm:text-lg font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE] group-hover:text-[#146C53] dark:group-hover:text-[#2EB88B] transition-colors whitespace-nowrap">
                {t.brandName}
              </span>
              <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                Crossing Over
              </span>
            </div>
          </button>

          {/* Zone 2: Clean 4-tab flow */}
          <nav
            aria-label="Primary workspace navigation"
            className="hidden md:flex items-center gap-7"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded-sm ${
                    isActive
                      ? 'text-[#146C53] dark:text-[#2EB88B]'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#146C53] dark:bg-[#2EB88B]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Quick Search (Cmd+K), Partner & Scale Mode icon + Primary account action */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                aria-label="Open quick search command palette (Cmd+K or Ctrl+K)"
                title="Quick Search (Cmd+K / Ctrl+K)"
                data-testid="open-command-palette-btn"
                className="min-h-[38px] min-w-[38px] px-2.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              >
                <Search className="w-3.5 h-3.5" />
                <kbd className="hidden lg:inline text-[10px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                  ⌘K
                </kbd>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenScaleDrawer}
              aria-label="Open Partner & Scale Mode"
              title="Partner & Scale Mode"
              data-testid="open-partner-scale-drawer"
              className="min-h-[38px] min-w-[38px] px-2.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden xl:inline text-xs font-medium">Scale</span>
            </button>

            {userEmail ? (
              <button
                type="button"
                onClick={onSignOut}
                title={userEmail}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#F3EFE9] dark:hover:bg-[#23262B] transition-colors whitespace-nowrap shrink-0 max-w-[180px] truncate"
              >
                {userDisplayName || userEmail} · {t.signOut}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="min-h-[38px] px-3 sm:px-4 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">{t.signInGoogle}</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtle, non-intrusive Offline PWA Enabled Mode indicator (shown only when disconnected) */}
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            data-testid="offline-pwa-banner"
            className="border-t border-[#C4622D]/20 dark:border-[#E07B46]/25 bg-[#F9ECE5]/95 dark:bg-[#261B15]/95"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-[11px] sm:text-xs text-[#8D4119] dark:text-[#F0A47A]">
              <div className="flex items-center gap-2 min-w-0">
                <WifiOff className="w-3.5 h-3.5 shrink-0 text-[#C4622D] dark:text-[#E07B46]" />
                <p className="truncate sm:whitespace-normal">
                  <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    Offline PWA Enabled Mode
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>
                    Progress is saved locally and will sync automatically once back online.
                  </span>
                </p>
              </div>
              {queuedCount > 0 && (
                <span className="font-mono-tabular tabular-nums font-medium shrink-0 text-[#146C53] dark:text-[#2EB88B]">
                  {queuedCount} queued
                </span>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom thumb-zone tab bar (64px) */}
      <nav
        aria-label="Mobile workspace navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#FAF8F5]/95 dark:bg-[#121315]/95 backdrop-blur-md border-t border-[#E8E3DB] dark:border-[#2C3037] grid grid-cols-4 items-center px-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-[#146C53] dark:text-[#2EB88B] font-semibold'
                  : 'text-[#575B62] dark:text-[#A3A7AE]'
              }`}
            >
              {tab.icon}
              <span className="text-[11px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
