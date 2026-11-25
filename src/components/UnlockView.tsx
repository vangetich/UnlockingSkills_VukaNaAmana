import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileCheck2,
  FileText,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';
import type {
  AuthPathwayOption,
  BriefComplexity,
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  ContractTemplateOption,
  PayoutRailOption,
  PeerEndorsement,
  PractitionerProfile,
  ProblemBrief,
  SkillCapability,
  UnlockViewMode,
  WorkReadyVault,
} from '../types/kora';
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
  onAdvancePayout: (payoutId: string) => void;
  onRequestEndorsement: (input: {
    collaboratorName: string;
    collaboratorRole: string;
    organization: string;
    capabilityTitle: string;
    endorsementText?: string;
    sourceTab: 'verify' | 'unlock';
  }) => PeerEndorsement;
  onCompleteEndorsement: (endorsementId: string, endorsementText: string) => void;
  onDeleteEndorsement: (endorsementId: string) => void;
  onAcceptBrief: (brief: ProblemBrief) => void;
  onOpenSolve: (briefId: string) => void;
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
  onAdvancePayout,
  onRequestEndorsement,
  onCompleteEndorsement,
  onDeleteEndorsement,
  onAcceptBrief,
  onOpenSolve,
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
                  aria-selected={vaultViewMode === 'partner'}
                  onClick={() => onChangeVaultViewMode('partner')}
                  className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    vaultViewMode === 'partner'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#2EB88B] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hiring Partner View</span>
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
                    {readiness.completedCount}/{readiness.totalCount} Verified Ready
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
                    <span>Preview Hiring Partner Compliance Card</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                ) : (
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Complete all 3 steps to unlock instant partner contracting.
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
                              <span>Verified Ready</span>
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
                                {item.completed ? 'Mark Needs Review' : 'Confirm Verified Ready'}
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
            /* VIEW B: HIRING PARTNER VIEW — Compliance Card + Payout Status + Peer Endorsement Link Request */
            <div role="tabpanel" aria-label="Hiring Partner Zero-Friction Compliance Card" className="space-y-6">
              <article className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                      Zero-Friction Compliance Card
                    </p>
                    <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      {profile.displayName || 'Skilled Practitioner'}
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
                      Track {profile.ageStage} · {verifiedSkillsCount} confirmed capability record(s)
                      {passport ? ` · Living Competency Passport Verified` : ''}
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
                        ? 'Pre-Cleared · Ready to Contract'
                        : `${readiness.completedCount}/3 Readiness Steps Complete`}
                    </span>
                  </span>
                </div>

                {/* 3 Verified Compliance Pillars */}
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
                        <span>{vault.identityCompleted ? 'Verified' : 'Pending'}</span>
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
                        <span>{vault.contractCompleted ? 'Verified' : 'Pending'}</span>
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
                        <span>{vault.payoutCompleted ? 'Verified' : 'Pending'}</span>
                      </span>
                    </dt>
                    <dd className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {getPayoutRailLabel(vault.payoutRail)}
                    </dd>
                  </div>
                </dl>

                {/* Single Primary Action + Calm Secondary Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] max-w-xl leading-relaxed">
                    Contract directly on milestone deliverables with plain-language IP protection and fast compliant settlement—no HR bottlenecks.
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
                      <span>Generate Compliant Sprint Agreement</span>
                    </button>
                  </div>
                </div>
              </article>

              {/* Contract Payment Lifecycle Tracker: Escrow Held -> Processing -> Released */}
              <PayoutStatusCard
                payouts={payouts}
                onAdvancePayout={onAdvancePayout}
              />

              {/* Payout Transaction Ledger with Compliant PDF Receipt Downloads */}
              <PayoutTransactionLedger
                payouts={payouts}
                practitionerName={profile.displayName || 'Skilled Practitioner'}
                vault={vault}
              />

              {/* Hiring Partner Zero-Document Peer Endorsement Link Request */}
              <PeerEndorsementPanel
                variant="partner"
                endorsements={endorsements}
                capabilities={capabilities}
                passport={passport}
                speechLang={speechLang}
                t={t}
                onRequestEndorsement={onRequestEndorsement}
                onCompleteEndorsement={onCompleteEndorsement}
                onDeleteEndorsement={onDeleteEndorsement}
              />
            </div>
          )}
        </div>
      </div>

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
