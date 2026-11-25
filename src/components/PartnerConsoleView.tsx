import React, { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck2,
  Globe,
  Layers,
  Lock,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Users,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import type {
  ActiveAuthSession,
  ConsentGrant,
  LocaleCode,
  PractitionerProfile,
  ProblemBrief,
  SprintPartnerType,
  StudioDomain,
  ThemeMode,
  WorkspaceReadinessTag,
} from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';
import {
  WORKSPACE_READINESS_OPTIONS,
  getWorkspaceReadinessLabel,
} from '../utils/talentEngine';
import { WovenBridgeArcsMotif } from './ResilienceMotifs';
import { useAutoSave } from '../hooks/useAutoSave';

interface PartnerConsoleViewProps {
  activeSession: ActiveAuthSession | null;
  sprints: ProblemBrief[];
  onPostSprint: (sprint: Omit<ProblemBrief, 'id'>) => void;
  consentedGrants: ConsentGrant[];
  onIssueContract: (grantId: string) => void;
  telemetry: {
    sdg4Count: number;
    sdg8Count: number;
    sdg10Count: number;
    sdg16Count: number;
    sdg17Count: number;
    totalStipendDisbursedUsd: number;
    activeSprintsCount: number;
    clearedTalentCount: number;
  };
  onSwitchToTalentDoor: () => void;
  onBackToHome?: () => void;
  onEndSession?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAccessComfort?: () => void;
  hasCustomAccessComfort?: boolean;
  activeTab?: PartnerTab;
  onSelectTab?: (tab: PartnerTab) => void;
  t: TranslationDictionary;
}

export type PartnerTab = 'sprints' | 'talent' | 'compliance' | 'impact';

export const PartnerConsoleView: React.FC<PartnerConsoleViewProps> = ({
  activeSession,
  sprints,
  onPostSprint,
  consentedGrants,
  onIssueContract,
  telemetry,
  onSwitchToTalentDoor,
  onBackToHome,
  onEndSession,
  theme = 'light',
  onToggleTheme,
  onOpenCommandPalette,
  onOpenAccessComfort,
  hasCustomAccessComfort = false,
  activeTab: controlledTab,
  onSelectTab,
  t,
}) => {
  const [internalTab, setInternalTab] = useState<PartnerTab>('sprints');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (next: PartnerTab) => {
    setInternalTab(next);
    onSelectTab?.(next);
  };
  const [newSprintTitle, setNewSprintTitle] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('vna_autosave_partner_console_draft') : null;
      if (saved) return (JSON.parse(saved) as { title?: string }).title || '';
    } catch {
      // ignore
    }
    return '';
  });
  const [newSprintDomain, setNewSprintDomain] = useState<StudioDomain>('Tech');
  const [newSprintPartnerOrg, setNewSprintPartnerOrg] = useState(
    activeSession?.realm === 'partner' ? activeSession.claims.orgName : 'SolarGrid Innovations'
  );
  const [newSprintDuration, setNewSprintDuration] = useState('7-Day Sprint');
  const [newSprintPayout, setNewSprintPayout] = useState(350);
  const [newSprintDescription, setNewSprintDescription] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('vna_autosave_partner_console_draft') : null;
      if (saved) return (JSON.parse(saved) as { description?: string }).description || '';
    } catch {
      // ignore
    }
    return '';
  });
  const [postSuccessBanner, setPostSuccessBanner] = useState<string | null>(null);
  const [newSprintReadiness, setNewSprintReadiness] = useState<WorkspaceReadinessTag[]>([
    'remote-flexible',
    'written-captioned',
  ]);
  const [inclusiveChecklistOpen, setInclusiveChecklistOpen] = useState(false);
  const [agreementStatusBanner, setAgreementStatusBanner] = useState<string | null>(null);

  const toggleSprintReadiness = (tag: WorkspaceReadinessTag) => {
    setNewSprintReadiness((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const orgName = activeSession?.realm === 'partner' ? activeSession.claims.orgName : 'Hiring Partner';
  const workEmail = activeSession?.realm === 'partner' ? activeSession.claims.workEmail : 'partner@org.org';

  useAutoSave({
    key: 'partner_console_draft',
    data: {
      title: newSprintTitle,
      domain: newSprintDomain,
      partnerOrg: newSprintPartnerOrg,
      duration: newSprintDuration,
      payout: newSprintPayout,
      description: newSprintDescription,
    },
    debounceMs: 5000,
    syncedEmail: workEmail,
  });

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintTitle.trim()) return;

    onPostSprint({
      title: newSprintTitle.trim(),
      domain: `${newSprintDomain} · ${newSprintDuration}`,
      studioDomain: newSprintDomain,
      complexity: 'Applied',
      organization: newSprintPartnerOrg || orgName,
      locationLabel: 'Global Remote / Host Region',
      summary: newSprintDescription.trim() || 'Scoped practical solution brief delivered via Vuka na Amana Cross-Age Pod.',
      deliverableChecklist: ['Diagnostic assessment', 'Remediation plan', 'Handover documentation'],
      estimatedHours: 40,
      payoutUsd: Number(newSprintPayout) || 350,
      recommendedStages: ['18-29', '30-45', '46+'],
      requiredKeywords: [newSprintDomain.toLowerCase(), 'problem-solving', 'verification'],
      workspaceReadiness: newSprintReadiness,
      inclusiveReady: newSprintReadiness.length > 0,
    });

    setPostSuccessBanner(`Successfully posted "${newSprintTitle.trim()}" live to Builder Studio Tab 3 [Solve].`);
    setNewSprintTitle('');
    setNewSprintDescription('');
    window.setTimeout(() => setPostSuccessBanner(null), 4000);
  };

  return (
    <div
      data-testid="partner-console-root"
      className="min-h-screen bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] transition-colors"
    >
      {/* Top Header Navigation Bar with bridge.jpeg motif */}
      <header className="sticky top-0 z-40 border-b border-[#E8E3DB] dark:border-[#2C3037] bg-white/90 dark:bg-[#1A1C20]/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="#landing"
              onClick={(e) => {
                e.preventDefault();
                onBackToHome?.();
              }}
              aria-label="Lock Session & Return to Landing Page"
              title="Lock Session & Return to Landing Page"
              data-testid="featured-logo-button"
              className="w-8 h-8 rounded-lg overflow-hidden border border-[#146C53]/40 dark:border-[#2EB88B]/45 shrink-0 shadow-xs bg-[#E7F3EE] dark:bg-[#142B24] flex items-center justify-center cursor-pointer hover:scale-105 hover:border-[#146C53] dark:hover:border-[#2EB88B] hover:shadow-md transition-all group"
            >
              <img
                src="/bridge.jpeg"
                alt="Vuka na Amana Bridge Logo"
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </a>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-medium text-base sm:text-lg tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
                  {orgName} · Hiring Partner Console
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Isolated Portal ({workEmail})</span>
                </span>
              </div>
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] truncate">
                Zero-Trust Consent Bridge &amp; Compliant Hiring Portal · SDGs 4, 8, 10, 16, 17
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                aria-label="Search console tabs, guides, glossary (press / or Cmd+K)"
                title="Search console tabs, guides, glossary (/ or ⌘K)"
                data-testid="partner-open-command-palette-btn"
                className="min-h-[40px] min-w-[40px] px-3 lg:min-w-[238px] rounded-full border border-[#D8D1C5] dark:border-[#343A44] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] focus-visible:outline-none focus-visible:border-[#146C53] dark:focus-visible:border-[#2EB88B] inline-flex items-center justify-center lg:justify-between gap-2 transition-colors shrink-0 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Search className="w-4 h-4 text-[#17191C] dark:text-[#F4F2EE] shrink-0" />
                  <span className="hidden md:inline text-xs font-normal text-[#525866] dark:text-[#A3A7AE] truncate">
                    Search tabs, guides, glossary…
                  </span>
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.5 rounded border border-[#E2DCD2] dark:border-[#2F343D] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                    /
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-[#E2DCD2] dark:border-[#2F343D] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
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
                data-testid="partner-open-access-comfort-btn"
                className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  hasCustomAccessComfort
                    ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                    : 'border-[#D8D1C5] dark:border-[#343A44] bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Access</span>
              </button>
            )}
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                data-testid="partner-lock-signout-btn"
                title="Lock Partner Console & Return to Landing Page"
                className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#D8D1C5] dark:border-[#343A44] bg-white dark:bg-[#1A1C20] hover:border-[#C4622D]/50 dark:hover:border-[#E07B46]/50 hover:text-[#C4622D] dark:hover:text-[#F59E6C] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">Lock &amp; Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onSwitchToTalentDoor}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-[#146C53]/40 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/80 dark:bg-[#142B24]/80 hover:bg-[#D5EBE2] dark:hover:bg-[#1C3B31] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Switch to Skilled Builder Door</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clean 4-Tab Partner Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] flex overflow-x-auto gap-1 sm:gap-2 no-scrollbar">
          {[
            { id: 'sprints', label: '1. Sprints & Roles', icon: Briefcase },
            { id: 'talent', label: `2. Consented Talent (${consentedGrants.length})`, icon: Users },
            { id: 'compliance', label: '3. Compliance & Contracting', icon: FileCheck2 },
            { id: 'impact', label: '4. Partner Impact', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`partner-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as PartnerTab)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315] shadow-xs'
                    : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Sub-Menu Utility Bar (matching Builder WorkspaceUtilities) */}
      <div
        data-testid="partner-submenu-bar"
        className="border-b border-[#E8E3DB] dark:border-[#2C3037] bg-[#F3EFE9]/65 dark:bg-[#1A1C20]/70"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            <Building2 className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46] shrink-0" />
            <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">{orgName}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#146C53] dark:text-[#2EB88B] font-medium">Verified Partner Session</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline font-mono-tabular text-[11px]">{workEmail}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
                data-testid="partner-theme-toggle-btn"
                className="min-h-[36px] px-3 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#F3EFE9] dark:hover:bg-[#23262B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{theme === 'dark' ? t.themeLight : t.themeDark}</span>
              </button>
            )}

            {(onEndSession || onBackToHome) && (
              <button
                type="button"
                onClick={onEndSession ?? onBackToHome}
                aria-label="End Session and lock Partner Console"
                title="End Session — lock Partner Console and return to landing page"
                data-testid="partner-end-session-btn"
                className="min-h-[36px] px-3 py-1 rounded-lg border border-[#C4622D]/35 dark:border-[#E07B46]/40 bg-[#FFF7F3] dark:bg-[#2A1B14] hover:bg-[#F9ECE5] dark:hover:bg-[#3A241B] text-xs font-semibold text-[#B44E1E] dark:text-[#F59E6C] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>End Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {postSuccessBanner && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-[#146C53]/35 bg-[#E7F3EE] dark:bg-[#142B24] p-4 text-xs font-medium text-[#146C53] dark:text-[#2EB88B] flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{postSuccessBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setPostSuccessBanner(null)}
              className="text-xs underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: Sprints & Roles */}
        {activeTab === 'sprints' && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
                    TAB 1 · POST SOLUTION SPRINTS &amp; ROLES
                  </span>
                  <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
                    Post Scoped 1-to-2-Week Solution Sprints
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
                    Sprints posted here instantly publish to the Skilled Builder Studio Tab 3 ([Solve]), pairing displaced talent in Cross-Age Delivery Pods.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSprint} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5">
                      Sprint Title / Challenge Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newSprintTitle}
                      onChange={(e) => setNewSprintTitle(e.target.value)}
                      placeholder="e.g. 48V Solar Inverter Microgrid Telemetry Diagnostics"
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5">
                      Studio Domain Track
                    </label>
                    <select
                      value={newSprintDomain}
                      onChange={(e) => setNewSprintDomain(e.target.value as StudioDomain)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                    >
                      <option value="Tech">Tech &amp; Systems</option>
                      <option value="Green Energy">Green Energy &amp; Solar</option>
                      <option value="Healthcare Ops">Healthcare Operations</option>
                      <option value="SME Finance">SME Finance &amp; Ledger</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5">
                      Organization / Partner Name
                    </label>
                    <input
                      type="text"
                      value={newSprintPartnerOrg}
                      onChange={(e) => setNewSprintPartnerOrg(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5">
                      Duration &amp; Scope
                    </label>
                    <select
                      value={newSprintDuration}
                      onChange={(e) => setNewSprintDuration(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                    >
                      <option value="3-Day Pilot Sprint">3-Day Pilot Sprint</option>
                      <option value="7-Day Sprint">7-Day Sprint</option>
                      <option value="14-Day Deep Sprint">14-Day Deep Sprint</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5">
                      Fair-Pay Stipend ($ USD)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={5000}
                      value={newSprintPayout}
                      onChange={(e) => setNewSprintPayout(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5">
                    Problem Summary &amp; Expected Deliverables
                  </label>
                  <textarea
                    rows={3}
                    value={newSprintDescription}
                    onChange={(e) => setNewSprintDescription(e.target.value)}
                    placeholder="Describe the exact technical problem, expected deliverables, and cross-age mentorship pairing..."
                    className="w-full p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                  />
                </div>

                {/* Built-In Workspace Readiness (ILO Reasonable Accommodation Readiness) */}
                <fieldset
                  data-testid="partner-workspace-readiness-fieldset"
                  className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3"
                >
                  <legend className="px-1 text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    Built-In Workspace Readiness (Optional · ILO Inclusive Employment)
                  </legend>
                  <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                    Flag zero-cost inclusive practices already supported by your team so skilled builders can match with clarity.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {WORKSPACE_READINESS_OPTIONS.map((opt) => {
                      const checked = newSprintReadiness.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          data-testid={`partner-readiness-option-${opt.id}`}
                          className={`min-h-[44px] rounded-xl border p-3 flex items-start gap-2.5 cursor-pointer transition-colors ${
                            checked
                              ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 border-[#146C53]/45 dark:border-[#2EB88B]/45'
                              : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSprintReadiness(opt.id)}
                            className="mt-0.5 rounded border-[#146C53] text-[#146C53] focus:ring-[#146C53] shrink-0 cursor-pointer"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                              {opt.label}
                            </span>
                            <span className="block text-[10px] text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                              {opt.helperText}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    data-testid="post-new-sprint-submit-btn"
                    className="min-h-[42px] px-6 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Solution Sprint Live</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Active Posted Sprints Ledger */}
            <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8">
              <h3 className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE] mb-4">
                Active Solution Sprints Published to Builder Studio ({sprints.length})
              </h3>
              <div className="space-y-3">
                {sprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
                          {sprint.studioDomain} · {sprint.organization}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                          ${sprint.payoutUsd} USD Stipend
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-[#17191C] dark:text-[#F4F2EE] truncate">
                        {sprint.title}
                      </h4>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] line-clamp-1">
                        {sprint.summary}
                      </p>
                      {sprint.workspaceReadiness && sprint.workspaceReadiness.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {sprint.workspaceReadiness.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[10px] font-medium text-[#146C53] dark:text-[#5EEAD4]"
                            >
                              {getWorkspaceReadinessLabel(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        Live in Tab 3 [Solve]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Consented Talent */}
        {activeTab === 'talent' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
                    TAB 2 · CONSENTED TALENT &amp; LIVING DOSSIERS
                  </span>
                  <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
                    Consented Candidate Dossiers (Zero Raw IDs)
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
                    Displaying only candidates who actively granted an agency-first Consent Grant (`VNA-GRANT-XXXX`). Private refugee serial numbers and un-consented records remain strictly locked.
                  </p>
                </div>
              </div>

              {consentedGrants.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-base font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    No Active Consent Grants Found Yet
                  </h3>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] max-w-md mx-auto">
                    When a skilled builder applies with Living Proof in Studio Tab 3 or shares their dossier, their secure consent-token will appear here with complete verification and compliance shields.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4">
                  {consentedGrants.map((grant) => (
                    <div
                      key={grant.consentId}
                      className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-6 space-y-4 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] flex items-center justify-center font-bold text-sm">
                            {grant.talentAlias.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm text-[#17191C] dark:text-[#F4F2EE]">
                                {grant.talentAlias}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{grant.consentId}</span>
                              </span>
                            </div>
                            <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                              Granted: {new Date(grant.grantedAtIso).toLocaleDateString()} · Status: <strong className="text-[#146C53] dark:text-[#2EB88B]">Active &amp; Revocable</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-xl bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pre-Cleared to Contract &amp; Pay</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2">
                          <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                            Living Competency Summary
                          </span>
                          <p className="text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                            {grant.verifiedPassportSummary}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2">
                          <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                            Uploaded Proof &amp; Craft Highlights
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-[#575B62] dark:text-[#A3A7AE]">
                            {grant.photoProofHighlights.map((highlight, idx) => (
                              <li key={idx}>{highlight}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Consented Practical Work Setup Chips — Strictly gated by Builder VNA-GRANT consent */}
                      {grant.sharedWorkSetupPreferences && grant.sharedWorkSetupPreferences.length > 0 ? (
                        <div
                          data-testid={`partner-consented-work-setup-${grant.consentId}`}
                          className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5">
                              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>How This Builder Works Best (Consented via {grant.consentId})</span>
                            </span>
                            <span className="text-[10px] text-[#575B62] dark:text-[#A3A7AE]">
                              Practical work conditions only · Zero personal or medical disclosures
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {grant.sharedWorkSetupPreferences.map((prefLabel, idx) => (
                              <span
                                key={`${grant.consentId}-pref-${idx}`}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#E7F3EE]/80 dark:bg-[#142B24]/80 border border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[11px] font-medium text-[#146C53] dark:text-[#5EEAD4]"
                              >
                                {prefLabel}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center gap-1.5">
                          <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>No optional work-setup preferences shared in this Consent Grant.</span>
                        </p>
                      )}

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => onIssueContract(grant.consentId)}
                          className="min-h-[38px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Generate Compliant Sprint Contract &amp; Escrow</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Compliance & Contracting */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6">
              <div className="pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
                  TAB 3 · ZERO-FRICTION ONBOARDING &amp; COMPLIANCE VAULT
                </span>
                <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
                  Zero-Friction Hiring Partner Compliance &amp; Contracting
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
                  Select your institutional contracting bridge and generate a 1-click compliant agreement removing all legal uncertainty.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#146C53]/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#17191C] dark:text-[#F4F2EE]">
                      Direct Local Hire
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#E7F3EE] dark:bg-[#142B24] text-[10px] font-semibold text-[#146C53]">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    Direct local employment contract under host-country regulatory frameworks with verified tax and FATF KYC clearance.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-3">
                  <span className="font-semibold text-sm text-[#17191C] dark:text-[#F4F2EE]">
                    Scoped Remote Contractor
                  </span>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    Cross-border digital contractor agreement for project-based deliverables with milestone-based escrow disbursement.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-3">
                  <span className="font-semibold text-sm text-[#17191C] dark:text-[#F4F2EE]">
                    EOR / Fiscal Host Bridge
                  </span>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    Partner Employer of Record / Humanitarian Fiscal Host manages local payroll, remittances, and compliance compliance.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#E7F3EE]/60 dark:bg-[#142B24]/60 border border-[#146C53]/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-[#146C53] dark:text-[#2EB88B]">
                    Instant 1-Click Compliant Agreement Generator
                  </span>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Generate a legally binding, 1-page PDF-ready agreement tailored to your organization and consented talent.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAgreementStatusBanner(
                      `Compliant Agreement Package prepared for ${orgName} and ready for secure digital signature.`
                    )
                  }
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Agreement Package</span>
                </button>
              </div>

              {agreementStatusBanner && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/35 px-4 py-3 text-xs font-medium text-[#146C53] dark:text-[#5EEAD4] flex items-center justify-between gap-3"
                >
                  <span>{agreementStatusBanner}</span>
                  <button
                    type="button"
                    onClick={() => setAgreementStatusBanner(null)}
                    className="underline font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* 1-Click Inclusive Onboarding Checklist (ILO Decent Work & Reasonable Accommodation) */}
              <div
                data-testid="partner-inclusive-onboarding-card"
                className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                      ILO DECENT WORK &amp; REASONABLE ACCOMMODATION GUIDE
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      Inclusive Onboarding Checklist ($0 High-Impact Practices)
                    </h3>
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      Most practical accommodations—written briefs, auto-captions, and flexible milestone hours—cost $0 and unlock exceptional displaced talent.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="partner-inclusive-onboarding-checklist-btn"
                    aria-expanded={inclusiveChecklistOpen}
                    onClick={() => setInclusiveChecklistOpen((prev) => !prev)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE]/60 dark:hover:bg-[#142B24]/60 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {inclusiveChecklistOpen
                        ? 'Hide Inclusive Onboarding Checklist'
                        : 'Open 1-Click Inclusive Onboarding Checklist'}
                    </span>
                  </button>
                </div>

                {inclusiveChecklistOpen && (
                  <div
                    data-testid="partner-inclusive-onboarding-panel"
                    className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"
                  >
                    {[
                      {
                        title: '1. Written & Captioned Sprint Briefs ($0)',
                        detail:
                          'Share clear written deliverables and enable live captions on kickoff calls so every builder can review instructions asynchronously.',
                      },
                      {
                        title: '2. Outcome-Based Flexible Milestone Hours ($0)',
                        detail:
                          'Measure 1–2 week sprint success on verified deliverables rather than rigid online-clock attendance.',
                      },
                      {
                        title: '3. Keyboard & Screen-Reader Friendly Tools ($0)',
                        detail:
                          'Use structured headings, plain-text specs, and accessible shared docs so assistive tech works seamlessly.',
                      },
                      {
                        title: '4. Co-Funded Assistive-Tech & Data Stipend Pool',
                        detail:
                          'When a builder needs a screen-reader license, ergonomic gear, or data bundle, route it through the Partner Enablement Pool—never ask for medical proof.',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-1"
                      >
                        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          {item.title}
                        </p>
                        <p className="text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Partner Impact */}
        {activeTab === 'impact' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6">
              <div className="pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
                  TAB 4 · EXECUTIVE UN 2030 SDG IMPACT LEDGER
                </span>
                <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
                  Organization Contribution to SDGs 4, 8, 10, 16 &amp; 17
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
                  Real-time impact metrics synchronized directly with the platform-wide SDG Impact Pulse.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#146C53] dark:text-[#2EB88B]">
                    SDG 8 · Decent Work
                  </div>
                  <div className="font-mono-tabular text-2xl font-bold text-[#17191C] dark:text-[#F4F2EE]">
                    {telemetry.activeSprintsCount} Sprints
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Active solution sprints and paid assignments funded.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#146C53] dark:text-[#2EB88B]">
                    SDG 10 · Reduced Inequalities
                  </div>
                  <div className="font-mono-tabular text-2xl font-bold text-[#17191C] dark:text-[#F4F2EE]">
                    ${telemetry.totalStipendDisbursedUsd.toLocaleString()} USD
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Fair-pay stipends &amp; escrow payouts disbursed.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#146C53] dark:text-[#2EB88B]">
                    SDG 4 · Quality Education
                  </div>
                  <div className="font-mono-tabular text-2xl font-bold text-[#17191C] dark:text-[#F4F2EE]">
                    {telemetry.sdg4Count} Bridges
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    UNESCO UQP &amp; ILO RPL micro-bridging credentials unlocked.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#146C53] dark:text-[#2EB88B]">
                    SDG 16 &amp; 17 · Partnerships
                  </div>
                  <div className="font-mono-tabular text-2xl font-bold text-[#17191C] dark:text-[#F4F2EE]">
                    {consentedGrants.length} Grants
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Zero-trust consent grants &amp; compliant institutional frameworks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
