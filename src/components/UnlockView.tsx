import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Eye,
  FileCheck2,
  FileText,
  HelpCircle,
  Lock,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';
import type {
  AuthPathwayOption,
  BriefComplexity,
  BriefSubmission,
  CompetencyPassport,
  ConsentGrant,
  ContractPayout,
  ContractTemplateOption,
  PayoutRailOption,
  PeerEndorsement,
  PractitionerProfile,
  ProblemBrief,
  SkillCapability,
  UnlockViewMode,
  WorkReadyVault,
  WorkspaceTab,
} from '../types/kora';
import {
  PARTNER_PRE_CONTRACTING_STEPS,
  computePartnerPreContractingProgress,
  getFeedbackStageMeta,
  type PartnerApplicantFeedbackItem,
  type PartnerPreContractingRecord,
} from '../utils/partnerVerification';
import type { TranslationDictionary } from '../utils/i18n';
import {
  AUTH_PATHWAY_OPTIONS,
  BRIEF_COMPLEXITIES,
  CONTRACT_TEMPLATE_OPTIONS,
  PAYOUT_RAIL_OPTIONS,
  PRACTICE_DOMAINS,
  SEED_BRIEFS,
  computeVaultReadiness,
  filterAndRankBriefs,
  getAuthPathwayLabel,
  getContractTemplateLabel,
  getPayoutRailLabel,
} from '../utils/talentEngine';
import { WovenBridgeArcsMotif } from './ResilienceMotifs';
import { SprintAgreementModal } from './SprintAgreementModal';
import { PayoutStatusCard } from './PayoutStatusCard';
import { PayoutTransactionLedger } from './PayoutTransactionLedger';
import { PeerEndorsementPanel } from './PeerEndorsementPanel';
import { ComplianceCrossingSection } from './ComplianceCrossingSection';
import { ComplianceGuidedTour } from './ComplianceGuidedTour';
import { PlatformFAQs } from './PlatformFAQs';
import { VoiceInput } from './VoiceField';

interface UnlockViewProps {
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
  vault: WorkReadyVault;
  endorsements: PeerEndorsement[];
  payouts: ContractPayout[];
  vaultViewMode: UnlockViewMode;
  speechLang: string;
  t: TranslationDictionary;
  onChangeVaultViewMode: (mode: UnlockViewMode) => void;
  onUpdateVault: (next: WorkReadyVault) => void;
  onAdvancePayout?: (payoutId: string) => void;
  onRequestEndorsement: (input: {
    collaboratorName: string;
    collaboratorRole: string;
    organization: string;
    capabilityTitle: string;
    endorsementText?: string;
    sourceTab: 'verify' | 'unlock';
  }) => PeerEndorsement;
  onCompleteEndorsement?: (endorsementId: string, endorsementText: string) => void;
  onDeleteEndorsement: (endorsementId: string) => void;
  onAcceptBrief: (brief: ProblemBrief) => void;
  onOpenSolve: (briefId: string) => void;
  activeGrants?: ConsentGrant[];
  partnerVerifications?: Record<string, PartnerPreContractingRecord>;
  partnerFeedback?: PartnerApplicantFeedbackItem[];
  onNavigateStage?: (tab: WorkspaceTab) => void;
}

type ChecklistStepId = 'identity' | 'contract' | 'payout';

