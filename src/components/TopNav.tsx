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

  const talentTabs: Array<{ id: WorkspaceTab; label: string; shortLabel: string; icon: React.ReactNode }> = [
    { id: 'verify', label: t.navVerify, shortLabel: 'Verify', icon: <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> },
    { id: 'unlock', label: t.navUnlock, shortLabel: 'Unlock', icon: <Compass className="w-4 h-4 shrink-0" aria-hidden="true" /> },
    { id: 'solve', label: t.navSolve, shortLabel: 'Solve', icon: <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" /> },
    { id: 'pulse', label: t.navPulse, shortLabel: 'Pulse', icon: <BarChart3 className="w-4 h-4 shrink-0" aria-hidden="true" /> },
    { id: 'cleared', label: '5. Cleared', shortLabel: 'Cleared', icon: <Globe className="w-4 h-4 shrink-0" aria-hidden="true" /> },
  ];

  const partnerTabs: Array<{ id: WorkspaceTab; label: string; shortLabel: string; icon: React.ReactNode }> = [
    { id: 'unlock', label: 'Hiring & Compliance', shortLabel: 'Compliance', icon: <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" /> },
    { id: 'pulse', label: 'Impact & Reviews', shortLabel: 'Impact', icon: <BarChart3 className="w-4 h-4 shrink-0" aria-hidden="true" /> },
    { id: 'cleared', label: 'Durable Pathways', shortLabel: 'Pathways', icon: <Globe className="w-4 h-4 shrink-0" aria-hidden="true" /> },
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

        {/* Responsive Flexbox Top Bar:
            - Mobile (<md): Row 1 = Brand (left) + Accessible Action Controls (right); tabs live in bottom thumb-zone flex bar.
            - Tablet (md..lg): Row 1 = Brand + Actions; Row 2 (order-3 w-full) = Full-width flex tab rail.
            - Desktop (lg+): Single-row 3-zone flex layout (Brand | Centered Tabs | Actions). */}
        <div
          data-testid="topnav-flex-container"
          className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-x-3 gap-y-2"
        >
          {/* Zone 1: Official Bridge Logo + Vuka na Amana lockup (always visible & unclipped) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 order-1">
            <a
              href="#landing"
              onClick={(e) => {
                e.preventDefault();
                onBackToHome();
              }}
              aria-label={`${t.brandName} — Lock Session & Return to Landing Page`}
              title="Lock Session & Return to Landing Page"
              data-testid="topnav-brand-home-btn"
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0 text-start group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded-lg py-1 cursor-pointer"
            >
              <div
                data-testid="featured-logo-button"
                className="p-0.5 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#146C53]/35 dark:border-[#2EB88B]/40 shadow-xs group-hover:border-[#146C53] dark:group-hover:border-[#2EB88B] group-hover:shadow-sm transition-all shrink-0 flex items-center justify-center"
                title="Lock Session & Return to Landing Page"
              >
                <img
                  src="/bridge.jpeg"
                  alt="Vuka na Amana Bridge Logo"
                  className="h-5 sm:h-6 max-w-[60px] sm:max-w-[78px] w-auto object-contain rounded-md shrink-0"
                />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-display text-[17px] sm:text-[19px] font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE] group-hover:text-[#146C53] dark:group-hover:text-[#2EB88B] transition-colors whitespace-nowrap">
                  {t.brandName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                  <span>Crossing Over</span>
                  <span aria-hidden="true">·</span>
                  <span
                    data-testid="active-portal-pill"
                    data-portal-realm={activePortal}
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isPartnerPortal
                        ? 'text-[#C4622D] dark:text-[#F59E6C]'
                        : 'text-[#146C53] dark:text-[#2EB88B]'
                    }`}
                  >
                    {isPartnerPortal ? (
                      <Building2 className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>{isPartnerPortal ? 'Partner Console' : 'Talent Studio'}</span>
                  </span>
                </span>
              </div>
            </a>
          </div>

          {/* Zone 2: Responsive Flexbox Stage Tabs (wraps gracefully to Row 2 on md tablets, inline center on lg+ desktop) */}
          <nav
            aria-label="Primary workspace navigation"
            className="hidden md:flex flex-1 items-center justify-start lg:justify-center gap-1.5 min-w-0 order-3 lg:order-2 basis-full lg:basis-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E8E3DB] dark:border-[#2C3037] overflow-x-auto no-scrollbar touch-pan-x"
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
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
                    isActive
                      ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315] shadow-xs'
                      : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] hover:border-[#146C53]/40 dark:hover:border-[#2EB88B]/40'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Accessible Flex Utility Controls (always visible, 44px mobile touch targets) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 order-2 lg:order-3">
            {onOpenCommandPalette && !isPartnerPortal && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                aria-label="Search stages, guides, glossary (press / or Cmd+K)"
                title="Search stages, guides, glossary (/ or ⌘K)"
                data-testid="open-command-palette-btn"
                className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] px-2.5 xl:px-3 rounded-full border border-[#D8D1C5] dark:border-[#343A44] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] inline-flex items-center justify-center xl:justify-between gap-2 transition-colors shrink-0 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Search className="w-4 h-4 text-[#17191C] dark:text-[#F4F2EE] shrink-0" aria-hidden="true" />
                  <span className="hidden 2xl:inline text-xs font-normal text-[#525866] dark:text-[#A3A7AE] truncate">
                    Search stages, guides, glossary…
                  </span>
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.5 rounded border border-[#E2DCD2] dark:border-[#2F343D] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                    /
                  </kbd>
                  <kbd className="hidden 2xl:inline px-1.5 py-0.5 rounded border border-[#E2DCD2] dark:border-[#2F343D] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
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
                className={`min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] px-2.5 rounded-lg border inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
                  hasCustomAccessComfort
                    ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                    : 'border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden 2xl:inline text-xs font-medium whitespace-nowrap">Access</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenScaleDrawer}
              aria-label="Open Partner & Scale Mode"
              title="Partner & Scale Mode"
              data-testid="open-partner-scale-drawer"
              className="hidden sm:inline-flex min-h-[40px] min-w-[40px] px-2.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            >
              <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden 2xl:inline text-xs font-medium whitespace-nowrap">Scale</span>
            </button>

            {isPartnerPortal ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  data-testid="partner-org-header-label"
                  className="hidden xl:inline-block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] max-w-[150px] truncate"
                >
                  {partnerOrgLabel}
                </span>
                <button
                  type="button"
                  onClick={onSignOutPortal}
                  data-testid="portal-signout-switch-btn"
                  aria-label="Sign Out or Switch Portal"
                  title="Wipes active partner session before switching portals"
                  className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-lg border border-[#C4622D]/35 dark:border-[#E07B46]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#F9ECE5] dark:hover:bg-[#2D1E17] text-xs font-semibold text-[#C4622D] dark:text-[#F59E6C] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out / Switch</span>
                  <span className="sm:hidden">Switch</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                {talentSessionClaims && (
                  <div
                    data-testid="builder-security-status-pill"
                    data-auth-method={talentSessionClaims.authMethod}
                    className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E7F3EE]/80 dark:bg-[#142B24]/80 border border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap shrink-0"
                    title={
                      builderHeaderIdentity
                        ? `${builderHeaderIdentity} — ${isPinSecured ? 'PIN Secured' : '2FA Verified'}`
                        : isPinSecured
                          ? 'PIN Secured'
                          : '2FA Verified'
                    }
                  >
                    {isPinSecured ? (
                      <KeyRound className="w-3 h-3 shrink-0" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
                    )}
                    <span>{isPinSecured ? 'PIN Secured' : '2FA Verified'}</span>
                    {builderHeaderIdentity && (
                      <span
                        data-testid="builder-header-identity"
                        className="hidden 2xl:inline text-[#17191C] dark:text-[#F4F2EE] font-medium border-l border-[#146C53]/25 dark:border-[#2EB88B]/30 pl-1.5 max-w-[160px] truncate"
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
                    aria-label="Lock Builder Studio & Sign Out"
                    title="Lock Builder Studio & Sign Out"
                    className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] px-2.5 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#C4622D]/50 dark:hover:border-[#E07B46]/50 hover:text-[#C4622D] dark:hover:text-[#F59E6C] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="hidden xl:inline">Lock</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSwitchPortal('partner')}
                  data-testid="switch-to-partner-portal-btn"
                  aria-label="Switch to Hiring Partner Portal"
                  title="Wipes builder session and opens Hiring Partner Console"
                  className="min-h-[44px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Partner Portal</span>
                  <span className="sm:hidden">Partner</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom thumb-zone Flexbox tab bar (64px, accessible 48px touch targets) */}
      <nav
        aria-label="Mobile workspace navigation"
        data-testid="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#FAF8F5]/95 dark:bg-[#121315]/95 backdrop-blur-md border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-around gap-0.5 px-1.5"
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              className={`flex-1 min-w-0 min-h-[48px] px-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
                isActive
                  ? 'bg-[#E7F3EE]/80 dark:bg-[#142B24]/80 text-[#146C53] dark:text-[#2EB88B] font-semibold'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              {tab.icon}
              <span className="text-[11px] leading-none truncate max-w-full">
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
