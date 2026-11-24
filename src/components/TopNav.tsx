import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Compass,
  Globe,
  LogOut,
  Search,
  ShieldCheck,
  WifiOff,
  Wrench,
} from 'lucide-react';
import type { ActiveAuthSession, PortalRealm, WorkspaceTab } from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';

interface TopNavProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  activePortal: PortalRealm;
  activeSession: ActiveAuthSession | null;
  userEmail: string | null;
  userDisplayName: string | null;
  isOnline: boolean;
  isSyncing?: boolean;
  queuedCount: number;
  lastSyncedIso?: string | null;
  onSyncNow?: () => Promise<void> | void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSwitchPortal: (targetRealm: PortalRealm) => void;
  onSignOutPortal: () => void;
  onBackToHome: () => void;
  onOpenScaleDrawer: () => void;
  onOpenCommandPalette?: () => void;
  t: TranslationDictionary;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  activePortal,
  activeSession,
  isOnline,
  queuedCount,
  onSwitchPortal,
  onSignOutPortal,
  onBackToHome,
  onOpenScaleDrawer,
  onOpenCommandPalette,
  t,
}) => {
  const isPartnerPortal = activePortal === 'partner';

  const talentTabs: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
    { id: 'verify', label: t.navVerify, icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'unlock', label: t.navUnlock, icon: <Compass className="w-4 h-4" /> },
    { id: 'solve', label: t.navSolve, icon: <Wrench className="w-4 h-4" /> },
    { id: 'pulse', label: t.navPulse, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'cleared', label: '5. Cleared', icon: <Globe className="w-4 h-4" /> },
  ];

  const partnerTabs: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
    { id: 'unlock', label: 'Hiring & Compliance', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'pulse', label: 'Impact & Reviews', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'cleared', label: 'Durable Pathways', icon: <Globe className="w-4 h-4" /> },
  ];

  const visibleTabs = isPartnerPortal ? partnerTabs : talentTabs;

  const partnerOrgLabel =
    activeSession?.realm === 'partner' ? activeSession.claims.orgName : 'Verified Partner';

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#121315]/95 backdrop-blur-sm border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="max-w-6xl mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-5">
          {/* Zone 1: Clickable Official Bridge Logo + Vuka na Amana lockup + Active Portal Pill */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={onBackToHome}
              aria-label={`${t.brandName} — ${t.backToHome}`}
              title={t.backToHome}
              data-testid="topnav-brand-home-btn"
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0 text-start group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded-md py-1"
            >
              <img
                src="/bridge.jpeg"
                alt="Vuka na Amana Bridge Logo"
                className="h-8 max-w-[96px] sm:h-9 sm:max-w-[128px] w-auto object-contain rounded-md shrink-0"
              />
              <div className="leading-tight min-w-0">
                <span className="block font-display text-sm sm:text-base font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE] group-hover:text-[#146C53] dark:group-hover:text-[#2EB88B] transition-colors whitespace-nowrap">
                  {t.brandName}
                </span>
                <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                  Crossing Over
                </span>
              </div>
            </button>

            {/* Refined Active Portal Pill */}
            <span
              data-testid="active-portal-pill"
              data-portal-realm={activePortal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap shrink-0 ${
                isPartnerPortal
                  ? 'bg-[#F9ECE5] dark:bg-[#2D1E17] border-[#C4622D]/35 dark:border-[#E07B46]/40 text-[#C4622D] dark:text-[#F59E6C]'
                  : 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
              }`}
            >
              {isPartnerPortal ? (
                <Building2 className="w-3 h-3 shrink-0" />
              ) : (
                <ShieldCheck className="w-3 h-3 shrink-0" />
              )}
              <span>{isPartnerPortal ? 'Partner Console' : 'Talent Studio'}</span>
            </span>
          </div>

          {/* Zone 2: Clean role-scoped tab navigation */}
          <nav
            aria-label="Primary workspace navigation"
            className="hidden md:flex items-center gap-5 lg:gap-6"
          >
            {visibleTabs.map((tab) => {
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

          {/* Zone 3: Quick Search (Cmd+K), Scale Drawer & Clean Portal Switch / Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenCommandPalette && !isPartnerPortal && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                aria-label="Open quick search command palette (Cmd+K or Ctrl+K)"
                title="Quick Search (Cmd+K / Ctrl+K)"
                data-testid="open-command-palette-btn"
                className="min-h-[36px] min-w-[36px] px-2 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              >
                <Search className="w-3.5 h-3.5" />
                <kbd className="hidden xl:inline text-[10px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
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
              className="min-h-[36px] min-w-[36px] px-2.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden xl:inline text-xs font-medium">Scale</span>
            </button>

            {isPartnerPortal ? (
              <div className="flex items-center gap-1.5">
                <span
                  data-testid="partner-org-header-label"
                  className="hidden lg:inline-block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] max-w-[160px] truncate"
                >
                  {partnerOrgLabel}
                </span>
                <button
                  type="button"
                  onClick={onSignOutPortal}
                  data-testid="portal-signout-switch-btn"
                  title="Wipes active partner session before switching portals"
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#C4622D]/35 dark:border-[#E07B46]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#F9ECE5] dark:hover:bg-[#2D1E17] text-xs font-semibold text-[#C4622D] dark:text-[#F59E6C] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out / Switch Portal</span>
                  <span className="sm:hidden">Switch</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSwitchPortal('partner')}
                data-testid="switch-to-partner-portal-btn"
                title="Wipes builder session and opens Hiring Partner Console"
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                <span className="hidden sm:inline">Partner Portal</span>
                <span className="sm:hidden">Partner</span>
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
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#FAF8F5]/95 dark:bg-[#121315]/95 backdrop-blur-md border-t border-[#E8E3DB] dark:border-[#2C3037] grid ${
          isPartnerPortal ? 'grid-cols-3' : 'grid-cols-5'
        } items-center px-1`}
      >
        {visibleTabs.map((tab) => {
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