export const UnlockView: React.FC<UnlockViewProps> = ({
  profile,
  capabilities,
  contributions,
  passport,
  vault,
  endorsements,
  payouts,
  vaultViewMode,
  speechLang,
  t,
  onChangeVaultViewMode,
  onUpdateVault,
  onRequestEndorsement,
  onDeleteEndorsement,
  onAcceptBrief,
  onOpenSolve,
  activeGrants = [],
  partnerVerifications = {},
  partnerFeedback = [],
  onNavigateStage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [complexityFilter, setComplexityFilter] = useState<'ALL' | BriefComplexity>('ALL');
  const [expandedStep, setExpandedStep] = useState<ChecklistStepId | null>(() => {
    if (!vault.identityCompleted) return 'identity';
    if (!vault.contractCompleted) return 'contract';
    if (!vault.payoutCompleted) return 'payout';
    return null;
  });
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const readiness = useMemo(() => computeVaultReadiness(vault), [vault]);
  const verifiedSkillsCount = useMemo(
    () => capabilities.filter((c) => c.verificationStatus !== 'pending').length,
    [capabilities]
  );

  const rankedBriefs = useMemo(
    () =>
      filterAndRankBriefs(
        SEED_BRIEFS,
        searchQuery,
        domainFilter,
        profile.problemStatement,
        profile.ageStage,
        capabilities,
        complexityFilter,
        passport
      ),
    [
      searchQuery,
      domainFilter,
      profile.problemStatement,
      profile.ageStage,
      capabilities,
      complexityFilter,
      passport,
    ]
  );

  const qualifiedCount = rankedBriefs.filter((b) => b.qualified).length;
  const topMatchedBrief = rankedBriefs[0] ?? SEED_BRIEFS[0];

  const handleToggleStepDone = (step: ChecklistStepId) => {
    const now = new Date().toISOString();
    if (step === 'identity') {
      const nextCompleted = !vault.identityCompleted;
      onUpdateVault({ ...vault, identityCompleted: nextCompleted, updatedAtIso: now });
      if (nextCompleted && !vault.contractCompleted) setExpandedStep('contract');
      else if (nextCompleted) setExpandedStep(null);
      return;
    }
    if (step === 'contract') {
      const nextCompleted = !vault.contractCompleted;
      onUpdateVault({ ...vault, contractCompleted: nextCompleted, updatedAtIso: now });
      if (nextCompleted && !vault.payoutCompleted) setExpandedStep('payout');
      else if (nextCompleted) setExpandedStep(null);
      return;
    }
    const nextCompleted = !vault.payoutCompleted;
    onUpdateVault({ ...vault, payoutCompleted: nextCompleted, updatedAtIso: now });
    if (nextCompleted) setExpandedStep(null);
  };

  const handleSelectAuthPathway = (identityPathway: AuthPathwayOption) => {
    onUpdateVault({
      ...vault,
      identityPathway,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleSelectContractTemplate = (contractTemplate: ContractTemplateOption) => {
    onUpdateVault({
      ...vault,
      contractTemplate,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleSelectPayoutRail = (payoutRail: PayoutRailOption) => {
    onUpdateVault({
      ...vault,
      payoutRail,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const checklistItems: Array<{
    id: ChecklistStepId;
    stepNumber: string;
    title: string;
    shortCopy: string; // Strictly under 15 words
    completed: boolean;
    selectedLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'identity',
      stepNumber: '01',
      title: 'Identity & Work-Auth Pathway',
      shortCopy: 'Confirm your legal remote or local working pathway in plain language.',
      completed: vault.identityCompleted,
      selectedLabel: getAuthPathwayLabel(vault.identityPathway),
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'contract',
      stepNumber: '02',
      title: 'Remote / Local Contract Template',
      shortCopy: 'Pick a clear milestone agreement tailored for smooth remote or local work.',
      completed: vault.contractCompleted,
      selectedLabel: getContractTemplateLabel(vault.contractTemplate),
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'payout',
      stepNumber: '03',
      title: 'Compliant Payout Rail',
      shortCopy: 'Choose mobile money, local bank, or digital wallet for fast payouts.',
      completed: vault.payoutCompleted,
      selectedLabel: getPayoutRailLabel(vault.payoutRail),
      icon: <Wallet className="w-4 h-4" />,
    },
  ];

  return (
    <section aria-labelledby="unlock-heading" className="space-y-10">
      {/* Persistent, Non-Dismissible Sequential-Stage Disclaimer inside 2. Unlock */}
      <aside
        role="note"
        aria-label="Sequential stage guidance for accurate document processing"
        data-testid="unlock-sequential-stage-disclaimer"
        className="rounded-2xl border border-[#C4622D]/35 dark:border-[#E07B46]/40 bg-[#F9ECE5]/75 dark:bg-[#231914]/90 p-5 sm:p-6 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1A1C20] border border-[#C4622D]/30 dark:border-[#E07B46]/35 text-[#C4622D] dark:text-[#E07B46] flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A95021] dark:text-[#F59E6C]">
                Important Guidance · Follow All Platform Stages in Sequence
              </p>
              <h2 className="text-sm sm:text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Complete Stages 1 → 5 in order to avoid rushing, confusion, or incomplete document assembly
              </h2>
              <p className="text-xs sm:text-sm text-[#43484E] dark:text-[#C8CDD4] leading-relaxed">
                Take your time completing{' '}
                <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  1. Verify
                </strong>{' '}
                (Competency Passport &amp; proof) before finalizing{' '}
                <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  2. Unlock
                </strong>{' '}
                (work-auth, contracting, and payout readiness), then apply in{' '}
                <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  3. Solve
                </strong>
                . Following each stage in order ensures every hiring partner receives a complete, accurate document package and prevents avoidable verification delays.
              </p>
            </div>
          </div>

          {onNavigateStage && verifiedSkillsCount === 0 && !passport && (
            <button
              type="button"
              onClick={() => onNavigateStage('verify')}
              className="min-h-[38px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#1A1C20] border border-[#C4622D]/40 dark:border-[#E07B46]/45 text-xs font-semibold text-[#A95021] dark:text-[#F59E6C] hover:bg-[#FAF8F5] dark:hover:bg-[#23262B] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start cursor-pointer transition-colors"
            >
              <span>Complete Stage 1 · Verify First</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <ol
          aria-label="Recommended sequential platform stages"
          className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium"
        >
          {(
            [
              {
                id: 'verify',
                label: '1. Verify Skills',
                done: Boolean(passport) || verifiedSkillsCount > 0,
              },
              { id: 'unlock', label: '2. Unlock Readiness (Current)', current: true },
              {
                id: 'solve',
                label: '3. Solve Sprints',
                done: contributions.length > 0,
              },
              { id: 'pulse', label: '4. Impact Pulse' },
              { id: 'cleared', label: '5. Cleared Mobility' },
            ] as Array<{
              id: WorkspaceTab;
              label: string;
              done?: boolean;
              current?: boolean;
            }>
          ).map((stage) => (
            <li
              key={stage.id}
              className={`px-2.5 py-1 rounded-lg border ${
                stage.current
                  ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                  : stage.done
                    ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
                    : 'bg-white/80 dark:bg-[#1A1C20]/80 border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
              }`}
            >
              {stage.label}
            </li>
          ))}
        </ol>
      </aside>

      {/* Work-Ready Vault: Dual-View 1+1=3 Mechanic */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8">
        <WovenBridgeArcsMotif />

        <div className="relative z-10 space-y-6">
          {/* Vault Header + Dual Segmented Toggle */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
                Work-Ready Vault · Zero Bureaucracy
              </p>
              <h1
                id="unlock-heading"
                className="mt-1.5 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
              >
                Clear to work, contract, and get paid
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                Three calm steps turn work-authorization and payment hurdles into instant hiring confidence.
              </p>
            </div>

            {/* Two Clean Toggles + Guided Tour Button */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
              <button
                type="button"
                data-testid="vault-start-tour-btn"
                onClick={() => setTourOpen(true)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-[#E7F3EE]/60 dark:bg-[#142B24]/70 hover:bg-[#D5EBE2] dark:hover:bg-[#1A3930] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Compliance Tour</span>
              </button>

              <div
                role="tablist"
                aria-label="Work-Ready Vault view mode"
                className="inline-flex items-center p-1 rounded-xl bg-[#F2EEE8] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={vaultViewMode === 'talent'}
                  onClick={() => onChangeVaultViewMode('talent')}
                  className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    vaultViewMode === 'talent'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#2EB88B] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Talent View</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  data-testid="vault-toggle-partner-preview"
                  aria-selected={vaultViewMode === 'partner'}
                  onClick={() => onChangeVaultViewMode('partner')}
                  className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    vaultViewMode === 'partner'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#2EB88B] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Partner Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW A: TALENT VIEW — 3-Step Interactive Readiness Checklist */}
          {vaultViewMode === 'talent' ? (
            <div role="tabpanel" aria-label="Talent readiness checklist" className="space-y-5">
              {/* Calm Readiness Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold font-mono-tabular tabular-nums text-[#146C53] dark:text-[#2EB88B]">
                    {readiness.completedCount}/{readiness.totalCount} Self-Declared Ready
                  </span>
                  <div
                    className="w-32 sm:w-44 h-2 rounded-full bg-[#F2EEE8] dark:bg-[#22252A] overflow-hidden"
                    role="progressbar"
                    aria-label="Work-Ready Vault readiness"
                    aria-valuenow={readiness.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] transition-[width] duration-300"
                      style={{ width: `${readiness.percentage}%` }}
                    />
                  </div>
                </div>

                {readiness.isFullyReady ? (
                  <button
                    type="button"
                    onClick={() => onChangeVaultViewMode('partner')}
                    className="text-xs font-semibold text-[#C4622D] dark:text-[#E07B46] inline-flex items-center gap-1 hover:underline self-start sm:self-auto whitespace-nowrap"
                  >
                    <span>Open Read-Only Partner Preview</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                ) : (
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Complete all 3 self-readiness steps to prepare your dossier for partner sign-off.
                  </p>
                )}
              </div>

              {/* 3 Interactive Checklist Cards */}
              <div className="space-y-3">
                {checklistItems.map((item) => {
                  const isOpen = expandedStep === item.id;
                  return (
                    <div
                      key={item.id}
                      data-vault-step={item.id}
                      data-vault-ready={item.completed ? 'true' : 'false'}
                      className={`rounded-xl border transition-colors ${
                        item.completed
                          ? 'bg-[#FAF8F5]/80 dark:bg-[#121315]/90 border-[#146C53]/35 dark:border-[#2EB88B]/35'
                          : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037]'
                      }`}
                    >
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedStep(isOpen ? null : item.id)}
                          aria-expanded={isOpen}
                          className="flex items-start gap-3.5 text-start flex-1 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] rounded-lg"
                        >
                          <span
                            className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              item.completed
                                ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
                                : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                            }`}
                          >
                            {item.icon}
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-mono-tabular font-semibold text-[#C4622D] dark:text-[#E07B46]">
                                {item.stepNumber}
                              </span>
                              <h2 className="text-sm sm:text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                {item.title}
                              </h2>
                            </div>
                            <p
                              data-testid={`vault-copy-${item.id}`}
                              className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]"
                            >
                              {item.shortCopy}
                            </p>
                            <p className="mt-1.5 text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]">
                              Selected: <span className="text-[#146C53] dark:text-[#2EB88B]">{item.selectedLabel}</span>
                            </p>
                          </div>
                        </button>

                        {/* Status Pill or Action */}
                        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                          {item.completed ? (
                            <span
                              data-testid={`verified-ready-pill-${item.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Self-Declared Ready</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setExpandedStep(isOpen ? null : item.id)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] transition-colors whitespace-nowrap"
                            >
                              {isOpen ? 'Close Steps' : 'Set Up'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedStep(isOpen ? null : item.id)}
                            aria-label={isOpen ? `Collapse ${item.title}` : `Expand ${item.title}`}
                            className="min-h-[36px] min-w-[36px] rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center"
                          >
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Plain-Language Step Drawer */}
                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {item.id === 'identity' &&
                              AUTH_PATHWAY_OPTIONS.map((opt) => {
                                const active = vault.identityPathway === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelectAuthPathway(opt.id)}
                                    aria-pressed={active}
                                    className={`text-start rounded-xl p-3.5 border transition-colors ${
                                      active
                                        ? 'bg-white dark:bg-[#1A1C20] border-[#146C53] dark:border-[#2EB88B]'
                                        : 'bg-white/60 dark:bg-[#1A1C20]/60 border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#C9C1B5]'
                                    }`}
                                  >
                                    <p
                                      className={`text-xs font-semibold ${
                                        active
                                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                                          : 'text-[#17191C] dark:text-[#F4F2EE]'
                                      }`}
                                    >
                                      {opt.label}
                                    </p>
                                    <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                                      {opt.plainStep}
                                    </p>
                                  </button>
                                );
                              })}

                            {item.id === 'contract' &&
                              CONTRACT_TEMPLATE_OPTIONS.map((opt) => {
                                const active = vault.contractTemplate === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelectContractTemplate(opt.id)}
                                    aria-pressed={active}
                                    className={`text-start rounded-xl p-3.5 border transition-colors ${
                                      active
                                        ? 'bg-white dark:bg-[#1A1C20] border-[#146C53] dark:border-[#2EB88B]'
                                        : 'bg-white/60 dark:bg-[#1A1C20]/60 border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#C9C1B5]'
                                    }`}
                                  >
                                    <p
                                      className={`text-xs font-semibold ${
                                        active
                                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                                          : 'text-[#17191C] dark:text-[#F4F2EE]'
                                      }`}
                                    >
                                      {opt.label}
                                    </p>
                                    <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                                      {opt.plainStep}
                                    </p>
                                  </button>
                                );
                              })}

                            {item.id === 'payout' &&
                              PAYOUT_RAIL_OPTIONS.map((opt) => {
                                const active = vault.payoutRail === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelectPayoutRail(opt.id)}
                                    aria-pressed={active}
                                    className={`text-start rounded-xl p-3.5 border transition-colors ${
                                      active
                                        ? 'bg-white dark:bg-[#1A1C20] border-[#146C53] dark:border-[#2EB88B]'
                                        : 'bg-white/60 dark:bg-[#1A1C20]/60 border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#C9C1B5]'
                                    }`}
                                  >
                                    <p
                                      className={`text-xs font-semibold ${
                                        active
                                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                                          : 'text-[#17191C] dark:text-[#F4F2EE]'
                                      }`}
                                    >
                                      {opt.label}
                                    </p>
                                    <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                                      {opt.plainStep}
                                    </p>
                                  </button>
                                );
                              })}
                          </div>

                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleStepDone(item.id)}
                              className={`min-h-[42px] px-5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                                item.completed
                                  ? 'border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                                  : 'bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315]'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {item.completed ? 'Mark Needs Review' : 'Mark Self-Declared Ready'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW B: READ-ONLY PARTNER PREVIEW — Pre-Posting Dossier Preview (Strictly Talent-Scoped) */
            <div role="tabpanel" aria-label="Read-Only Hiring Partner Preview" className="space-y-6">
              {/* Role-Isolation & Read-Only Preview Notice */}
              <div
                data-testid="partner-preview-safeguard-banner"
                role="note"
                className="rounded-xl bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border border-[#146C53]/30 dark:border-[#2EB88B]/35 px-4 py-3 flex items-start gap-3"
              >
                <Lock className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5 text-xs leading-relaxed">
                  <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    Read-Only Partner Preview · Pre-Posting View of Your Own Dossier
                  </p>
                  <p className="text-[#575B62] dark:text-[#A3A7AE]">
                    This preview shows how your readiness packet appears to a hiring partner before contracting. Escrow releases and collaborator endorsements require verified partner or external collaborator sign-off and cannot be self-approved here.
                  </p>
                </div>
              </div>

              <article className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                      Pre-Posting Compliance Card Preview
                    </p>
                    <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      {profile.displayName || 'Skilled Practitioner'}
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
                      Track {profile.ageStage} · {verifiedSkillsCount} confirmed capability record(s)
                      {passport ? ` · Living Competency Passport Drafted` : ''}
                    </p>
                  </div>

                  <span
                    data-testid="partner-clearance-badge"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold self-start whitespace-nowrap border ${
                      readiness.isFullyReady
                        ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-[#F9ECE5] dark:bg-[#2D1E17] border-[#C4622D]/25 dark:border-[#E07B46]/30 text-[#C4622D] dark:text-[#E07B46]'
                    }`}
                  >
                    {readiness.isFullyReady ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {readiness.isFullyReady
                        ? 'Self-Declared Ready · Pending Partner Sign-Off'
                        : `${readiness.completedCount}/3 Self-Readiness Steps Complete`}
                    </span>
                  </span>
                </div>

                {/* 3 Self-Declared Compliance Pillars */}
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-1.5">
                    <dt className="flex items-center justify-between gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      <span>Work-Auth Pathway</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          vault.identityCompleted
                            ? 'text-[#146C53] dark:text-[#2EB88B]'
                            : 'text-[#C4622D] dark:text-[#E07B46]'
                        }`}
                      >
                        {vault.identityCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{vault.identityCompleted ? 'Self-Declared' : 'Pending'}</span>
                      </span>
                    </dt>
                    <dd className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {getAuthPathwayLabel(vault.identityPathway)}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-1.5">
                    <dt className="flex items-center justify-between gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      <span>Contract Template</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          vault.contractCompleted
                            ? 'text-[#146C53] dark:text-[#2EB88B]'
                            : 'text-[#C4622D] dark:text-[#E07B46]'
                        }`}
                      >
                        {vault.contractCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{vault.contractCompleted ? 'Self-Declared' : 'Pending'}</span>
                      </span>
                    </dt>
                    <dd className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {getContractTemplateLabel(vault.contractTemplate)}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-1.5">
                    <dt className="flex items-center justify-between gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      <span>Compliant Payout Rail</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          vault.payoutCompleted
                            ? 'text-[#146C53] dark:text-[#2EB88B]'
                            : 'text-[#C4622D] dark:text-[#E07B46]'
                        }`}
                      >
                        {vault.payoutCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{vault.payoutCompleted ? 'Self-Declared' : 'Pending'}</span>
                      </span>
                    </dt>
                    <dd className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {getPayoutRailLabel(vault.payoutRail)}
                    </dd>
                  </div>
                </dl>

                {/* Single Primary Preview Action + Calm Secondary Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] max-w-xl leading-relaxed">
                    Inspect the draft milestone agreement and IP terms you and a hiring partner will review before funds are committed to escrow.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {!readiness.isFullyReady && (
                      <button
                        type="button"
                        onClick={() => onChangeVaultViewMode('talent')}
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] transition-colors whitespace-nowrap"
                      >
                        Complete Remaining Steps
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setAgreementModalOpen(true)}
                      className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#C4622D] hover:bg-[#A95021] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Preview Draft Sprint Agreement</span>
                    </button>
                  </div>
                </div>
              </article>

              {/* Contract Payment Lifecycle Tracker (Read-Only in Talent Studio) */}
              <PayoutStatusCard
                payouts={payouts}
                readOnlyPreview
              />

              {/* Payout Transaction Ledger with Compliant PDF Receipt Downloads */}
              <PayoutTransactionLedger
                payouts={payouts}
                practitionerName={profile.displayName || 'Skilled Practitioner'}
                vault={vault}
              />

              {/* Collaborator Verification Link Generator (External Sign-Off Required) */}
              <PeerEndorsementPanel
                variant="partner"
                readOnlyPreview
                endorsements={endorsements}
                capabilities={capabilities}
                passport={passport}
                speechLang={speechLang}
                t={t}
                onRequestEndorsement={onRequestEndorsement}
                onDeleteEndorsement={onDeleteEndorsement}
              />
            </div>
          )}
        </div>
      </div>

      {/* Live Hiring Partner Pre-Contracting Verification Status & Stage-Targeted Feedback */}
      <section
        aria-labelledby="unlock-partner-feedback-heading"
        data-testid="unlock-partner-feedback-panel"
        className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
              Cross-Portal Document Review · Real-Time Partner Feedback
            </p>
            <h2
              id="unlock-partner-feedback-heading"
              className="mt-1 font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
            >
              Hiring Partner Pre-Contracting Verification &amp; Stage Feedback
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] max-w-2xl leading-relaxed">
              When you share a revocable Consent Grant in Stage 3, hiring partners verify each of the 3 pre-contracting steps individually and send stage-specific updates or clarification notes right here before finalizing contracting.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] self-start shrink-0">
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {partnerFeedback.length} Feedback Note{partnerFeedback.length === 1 ? '' : 's'}
            </span>
          </span>
        </div>

        {activeGrants.length === 0 && partnerFeedback.length === 0 ? (
          <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                No active hiring partner document reviews yet
              </p>
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed max-w-xl">
                Complete your readiness steps above, then apply with a Consent Grant in Stage 3 (Solve). Your hiring partner’s step-by-step verification badges and stage feedback will appear here automatically.
              </p>
            </div>
            {onNavigateStage && (
              <button
                type="button"
                onClick={() => onNavigateStage('solve')}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE]/60 dark:hover:bg-[#142B24]/60 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <span>Explore Stage 3 · Solve</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {activeGrants.map((grant) => {
              const verification = partnerVerifications[grant.consentId];
              const progress = computePartnerPreContractingProgress(verification);
              return (
                <div
                  key={grant.consentId}
                  data-testid={`unlock-grant-verification-${grant.consentId}`}
                  className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {grant.grantedToOrgName}{' '}
                        <span className="font-mono-tabular text-[11px] font-normal text-[#575B62] dark:text-[#A3A7AE]">
                          ({grant.consentId})
                        </span>
                      </p>
                      <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        Individual Partner Pre-Contracting Checks (prior to Stage 3 Contracting)
                      </p>
                    </div>
                    <span
                      data-testid={`unlock-grant-progress-${grant.consentId}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        progress.isReadyForStage3
                          ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/35 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]'
                          : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#43484E] dark:text-[#C8CDD4]'
                      }`}
                    >
                      {progress.isReadyForStage3 ? (
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {progress.verifiedCount}/{progress.totalCount} Steps Verified by Partner
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PARTNER_PRE_CONTRACTING_STEPS.map((step) => {
                      const stepState = verification?.steps?.[step.id]?.status ?? 'pending';
                      return (
                        <div
                          key={step.id}
                          data-testid={`unlock-partner-step-${step.id}-${grant.consentId}`}
                          data-step-status={stepState}
                          className={`rounded-xl border p-3.5 space-y-1 ${
                            stepState === 'verified'
                              ? 'bg-white dark:bg-[#1A1C20] border-[#146C53]/40 dark:border-[#2EB88B]/45'
                              : stepState === 'needs_clarification'
                                ? 'bg-[#F9ECE5]/60 dark:bg-[#231914]/75 border-[#C4622D]/40 dark:border-[#E07B46]/45'
                                : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-mono-tabular font-semibold text-[#575B62] dark:text-[#A3A7AE]">
                              STEP {step.stepNumber} · {step.milestoneLabel.toUpperCase()}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                stepState === 'verified'
                                  ? 'text-[#146C53] dark:text-[#2EB88B]'
                                  : stepState === 'needs_clarification'
                                    ? 'text-[#C4622D] dark:text-[#E07B46]'
                                    : 'text-[#575B62] dark:text-[#A3A7AE]'
                              }`}
                            >
                              {stepState === 'verified' ? (
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                              ) : stepState === 'needs_clarification' ? (
                                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                              ) : (
                                <Clock className="w-3 h-3" aria-hidden="true" />
                              )}
                              <span>
                                {stepState === 'verified'
                                  ? 'Verified'
                                  : stepState === 'needs_clarification'
                                    ? 'Clarification Requested'
                                    : 'Pending Review'}
                              </span>
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            {step.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {partnerFeedback.length > 0 && (
              <div className="space-y-3" data-testid="unlock-partner-feedback-list">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#146C53] dark:text-[#2EB88B]">
                  Stage-Specific Messages from Hiring Partners
                </p>
                <div className="space-y-2.5">
                  {partnerFeedback.map((fb) => {
                    const stageMeta = getFeedbackStageMeta(fb.stage);
                    return (
                      <article
                        key={fb.id}
                        data-testid={`unlock-feedback-item-${fb.id}`}
                        className={`rounded-xl border p-4 space-y-2 ${
                          fb.tone === 'clarification_needed'
                            ? 'bg-[#F9ECE5]/60 dark:bg-[#231914]/75 border-[#C4622D]/35 dark:border-[#E07B46]/40'
                            : 'bg-[#E7F3EE]/50 dark:bg-[#142B24]/60 border-[#146C53]/30 dark:border-[#2EB88B]/35'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                              {fb.fromOrgName}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                              {stageMeta.shortLabel}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                fb.tone === 'clarification_needed'
                                  ? 'bg-[#C4622D]/15 text-[#A95021] dark:text-[#F59E6C]'
                                  : fb.tone === 'approved'
                                    ? 'bg-[#146C53]/15 text-[#146C53] dark:text-[#5EEAD4]'
                                    : 'bg-white/80 dark:bg-[#1A1C20] text-[#43484E] dark:text-[#C8CDD4]'
                              }`}
                            >
                              {fb.tone === 'clarification_needed'
                                ? 'Clarification Needed'
                                : fb.tone === 'approved'
                                  ? 'Step Approved'
                                  : 'Hiring Update'}
                            </span>
                          </div>
                          <time className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                            {new Date(fb.createdAtIso).toLocaleString()}
                          </time>
                        </div>
                        <p className="text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                          {fb.message}
                        </p>
                        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          Applies to: {stageMeta.unlockSectionHint} · Consent {fb.consentId}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dedicated Compliance Readiness: Crossing Over Access Section */}
      <ComplianceCrossingSection
        viewMode={vaultViewMode}
        onChangeViewMode={onChangeVaultViewMode}
        vault={vault}
        onUpdateVault={onUpdateVault}
        primaryDomain={passport?.studioDomain ?? capabilities[0]?.domain ?? 'Green Energy'}
        profile={profile}
        capabilities={capabilities}
        passport={passport}
        defaultSprintTitle={topMatchedBrief.title}
        defaultPayoutUsd={topMatchedBrief.payoutUsd}
        onStartTour={() => setTourOpen(true)}
      />

      {/* Curated Paid Problem-Solving Briefs Section */}
      <div className="space-y-6">
        <div className="border-b border-[#E8E3DB] dark:border-[#2C3037] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
              {t.unlockHeading}
            </h2>
            <p className="mt-1.5 text-sm text-[#575B62] dark:text-[#A3A7AE] max-w-2xl">
              {t.unlockLead}
            </p>
          </div>

          <p className="text-xs font-mono-tabular tabular-nums text-[#146C53] dark:text-[#2EB88B] font-medium whitespace-nowrap">
            {qualifiedCount} of {rankedBriefs.length} qualified briefs
          </p>
        </div>

        {/* Filter & Voice Search */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
            <div className="lg:col-span-5">
              <VoiceInput
                id="unlock-search-input"
                type="search"
                label={t.searchBriefsLabel}
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t.searchBriefsPlaceholder}
                speechLang={speechLang}
                t={t}
                maxLength={100}
              />
            </div>

            <div className="lg:col-span-7 space-y-2">
              <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                Complexity Level
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by complexity">
                <button
                  type="button"
                  onClick={() => setComplexityFilter('ALL')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    complexityFilter === 'ALL'
                      ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                      : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  All Levels
                </button>
                {BRIEF_COMPLEXITIES.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setComplexityFilter(level)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      complexityFilter === level
                        ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skill Category Filters */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by skill category">
            <button
              type="button"
              onClick={() => setDomainFilter('ALL')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                domainFilter === 'ALL'
                  ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                  : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              {t.filterAllDomains}
            </button>
            {PRACTICE_DOMAINS.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setDomainFilter(domain)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                  domainFilter === domain
                    ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                    : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Brief Cards Grid */}
        {rankedBriefs.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-8 text-center space-y-3">
            <p className="text-sm text-[#575B62] dark:text-[#A3A7AE]">
              No briefs match your current category and complexity filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDomainFilter('ALL');
                setComplexityFilter('ALL');
              }}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rankedBriefs.map((brief) => {
              const existingSubmission = contributions.find((c) => c.briefId === brief.id);
              const isCompleted = existingSubmission?.status === 'completed';
              const isInProgress = existingSubmission?.status === 'in-progress';

              return (
                <article
                  key={brief.id}
                  className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Clean unboxed metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      <div>
                        <span>{brief.domain}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{brief.complexity}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{brief.organization}</span>
                      </div>
                      <span className="tabular-nums font-mono-tabular font-medium text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap">
                        {brief.matchScore}% {t.matchSuffix}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-medium mt-2.5 text-[#17191C] dark:text-[#F4F2EE]">
                      {brief.title}
                    </h3>

                    <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      {brief.locationLabel}
                      <span aria-hidden="true"> · </span>
                      <span
                        className={
                          brief.qualified
                            ? 'text-[#146C53] dark:text-[#2EB88B] font-medium'
                            : 'text-[#C4622D] dark:text-[#E07B46] font-medium'
                        }
                      >
                        {brief.qualified ? 'Qualified to Solve' : 'Verify Domain for Priority'}
                      </span>
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
                      {brief.summary}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037]">
                      <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {t.deliverablesHeading}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        {brief.deliverableChecklist.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span aria-hidden="true">—</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between gap-4">
                    <div className="tabular-nums">
                      <span className="text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        ${brief.payoutUsd}
                      </span>
                      <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        {' '}
                        · {brief.estimatedHours}h est.
                      </span>
                    </div>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.completedBadge}</span>
                      </span>
                    ) : isInProgress ? (
                      <button
                        type="button"
                        onClick={() => onOpenSolve(brief.id)}
                        className="min-h-[42px] px-4 py-2 rounded-lg bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <span>{t.openInSolveCta}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAcceptBrief(brief)}
                        className="min-h-[42px] px-5 py-2 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        {t.acceptBriefCta}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* How Vuka Works: Platform FAQs & Guide */}
      <PlatformFAQs variant="unlock" />

      {/* 1-Click Generate Compliant Sprint Agreement Modal */}
      <SprintAgreementModal
        isOpen={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        profile={profile}
        capabilities={capabilities}
        passport={passport}
        vault={vault}
        defaultSprintTitle={topMatchedBrief.title}
        defaultPayoutUsd={topMatchedBrief.payoutUsd}
      />

      {/* Interactive Step-by-Step Compliance Guided Tour Overlay */}
      <ComplianceGuidedTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onSwitchToPartnerView={() => onChangeVaultViewMode('partner')}
      />
    </section>
  );
};
