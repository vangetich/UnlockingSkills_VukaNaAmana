import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Compass,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';
import type { ActiveAuthSession, PortalRealm, WorkspaceTab } from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';
import { PwaSyncStatusBar } from './PwaSyncStatusBar';

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
  syncProgress?: number;
  syncCompletedCount?: number;
  syncTotalCount?: number;
  lastSyncedIso?: string | null;
  onSyncNow?: () => Promise<void> | void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSwitchPortal: (targetRealm: PortalRealm) => void;
  onSignOutPortal: () => void;
  onBackToHome: () => void;
  onOpenScaleDrawer: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAccessComfort?: () => void;
  hasCustomAccessComfort?: boolean;
  t: TranslationDictionary;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  activePortal,
  activeSession,
  isOnline,
  isSyncing = false,
  queuedCount,
  syncProgress = 0,
  syncCompletedCount = 0,
  syncTotalCount = 0,
  onSyncNow,
  onSwitchPortal,
  onSignOutPortal,
  onBackToHome,
  onOpenScaleDrawer,
  onOpenCommandPalette,
  onOpenAccessComfort,
  hasCustomAccessComfort = false,
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

  const talentSessionClaims = activeSession?.realm === 'talent' ? activeSession.claims : null;
  const isPinSecured = talentSessionClaims?.authMethod === 'dedicated_pin';
  const builderHeaderIdentity = talentSessionClaims
    ? talentSessionClaims.builderId
      ? `${talentSessionClaims.displayName} · ${talentSessionClaims.builderId}`
      : talentSessionClaims.displayName
    : null;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#121315]/95 backdrop-blur-sm border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <PwaSyncStatusBar
          isOnline={isOnline}
          isSyncing={isSyncing}
          queuedCount={queuedCount}
          syncProgress={syncProgress}
          syncCompletedCount={syncCompletedCount}
          syncTotalCount={syncTotalCount}
          onSyncNow={onSyncNow}
        />
        <div className="max-w-6xl mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar touch-pan-x whitespace-nowrap">
          {/* Zone 1: Clickable Official Bridge Logo + Vuka na Amana lockup + Active Portal Pill */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <a
              href="#landing"
              onClick={(e) => {
                e.preventDefault();
                onBackToHome();
              }}
              aria-label={`${t.brandName} — Lock Session & Return to Landing Page`}
              title="Lock Session & Return to Landing Page"
              data-testid="topnav-brand-home-btn"
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0 text-start group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded-md py-1 cursor-pointer"
            >
              <div
                data-testid="featured-logo-button"
                className="p-0.5 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#146C53]/35 dark:border-[#2EB88B]/40 shadow-xs group-hover:border-[#146C53] dark:group-hover:border-[#2EB88B] group-hover:shadow-sm group-hover:scale-105 transition-all shrink-0 flex items-center justify-center cursor-pointer"
                title="Lock Session & Return to Landing Page"
              >
                <img
                  src="/bridge.jpeg"
                  alt="Vuka na Amana Bridge Logo"
                  className="h-5 sm:h-6 max-w-[64px] sm:max-w-[82px] w-auto object-contain rounded-md shrink-0"
                />
              </div>
              <div className="leading-tight min-w-0">
                <span className="block font-display text-[17px] sm:text-[19px] font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE] group-hover:text-[#146C53] dark:group-hover:text-[#2EB88B] transition-colors whitespace-nowrap">
                  {t.brandName}
                </span>
                <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                  Crossing Over
                </span>
              </div>
            </a>

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

          {/* Zone 2: Clean role-scoped tab navigation with smooth horizontal slide and zero scrollbars */}
          <nav
            aria-label="Primary workspace navigation"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 touch-pan-x max-w-[38vw] sm:max-w-md lg:max-w-xl"
          >
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  data-testid={`topnav-tab-${tab.id}`}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315] shadow-xs'
                      : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
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
                aria-label="Search stages, guides, glossary (press / or Cmd+K)"
                title="Search stages, guides, glossary (/ or ⌘K)"
                data-testid="open-command-palette-btn"
                className="min-h-[40px] min-w-[40px] px-2.5 lg:px-3 rounded-full border border-[#D8D1C5] dark:border-[#343A44] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] focus-visible:outline-none focus-visible:border-[#146C53] dark:focus-visible:border-[#2EB88B] inline-flex items-center justify-center lg:justify-between gap-2 transition-colors shrink-0 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Search className="w-4 h-4 text-[#17191C] dark:text-[#F4F2EE] shrink-0" />
                  <span className="hidden xl:inline text-xs font-normal text-[#525866] dark:text-[#A3A7AE] truncate">
                    Search stages, guides, glossary…
                  </span>
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.5 rounded border border-[#E2DCD2] dark:border-[#2F343D] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                    /
                  </kbd>
                  <kbd className="hidden xl:inline px-1.5 py-0.5 rounded border border-[#E2DCD2] dark:border-[#2F343D] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                    ⌘K
                  </kbd>
                </span>
              </button>
            )}

            {onOpenAccessComfort && (
              <button
                type="button"
                onClick={onOpenAccessComfort}
                aria-label="Access & Comfort Settings"
                title="Access & Comfort Settings (WCAG 2.2)"
                data-testid="topnav-open-access-comfort-btn"
                className={`min-h-[44px] min-w-[44px] px-2.5 rounded-lg border inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                  hasCustomAccessComfort
                    ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                    : 'border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span className="hidden xl:inline text-xs font-medium">Access</span>
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
              <div className="flex items-center gap-1.5 shrink-0">
                {talentSessionClaims && (
                  <div
                    data-testid="builder-security-status-pill"
                    data-auth-method={talentSessionClaims.authMethod}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap shrink-0"
                    title={
                      builderHeaderIdentity
                        ? `${builderHeaderIdentity} — ${isPinSecured ? 'PIN Secured' : '2FA Verified'}`
                        : isPinSecured
                          ? 'PIN Secured'
                          : '2FA Verified'
                    }
                  >
                    {isPinSecured ? (
                      <KeyRound className="w-3 h-3 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                    )}
                    <span>{isPinSecured ? 'PIN Secured' : '2FA Verified'}</span>
                    {builderHeaderIdentity && (
                      <span
                        data-testid="builder-header-identity"
                        className="hidden xl:inline text-[#17191C] dark:text-[#F4F2EE] font-medium border-l border-[#146C53]/25 dark:border-[#2EB88B]/30 pl-1.5 max-w-[170px] truncate"
                      >
                        {builderHeaderIdentity}
                      </span>
                    )}
                  </div>
                )}

                {talentSessionClaims && (
                  <button
                    type="button"
                    onClick={onSignOutPortal}
                    data-testid="builder-lock-signout-btn"
                    title="Lock Builder Studio & Sign Out"
                    className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#C4622D]/50 dark:hover:border-[#E07B46]/50 hover:text-[#C4622D] dark:hover:text-[#F59E6C] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden lg:inline">Lock / Sign Out</span>
                  </button>
                )}

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
              </div>
            )}
          </div>
        </div>
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
