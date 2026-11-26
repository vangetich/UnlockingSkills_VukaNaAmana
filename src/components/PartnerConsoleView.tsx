import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  FileCheck2,
  Globe,
  HelpCircle,
  Layers,
  Lock,
  MessageSquare,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Send,
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
import {
  DOCUMENT_FEEDBACK_STAGE_OPTIONS,
  PARTNER_FEEDBACK_TEMPLATES,
  PARTNER_PRE_CONTRACTING_STEPS,
  PRE_CONTRACTING_STAGE3_REVIEW_ITEMS,
  computePartnerPreContractingProgress,
  getFeedbackStageMeta,
  type DocumentFeedbackStage,
  type PartnerApplicantFeedbackItem,
  type PartnerFeedbackTone,
  type PartnerPreContractingRecord,
  type PartnerStepReviewStatus,
  type PartnerVerificationStepId,
} from '../utils/partnerVerification';
import { WovenBridgeArcsMotif } from './ResilienceMotifs';
import { useAutoSave } from '../hooks/useAutoSave';
import { EndSessionPopover, type EndSessionDetails } from './EndSessionPopover';
import { UnderstandingVerificationModal } from './UnderstandingVerificationModal';

interface PartnerConsoleViewProps {
  activeSession: ActiveAuthSession | null;
  sprints: ProblemBrief[];
  onPostSprint: (sprint: Omit<ProblemBrief, 'id'>) => void;
  consentedGrants: ConsentGrant[];
  issuedContractsByGrantId?: Record<string, { contractRef: string; bridgeType: string; issuedAtIso: string }>;
  onIssueContract: (grantId: string, bridgeType?: string) => void;
  verificationsByGrantId?: Record<string, PartnerPreContractingRecord>;
  applicantFeedback?: PartnerApplicantFeedbackItem[];
  onUpdateVerificationStep?: (
    consentId: string,
    stepId: PartnerVerificationStepId,
    status: PartnerStepReviewStatus,
    reviewerNote?: string
  ) => void;
  onSendApplicantFeedback?: (input: {
    consentId: string;
    stage: DocumentFeedbackStage;
    tone: PartnerFeedbackTone;
    message: string;
  }) => void;
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
  onEndSession?: (details?: EndSessionDetails) => void;
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
  issuedContractsByGrantId = {},
  onIssueContract,
  verificationsByGrantId = {},
  applicantFeedback = [],
  onUpdateVerificationStep,
  onSendApplicantFeedback,
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
  const [stage3ReviewGuideOpen, setStage3ReviewGuideOpen] = useState(true);
  const [understandingModalOpen, setUnderstandingModalOpen] = useState(false);
  const [selectedReviewGrantId, setSelectedReviewGrantId] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'needs_action' | 'ready'>('all');
  const [milestoneNoteDrafts, setMilestoneNoteDrafts] = useState<Record<string, string>>({});
  const [expandedStepExplainers, setExpandedStepExplainers] = useState<Record<string, boolean>>({});
  const [feedbackDraftByGrant, setFeedbackDraftByGrant] = useState<
    Record<
      string,
      {
        stage: DocumentFeedbackStage;
        tone: PartnerFeedbackTone;
        message: string;
      }
    >
  >({});
  const [selectedBridge, setSelectedBridge] = useState<'direct-local' | 'scoped-remote' | 'eor-fiscal-host'>('direct-local');
  const [agreementStatusBanner, setAgreementStatusBanner] = useState<string | null>(null);
  const activeConsentedGrants = consentedGrants.filter((g) => g.status === 'active');

  const filteredReviewGrants = activeConsentedGrants.filter((grant) => {
    const prog = computePartnerPreContractingProgress(verificationsByGrantId[grant.consentId]);
    if (reviewFilter === 'ready') return prog.isReadyForStage3;
    if (reviewFilter === 'needs_action') return !prog.isReadyForStage3;
    return true;
  });

  const selectedReviewGrant =
    filteredReviewGrants.find((g) => g.consentId === selectedReviewGrantId) ??
    filteredReviewGrants[0] ??
    activeConsentedGrants[0] ??
    null;

  const getFeedbackDraft = (consentId: string) =>
    feedbackDraftByGrant[consentId] ?? {
      stage: 'step_1_identity' as DocumentFeedbackStage,
      tone: 'approved' as PartnerFeedbackTone,
      message: '',
    };

  const updateFeedbackDraft = (
    consentId: string,
    patch: Partial<{
      stage: DocumentFeedbackStage;
      tone: PartnerFeedbackTone;
      message: string;
    }>
  ) => {
    setFeedbackDraftByGrant((prev) => ({
      ...prev,
      [consentId]: {
        ...(prev[consentId] ?? {
          stage: 'step_1_identity' as DocumentFeedbackStage,
          tone: 'approved' as PartnerFeedbackTone,
          message: '',
        }),
        ...patch,
      },
    }));
  };

  const toggleStepExplainer = (consentId: string, stepId: PartnerVerificationStepId) => {
    const key = `${consentId}:${stepId}`;
    setExpandedStepExplainers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    // Keep partner draft autosave strictly local so partner sessions never touch the Talent email-vault endpoint
    syncedEmail: null,
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
            { id: 'talent', label: `2. Consented Talent (${activeConsentedGrants.length})`, icon: Users },
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
            <button
              type="button"
              onClick={() => setUnderstandingModalOpen(true)}
              data-testid="partner-open-understanding-verification-btn"
              className="min-h-[36px] px-3 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#146C53]/35 dark:border-[#2EB88B]/40 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Understanding Verification</span>
            </button>

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
              <EndSessionPopover
                portal="partner"
                buttonTestId="partner-end-session-btn"
                ariaLabel="End Session and lock Partner Console"
                titleAttr="End Session — lock Partner Console and return to landing page"
                onConfirmEndSession={(details) => (onEndSession ?? onBackToHome)?.(details)}
              />
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
            {/* Compliance & Verification Review Dashboard Section */}
            <section
              aria-labelledby="compliance-verification-review-heading"
              data-testid="partner-compliance-verification-review"
              className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                <div className="space-y-1 max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
                    PRE-STAGE 3 MILESTONE WORKSPACE
                  </p>
                  <h2
                    id="compliance-verification-review-heading"
                    className="font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Compliance &amp; Verification Review
                  </h2>
                  <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    Verify each applicant’s <strong className="text-[#17191C] dark:text-[#F4F2EE]">Identity</strong>,{' '}
                    <strong className="text-[#17191C] dark:text-[#F4F2EE]">Financial</strong>, and{' '}
                    <strong className="text-[#17191C] dark:text-[#F4F2EE]">Contracting</strong> milestones individually before reaching Stage 3, and send live milestone feedback to the applicant at each step.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setUnderstandingModalOpen(true)}
                    data-testid="review-understanding-verification-btn"
                    className="min-h-[40px] px-4 py-2 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/60 dark:bg-[#142B24]/70 hover:bg-[#D5EBE2] dark:hover:bg-[#1C3B31] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Understanding Verification</span>
                  </button>
                </div>
              </div>

              {activeConsentedGrants.length === 0 ? (
                <div
                  data-testid="review-empty-state"
                  className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-xl">
                    <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      No applicants in milestone review yet
                    </p>
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      Once a skilled practitioner grants an active Consent Grant (VNA-GRANT), their Identity, Financial, and Contracting milestones appear here for individual pre-Stage 3 verification and applicant feedback.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('sprints')}
                      className="min-h-[38px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] cursor-pointer transition-colors"
                    >
                      Review Sprints (Tab 1)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Filter & Applicant Switcher Strip */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div
                      role="group"
                      aria-label="Filter applicants by verification readiness"
                      className="inline-flex flex-wrap items-center gap-1.5"
                    >
                      {(
                        [
                          { id: 'all', label: `All Applicants (${activeConsentedGrants.length})` },
                          {
                            id: 'needs_action',
                            label: 'Needs Action',
                          },
                          {
                            id: 'ready',
                            label: 'Ready for Stage 3',
                          },
                        ] as const
                      ).map((flt) => {
                        const active = reviewFilter === flt.id;
                        return (
                          <button
                            key={flt.id}
                            type="button"
                            aria-pressed={active}
                            data-testid={`review-filter-${flt.id}`}
                            onClick={() => setReviewFilter(flt.id)}
                            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
                                : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                            }`}
                          >
                            {flt.label}
                          </button>
                        );
                      })}
                    </div>

                    {filteredReviewGrants.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {filteredReviewGrants.map((grant) => {
                          const prog = computePartnerPreContractingProgress(
                            verificationsByGrantId[grant.consentId]
                          );
                          const isSelected = selectedReviewGrant?.consentId === grant.consentId;
                          return (
                            <button
                              key={grant.consentId}
                              type="button"
                              aria-pressed={isSelected}
                              data-testid={`review-select-applicant-${grant.consentId}`}
                              onClick={() => setSelectedReviewGrantId(grant.consentId)}
                              className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B]'
                                  : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53]/50'
                              }`}
                            >
                              <span>{grant.talentAlias}</span>
                              <span className="font-mono-tabular text-[11px] opacity-85">
                                {prog.verifiedCount}/3
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {filteredReviewGrants.length === 0 ? (
                    <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-[#575B62] dark:text-[#A3A7AE]">
                        No applicants match the selected filter.
                      </span>
                      <button
                        type="button"
                        onClick={() => setReviewFilter('all')}
                        className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] font-semibold text-[#146C53] dark:text-[#2EB88B] cursor-pointer"
                      >
                        Show All Applicants
                      </button>
                    </div>
                  ) : (
                    selectedReviewGrant && (() => {
                      const activeVerification = verificationsByGrantId[selectedReviewGrant.consentId];
                      const activeProgress = computePartnerPreContractingProgress(activeVerification);
                      const sentMilestonesCount = PARTNER_PRE_CONTRACTING_STEPS.filter((step) =>
                        applicantFeedback.some(
                          (fb) =>
                            fb.consentId === selectedReviewGrant.consentId &&
                            fb.stage === step.feedbackStage
                        )
                      ).length;

                      return (
                        <div className="space-y-4">
                          {/* Selected Applicant Readiness Strip */}
                          <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5 text-xs">
                              <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                Reviewing: {selectedReviewGrant.talentAlias}
                              </span>
                              <span className="font-mono-tabular text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                                {selectedReviewGrant.consentId}
                              </span>
                              <span className="text-[#575B62] dark:text-[#A3A7AE]">·</span>
                              <span className="font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]">
                                {activeProgress.verifiedCount}/3 Milestones Verified
                              </span>
                              <span className="text-[#575B62] dark:text-[#A3A7AE]">·</span>
                              <span className="font-mono-tabular text-[#43484E] dark:text-[#C8CDD4]">
                                {sentMilestonesCount}/3 Milestone Updates Sent
                              </span>
                            </div>

                            <button
                              type="button"
                              data-testid="review-proceed-stage3-btn"
                              onClick={() => setActiveTab('compliance')}
                              className="min-h-[36px] px-3.5 py-1.5 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                            >
                              <span>
                                {activeProgress.isReadyForStage3
                                  ? 'Proceed to 3. Compliance & Contracting'
                                  : 'Open Stage 3 Overview'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>

                          {/* 3-Row Milestone Table: Identity, Financial, Contracting */}
                          <div className="overflow-hidden rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] divide-y divide-[#E8E3DB] dark:divide-[#2C3037]">
                            {PARTNER_PRE_CONTRACTING_STEPS.map((step) => {
                              const stepStatus =
                                activeVerification?.steps?.[step.id]?.status ?? 'pending';
                              const draftKey = `${selectedReviewGrant.consentId}:${step.id}`;
                              const draftValue = milestoneNoteDrafts[draftKey] ?? '';
                              const sentNotesForMilestone = applicantFeedback.filter(
                                (fb) =>
                                  fb.consentId === selectedReviewGrant.consentId &&
                                  fb.stage === step.feedbackStage
                              );
                              const latestSentNote = sentNotesForMilestone[0];

                              return (
                                <div
                                  key={step.id}
                                  data-testid={`review-milestone-row-${step.milestoneKey}-${selectedReviewGrant.consentId}`}
                                  data-milestone-status={stepStatus}
                                  className="p-4 sm:p-5 bg-white dark:bg-[#1A1C20] space-y-3"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <span
                                        className={`w-7 h-7 rounded-lg font-mono-tabular text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                                          stepStatus === 'verified'
                                            ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
                                            : stepStatus === 'needs_clarification'
                                              ? 'bg-[#C4622D] text-white dark:bg-[#E07B46] dark:text-[#121315]'
                                              : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]'
                                        }`}
                                      >
                                        {step.stepNumber}
                                      </span>
                                      <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                            {step.milestoneLabel} · {step.title}
                                          </h3>
                                          <span
                                            data-testid={`review-milestone-status-${step.milestoneKey}-${selectedReviewGrant.consentId}`}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                              stepStatus === 'verified'
                                                ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]'
                                                : stepStatus === 'needs_clarification'
                                                  ? 'bg-[#F9ECE5] dark:bg-[#231914] text-[#A95021] dark:text-[#F59E6C]'
                                                  : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                                            }`}
                                          >
                                            {stepStatus === 'verified' ? (
                                              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                            ) : stepStatus === 'needs_clarification' ? (
                                              <AlertCircle className="w-3 h-3" aria-hidden="true" />
                                            ) : (
                                              <Clock className="w-3 h-3" aria-hidden="true" />
                                            )}
                                            <span>
                                              {stepStatus === 'verified'
                                                ? 'Verified'
                                                : stepStatus === 'needs_clarification'
                                                  ? 'Clarification Requested'
                                                  : 'Pending Review'}
                                            </span>
                                          </span>

                                          {sentNotesForMilestone.length > 0 && (
                                            <span
                                              data-testid={`review-milestone-feedback-sent-${step.milestoneKey}-${selectedReviewGrant.consentId}`}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B]"
                                            >
                                              <MessageSquare className="w-3 h-3" aria-hidden="true" />
                                              <span>
                                                Feedback Sent ({sentNotesForMilestone.length})
                                              </span>
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                                          {step.shortPrompt}
                                        </p>
                                        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                                          <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                                            Privacy Vault Boundary:{' '}
                                          </strong>
                                          {step.privacyBoundaryRule}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Inline Milestone Feedback + Verify/Clarify Controls */}
                                  <div className="flex flex-col md:flex-row md:items-center gap-2.5 pt-1">
                                    <label
                                      htmlFor={`review-milestone-feedback-${step.milestoneKey}-${selectedReviewGrant.consentId}`}
                                      className="sr-only"
                                    >
                                      Milestone feedback message for {step.milestoneLabel}
                                    </label>
                                    <input
                                      id={`review-milestone-feedback-${step.milestoneKey}-${selectedReviewGrant.consentId}`}
                                      type="text"
                                      value={draftValue}
                                      onChange={(e) =>
                                        setMilestoneNoteDrafts((prev) => ({
                                          ...prev,
                                          [draftKey]: e.target.value,
                                        }))
                                      }
                                      data-testid={`review-milestone-feedback-${step.milestoneKey}-${selectedReviewGrant.consentId}`}
                                      placeholder={`Write ${step.milestoneLabel} milestone feedback for ${selectedReviewGrant.talentAlias} (or leave blank for standard milestone message)...`}
                                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                                    />

                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        data-testid={`review-clarify-milestone-${step.milestoneKey}-${selectedReviewGrant.consentId}`}
                                        onClick={() => {
                                          const message =
                                            draftValue.trim() || step.defaultClarificationFeedback;
                                          onUpdateVerificationStep?.(
                                            selectedReviewGrant.consentId,
                                            step.id,
                                            'needs_clarification',
                                            message
                                          );
                                          onSendApplicantFeedback?.({
                                            consentId: selectedReviewGrant.consentId,
                                            stage: step.feedbackStage,
                                            tone: 'clarification_needed',
                                            message,
                                          });
                                          setMilestoneNoteDrafts((prev) => ({
                                            ...prev,
                                            [draftKey]: '',
                                          }));
                                        }}
                                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#C4622D]/40 dark:border-[#E07B46]/45 bg-white dark:bg-[#1A1C20] hover:bg-[#F9ECE5] dark:hover:bg-[#231914] text-xs font-semibold text-[#A95021] dark:text-[#F59E6C] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Request Clarification</span>
                                      </button>

                                      <button
                                        type="button"
                                        data-testid={`review-verify-milestone-${step.milestoneKey}-${selectedReviewGrant.consentId}`}
                                        onClick={() => {
                                          const message =
                                            draftValue.trim() || step.defaultVerifiedFeedback;
                                          onUpdateVerificationStep?.(
                                            selectedReviewGrant.consentId,
                                            step.id,
                                            'verified',
                                            message
                                          );
                                          onSendApplicantFeedback?.({
                                            consentId: selectedReviewGrant.consentId,
                                            stage: step.feedbackStage,
                                            tone: 'approved',
                                            message,
                                          });
                                          setMilestoneNoteDrafts((prev) => ({
                                            ...prev,
                                            [draftKey]: '',
                                          }));
                                        }}
                                        className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                                          stepStatus === 'verified'
                                            ? 'bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/40 text-[#146C53] dark:text-[#2EB88B] hover:bg-[#D5EBE2]'
                                            : 'bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315]'
                                        }`}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>
                                          {stepStatus === 'verified'
                                            ? `Re-Send ${step.milestoneLabel} Confirmation`
                                            : `Verify ${step.milestoneLabel} & Send Feedback`}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  {latestSentNote && (
                                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] bg-[#FAF8F5] dark:bg-[#121315] rounded-lg px-3 py-2 border border-[#E8E3DB] dark:border-[#2C3037]">
                                      <strong className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                                        Latest sent to applicant:{' '}
                                      </strong>
                                      {latestSentNote.message}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </section>

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

              {activeConsentedGrants.length === 0 ? (
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
                <div className="mt-6 grid grid-cols-1 gap-6">
                  {activeConsentedGrants.map((grant) => {
                    const verification = verificationsByGrantId[grant.consentId];
                    const stepProgress = computePartnerPreContractingProgress(verification);
                    const draft = getFeedbackDraft(grant.consentId);
                    const grantFeedbackHistory = applicantFeedback.filter(
                      (item) => item.consentId === grant.consentId
                    );
                    const matchingTemplates = PARTNER_FEEDBACK_TEMPLATES.filter(
                      (tpl) => tpl.stage === draft.stage
                    );

                    return (
                      <div
                        key={grant.consentId}
                        data-testid={`partner-candidate-card-${grant.consentId}`}
                        className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-6 space-y-5 shadow-xs"
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
                                Granted: {new Date(grant.grantedAtIso).toLocaleDateString()} · Status:{' '}
                                <strong className="text-[#146C53] dark:text-[#2EB88B]">
                                  Active &amp; Revocable
                                </strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              data-testid={`partner-readiness-pill-${grant.consentId}`}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                                stepProgress.isReadyForStage3
                                  ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
                                  : 'bg-white dark:bg-[#1A1C20] border border-[#146C53]/35 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]'
                              }`}
                            >
                              {stepProgress.isReadyForStage3 ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {stepProgress.isReadyForStage3
                                  ? '3/3 Verified · Ready for Stage 3'
                                  : `${stepProgress.verifiedCount}/3 Pre-Contracting Steps Verified`}
                              </span>
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

                        {/* Individual 3-Step Pre-Contracting Verification (Before Stage 3: Compliance & Contracting) */}
                        <div
                          data-testid={`partner-3step-panel-${grant.consentId}`}
                          className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                                PRE-CONTRACTING VERIFICATION · BEFORE STAGE 3
                              </span>
                              <h3 className="text-sm sm:text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                Verify Each of the 3 Readiness Steps Individually
                              </h3>
                              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                                Confirm each step one by one with inline review explainers before finalizing 3. Compliance &amp; Contracting.
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono-tabular text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                                {stepProgress.verifiedCount}/{stepProgress.totalCount} Steps Verified ({stepProgress.percentage}%)
                              </span>
                              <div className="mt-1 w-36 h-1.5 rounded-full bg-[#E8E3DB] dark:bg-[#2C3037] overflow-hidden">
                                <div
                                  className="h-full bg-[#146C53] dark:bg-[#2EB88B] transition-all"
                                  style={{ width: `${stepProgress.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {PARTNER_PRE_CONTRACTING_STEPS.map((step) => {
                              const currentStatus =
                                verification?.steps?.[step.id]?.status ?? 'pending';
                              const explainerKey = `${grant.consentId}:${step.id}`;
                              const isExplainerOpen = Boolean(expandedStepExplainers[explainerKey]);

                              return (
                                <div
                                  key={step.id}
                                  data-testid={`partner-step-row-${step.id}-${grant.consentId}`}
                                  data-step-status={currentStatus}
                                  className={`rounded-xl border p-4 space-y-3 transition-colors ${
                                    currentStatus === 'verified'
                                      ? 'bg-[#E7F3EE]/40 dark:bg-[#142B24]/50 border-[#146C53]/40 dark:border-[#2EB88B]/45'
                                      : currentStatus === 'needs_clarification'
                                        ? 'bg-[#F9ECE5]/50 dark:bg-[#231914]/65 border-[#C4622D]/40 dark:border-[#E07B46]/45'
                                        : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037]'
                                  }`}
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <span
                                        className={`w-7 h-7 rounded-full text-xs font-mono-tabular font-semibold flex items-center justify-center shrink-0 ${
                                          currentStatus === 'verified'
                                            ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                                            : currentStatus === 'needs_clarification'
                                              ? 'bg-[#C4622D] dark:bg-[#E07B46] text-white dark:text-[#121315]'
                                              : 'bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]'
                                        }`}
                                      >
                                        {step.stepNumber}
                                      </span>
                                      <div className="min-w-0 space-y-0.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="text-xs sm:text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                            {step.title}
                                          </h4>
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                              currentStatus === 'verified'
                                                ? 'bg-[#146C53]/15 text-[#146C53] dark:text-[#5EEAD4]'
                                                : currentStatus === 'needs_clarification'
                                                  ? 'bg-[#C4622D]/15 text-[#A95021] dark:text-[#F59E6C]'
                                                  : 'bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                                            }`}
                                          >
                                            {currentStatus === 'verified'
                                              ? 'Verified'
                                              : currentStatus === 'needs_clarification'
                                                ? 'Clarification Requested'
                                                : 'Pending Review'}
                                          </span>
                                        </div>
                                        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                                          {step.shortPrompt}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        aria-expanded={isExplainerOpen}
                                        data-testid={`partner-step-explainer-btn-${step.id}-${grant.consentId}`}
                                        onClick={() => toggleStepExplainer(grant.consentId, step.id)}
                                        className="min-h-[34px] px-2.5 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[11px] font-semibold text-[#43484E] dark:text-[#C8CDD4] inline-flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <BookOpen className="w-3 h-3" aria-hidden="true" />
                                        <span>Review Guide</span>
                                        {isExplainerOpen ? (
                                          <ChevronUp className="w-3 h-3" aria-hidden="true" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3" aria-hidden="true" />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        data-testid={`partner-clarify-step-${step.id}-${grant.consentId}`}
                                        onClick={() => {
                                          onUpdateVerificationStep?.(
                                            grant.consentId,
                                            step.id,
                                            'needs_clarification'
                                          );
                                          updateFeedbackDraft(grant.consentId, {
                                            stage: step.feedbackStage,
                                            tone: 'clarification_needed',
                                          });
                                        }}
                                        className={`min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors border ${
                                          currentStatus === 'needs_clarification'
                                            ? 'bg-[#C4622D] border-[#C4622D] text-white dark:bg-[#E07B46] dark:border-[#E07B46] dark:text-[#121315]'
                                            : 'bg-white dark:bg-[#1A1C20] border-[#C4622D]/40 dark:border-[#E07B46]/45 text-[#A95021] dark:text-[#F59E6C] hover:bg-[#F9ECE5] dark:hover:bg-[#2D1E17]'
                                        }`}
                                      >
                                        <AlertCircle className="w-3 h-3" aria-hidden="true" />
                                        <span>Request Clarification</span>
                                      </button>

                                      <button
                                        type="button"
                                        data-testid={`partner-verify-step-${step.id}-${grant.consentId}`}
                                        onClick={() => {
                                          const nextStatus: PartnerStepReviewStatus =
                                            currentStatus === 'verified' ? 'pending' : 'verified';
                                          onUpdateVerificationStep?.(
                                            grant.consentId,
                                            step.id,
                                            nextStatus
                                          );
                                        }}
                                        className={`min-h-[34px] px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                          currentStatus === 'verified'
                                            ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
                                            : 'bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/35 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B] hover:bg-[#146C53] hover:text-white dark:hover:bg-[#2EB88B] dark:hover:text-[#121315]'
                                        }`}
                                      >
                                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                        <span>
                                          {currentStatus === 'verified'
                                            ? 'Step Verified'
                                            : `Verify Step ${step.stepNumber}`}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  {isExplainerOpen && (
                                    <div
                                      data-testid={`partner-step-explainer-panel-${step.id}-${grant.consentId}`}
                                      className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"
                                    >
                                      <div className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3 space-y-1.5">
                                        <p className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                                          {step.explainerTitle}
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                                          {step.whatToVerify.map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3 space-y-2">
                                        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                          Additional Review Checks
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                                          {step.additionalReviewChecks.map((check, idx) => (
                                            <li key={idx}>{check}</li>
                                          ))}
                                        </ul>
                                        <p className="rounded-md bg-[#E7F3EE]/60 dark:bg-[#142B24]/70 border border-[#146C53]/25 px-2.5 py-1.5 text-[11px] text-[#43484E] dark:text-[#C8CDD4]">
                                          <strong className="text-[#146C53] dark:text-[#2EB88B]">
                                            Privacy Boundary:{' '}
                                          </strong>
                                          {step.privacyBoundaryRule}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Stage-Targeted Feedback Composer to Prospective Skilled Refugee Applicant */}
                        <div
                          data-testid={`partner-feedback-composer-${grant.consentId}`}
                          className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-3.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>SEND STAGE-SPECIFIC FEEDBACK TO APPLICANT</span>
                              </span>
                              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                                Send clear, respectful document-processing updates directly to{' '}
                                <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                                  {grant.talentAlias}
                                </strong>
                                ’s <strong className="text-[#17191C] dark:text-[#F4F2EE]">2. Unlock</strong> stage at the exact step being reviewed.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor={`partner-feedback-stage-${grant.consentId}`}
                                className="block text-[11px] font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1"
                              >
                                Document Processing Stage
                              </label>
                              <select
                                id={`partner-feedback-stage-${grant.consentId}`}
                                data-testid={`partner-feedback-stage-${grant.consentId}`}
                                value={draft.stage}
                                onChange={(e) =>
                                  updateFeedbackDraft(grant.consentId, {
                                    stage: e.target.value as DocumentFeedbackStage,
                                  })
                                }
                                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                              >
                                {DOCUMENT_FEEDBACK_STAGE_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.fullLabel}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor={`partner-feedback-tone-${grant.consentId}`}
                                className="block text-[11px] font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1"
                              >
                                Feedback Type
                              </label>
                              <select
                                id={`partner-feedback-tone-${grant.consentId}`}
                                data-testid={`partner-feedback-tone-${grant.consentId}`}
                                value={draft.tone}
                                onChange={(e) =>
                                  updateFeedbackDraft(grant.consentId, {
                                    tone: e.target.value as PartnerFeedbackTone,
                                  })
                                }
                                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                              >
                                <option value="approved">Step Approved / Ready to Advance</option>
                                <option value="clarification_needed">Clarification Needed Before Stage 3</option>
                                <option value="encouragement">Hiring Progress &amp; Next-Step Note</option>
                              </select>
                            </div>
                          </div>

                          {matchingTemplates.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] me-1">
                                Quick templates:
                              </span>
                              {matchingTemplates.map((tpl) => (
                                <button
                                  key={tpl.id}
                                  type="button"
                                  onClick={() =>
                                    updateFeedbackDraft(grant.consentId, {
                                      stage: tpl.stage,
                                      tone: tpl.tone,
                                      message: tpl.text,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[11px] font-medium text-[#17191C] dark:text-[#F4F2EE] cursor-pointer transition-colors"
                                >
                                  {tpl.label}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              data-testid={`partner-feedback-input-${grant.consentId}`}
                              value={draft.message}
                              onChange={(e) =>
                                updateFeedbackDraft(grant.consentId, { message: e.target.value })
                              }
                              placeholder="Write clear, constructive document-stage feedback for the prospective applicant (e.g., which step is verified or what detail helps finish Stage 3 smoothly)..."
                              className="w-full p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                                Delivered securely under active consent {grant.consentId} · Zero raw IDs requested
                              </span>
                              <button
                                type="button"
                                disabled={draft.message.trim().length < 5}
                                data-testid={`partner-send-feedback-btn-${grant.consentId}`}
                                onClick={() => {
                                  if (draft.message.trim().length < 5) return;
                                  onSendApplicantFeedback?.({
                                    consentId: grant.consentId,
                                    stage: draft.stage,
                                    tone: draft.tone,
                                    message: draft.message.trim(),
                                  });
                                  updateFeedbackDraft(grant.consentId, { message: '' });
                                }}
                                className="min-h-[36px] px-4 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] disabled:opacity-50 dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Send Feedback to Applicant</span>
                              </button>
                            </div>
                          </div>

                          {grantFeedbackHistory.length > 0 && (
                            <div
                              data-testid={`partner-feedback-history-${grant.consentId}`}
                              className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2"
                            >
                              <p className="text-[11px] font-semibold text-[#575B62] dark:text-[#A3A7AE]">
                                Sent Stage Feedback ({grantFeedbackHistory.length})
                              </p>
                              <div className="space-y-1.5">
                                {grantFeedbackHistory.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs space-y-1"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                      <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                                        {getFeedbackStageMeta(item.stage).shortLabel}
                                      </span>
                                      <span className="font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                                        {new Date(item.createdAtIso).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <p className="text-[#43484E] dark:text-[#C8CDD4] leading-relaxed">
                                      {item.message}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                            {stepProgress.isReadyForStage3
                              ? 'All 3 pre-contracting steps verified — ready to finalize Stage 3 Compliance & Contracting.'
                              : `Remaining individual checks before Stage 3: Step(s) ${stepProgress.missingStepNumbers.join(', ')}.`}
                          </p>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              data-testid={`partner-proceed-stage3-btn-${grant.consentId}`}
                              onClick={() => setActiveTab('compliance')}
                              className="min-h-[38px] px-4 py-2 rounded-xl border border-[#146C53]/40 dark:border-[#2EB88B]/45 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE]/60 dark:hover:bg-[#142B24]/60 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Open 3. Compliance &amp; Contracting</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {issuedContractsByGrantId[grant.consentId] ? (
                              <span
                                data-testid={`partner-contract-issued-${grant.consentId}`}
                                className="min-h-[38px] px-4 py-2 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/35 dark:border-[#2EB88B]/40 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  Contract &amp; Escrow Active ({issuedContractsByGrantId[grant.consentId].contractRef})
                                </span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                data-testid={`issue-contract-btn-${grant.consentId}`}
                                onClick={() => onIssueContract(grant.consentId, selectedBridge)}
                                className="min-h-[38px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                                <span>Generate Compliant Sprint Contract &amp; Escrow</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                  Confirm individual 3-step pre-contracting readiness and additional review explainers before finalizing your compliant agreement.
                </p>
              </div>

              {/* Pre-Contracting Verification Gate & Additional Review Explainers (Before Finishing Stage 3) */}
              <div
                data-testid="partner-stage3-precheck-gate"
                className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                      PRE-FINISH REVIEW GATE · VERIFY BEFORE COMPLETING STAGE 3
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      Candidate 3-Step Verification Status &amp; Additional Review Guide
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid="stage3-understanding-verification-btn"
                      onClick={() => setUnderstandingModalOpen(true)}
                      className="min-h-[38px] px-3.5 py-2 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/60 dark:bg-[#142B24]/70 hover:bg-[#D5EBE2] dark:hover:bg-[#1C3B31] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Understanding Verification</span>
                    </button>
                    <button
                      type="button"
                      aria-expanded={stage3ReviewGuideOpen}
                      data-testid="partner-stage3-additional-review-btn"
                      onClick={() => setStage3ReviewGuideOpen((prev) => !prev)}
                      className="min-h-[38px] px-3.5 py-2 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE]/60 dark:hover:bg-[#142B24]/60 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {stage3ReviewGuideOpen
                          ? 'Hide Pre-Finish Review Explainers'
                          : 'Show Pre-Finish Review Explainers'}
                      </span>
                    </button>
                  </div>
                </div>

                {activeConsentedGrants.length === 0 ? (
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    No active consented candidates yet. Once a skilled builder shares a Consent Grant, their 3 individual verification steps will appear here prior to contract sign-off.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {activeConsentedGrants.map((grant) => {
                      const rec = verificationsByGrantId[grant.consentId];
                      const prog = computePartnerPreContractingProgress(rec);
                      const fbCount = applicantFeedback.filter(
                        (item) => item.consentId === grant.consentId
                      ).length;
                      return (
                        <div
                          key={grant.consentId}
                          data-testid={`stage3-gate-candidate-${grant.consentId}`}
                          className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                {grant.talentAlias}
                              </span>
                              <span className="font-mono-tabular text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                                ({grant.consentId})
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                                {prog.verifiedCount}/3 Steps Verified
                              </span>
                              <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                                · {fbCount} Feedback Note{fbCount === 1 ? '' : 's'} Sent
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              {PARTNER_PRE_CONTRACTING_STEPS.map((step) => {
                                const st = rec?.steps?.[step.id]?.status ?? 'pending';
                                return (
                                  <span
                                    key={step.id}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
                                      st === 'verified'
                                        ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 border-[#146C53]/30 text-[#146C53] dark:text-[#5EEAD4]'
                                        : st === 'needs_clarification'
                                          ? 'bg-[#F9ECE5]/70 dark:bg-[#231914]/70 border-[#C4622D]/35 text-[#A95021] dark:text-[#F59E6C]'
                                          : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                                    }`}
                                  >
                                    <span>
                                      Step {step.stepNumber}:{' '}
                                      {st === 'verified'
                                        ? 'Verified'
                                        : st === 'needs_clarification'
                                          ? 'Clarification'
                                          : 'Pending'}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab('talent')}
                            className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 self-start lg:self-center shrink-0 cursor-pointer transition-colors"
                          >
                            <span>
                              {prog.isReadyForStage3
                                ? 'Review Steps & Send Update (Tab 2)'
                                : 'Verify Remaining Steps & Send Feedback (Tab 2)'}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {stage3ReviewGuideOpen && (
                  <div
                    data-testid="partner-stage3-additional-review-panel"
                    className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"
                  >
                    {PRE_CONTRACTING_STAGE3_REVIEW_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-1.5"
                      >
                        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          {item.title}
                        </p>
                        <p className="text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                          {item.summary}
                        </p>
                        <p className="text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B]">
                          {item.actionHint}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="group" aria-label="Contracting bridge structure">
                {(
                  [
                    {
                      id: 'direct-local',
                      title: 'Direct Local Hire',
                      badge: 'Recommended',
                      description:
                        'Direct local employment contract under host-country regulatory frameworks with verified tax and FATF KYC clearance.',
                    },
                    {
                      id: 'scoped-remote',
                      title: 'Scoped Remote Contractor',
                      badge: 'Cross-Border',
                      description:
                        'Cross-border digital contractor agreement for project-based deliverables with milestone-based escrow disbursement.',
                    },
                    {
                      id: 'eor-fiscal-host',
                      title: 'EOR / Fiscal Host Bridge',
                      badge: 'Zero Entity Risk',
                      description:
                        'Partner Employer of Record / Humanitarian Fiscal Host manages local payroll, remittances, and statutory compliance.',
                    },
                  ] as const
                ).map((bridge) => {
                  const isSelected = selectedBridge === bridge.id;
                  return (
                    <button
                      key={bridge.id}
                      type="button"
                      aria-pressed={isSelected}
                      data-testid={`partner-bridge-option-${bridge.id}`}
                      onClick={() => setSelectedBridge(bridge.id)}
                      className={`text-left rounded-2xl p-5 space-y-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#E7F3EE]/55 dark:bg-[#142B24]/65 border-2 border-[#146C53] dark:border-[#2EB88B]'
                          : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53]/50 dark:hover:border-[#2EB88B]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-[#17191C] dark:text-[#F4F2EE]">
                          {bridge.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#E7F3EE] dark:bg-[#142B24] text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B] shrink-0">
                          {isSelected ? 'Selected' : bridge.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                        {bridge.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl bg-[#E7F3EE]/60 dark:bg-[#142B24]/60 border border-[#146C53]/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-[#146C53] dark:text-[#2EB88B]">
                    Instant 1-Click Compliant Agreement Generator
                  </span>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Download a tailored, ILO-aligned 1-page agreement template for{' '}
                    <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                      {selectedBridge === 'direct-local'
                        ? 'Direct Local Hire'
                        : selectedBridge === 'scoped-remote'
                          ? 'Scoped Remote Contractor'
                          : 'EOR / Fiscal Host Bridge'}
                    </strong>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="partner-download-agreement-btn"
                  onClick={() => {
                    const bridgeLabel =
                      selectedBridge === 'direct-local'
                        ? 'Direct Local Hire'
                        : selectedBridge === 'scoped-remote'
                          ? 'Scoped Remote Contractor'
                          : 'EOR / Fiscal Host Bridge';
                    const docLines = [
                      '====================================================================',
                      'VUKA NA AMANA — COMPLIANT PARTNER CONTRACTING & ONBOARDING PACKAGE',
                      '====================================================================',
                      `Hiring Partner Organization: ${orgName}`,
                      `Authorized Contact Email:    ${workEmail}`,
                      `Contracting Bridge Selected: ${bridgeLabel}`,
                      `Active Consent Grants:       ${activeConsentedGrants.length}`,
                      `Generated At (UTC):          ${new Date().toISOString()}`,
                      '',
                      '1. PRIVACY & ZERO-RAW-ID BOUNDARY',
                      '   - No raw asylum papers, refugee ID photos, or serial numbers are stored.',
                      '   - Licensed payout rails or EOR checks verify KYC readiness directly.',
                      '   - Builder consent remains revocable at any time via VNA-GRANT tokens.',
                      '',
                      '2. ILO FAIR-PAY & MILESTONE ESCROW COMMITMENT',
                      '   - Payment is released upon verified sprint milestone sign-off.',
                      '   - Equal remuneration and safe non-discriminatory terms apply (ILO Guiding Principles).',
                      '   - Zero broker or applicant fees are permitted.',
                      '',
                      '3. SIGN-OFF',
                      `   Partner Representative (${orgName}): ______________________  Date: __________`,
                      '   Practitioner / EOR Counterparty:      ______________________  Date: __________',
                    ].join('\n');

                    if (typeof document !== 'undefined') {
                      const blob = new Blob([docLines], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `vuka-compliant-agreement-${selectedBridge}-${new Date().toISOString().slice(0, 10)}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                    setAgreementStatusBanner(
                      `Downloaded ${bridgeLabel} Agreement Package for ${orgName} (.txt ready for legal review & digital signature).`
                    );
                  }}
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
                    {activeConsentedGrants.length} Grants
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Zero-trust active consent grants ({Object.keys(issuedContractsByGrantId).length} escrow contracts issued).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <UnderstandingVerificationModal
        isOpen={understandingModalOpen}
        onClose={() => setUnderstandingModalOpen(false)}
        orgName={orgName}
      />
    </div>
  );
};
