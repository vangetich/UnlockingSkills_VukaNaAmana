import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  FileCheck2,
  Globe,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type {
  BriefSubmission,
  CompetencyPassport,
  JobToFitUpskillingBridge,
  LivingProofPortfolio,
  LockedUpskillingBridgeRecord,
  MatchedWorkApplication,
  MatchedWorkMode,
  PractitionerProfile,
  RankedMatchedWorkOpportunity,
  UpskillingBridgePathOption,
  WorkReadyVault,
} from '../types/kora';
import {
  buildPreseededUpskillingBridge,
  countWorkplaceSignals,
  filterMatchedWorkOpportunities,
  getFinancialPayoutRailLabel,
  getSkillTrackOption,
  rankMatchedWorkOpportunities,
} from '../utils/talentEngine';
import { WovenBridgeArcsMotif } from './ResilienceMotifs';

interface MatchedWorkSectionProps {
  profile: PractitionerProfile;
  passport: CompetencyPassport | null;
  vault?: WorkReadyVault;
  portfolio: LivingProofPortfolio;
  contributions: BriefSubmission[];
  applications: MatchedWorkApplication[];
  lockedBridges: LockedUpskillingBridgeRecord[];
  onApplyWithLivingProof: (opportunity: RankedMatchedWorkOpportunity) => void;
  onStartUpskillingBridge: (params: {
    opportunity: RankedMatchedWorkOpportunity;
    selectedOption: UpskillingBridgePathOption;
    bridge: JobToFitUpskillingBridge;
  }) => void;
  onGoToUnlock: () => void;
  onGoToPulse?: () => void;
}

const WORK_MODE_FILTERS: Array<{ id: MatchedWorkMode; label: string }> = [
  { id: 'all', label: 'All Matches' },
  { id: 'local', label: 'Local Hands-On Roles' },
  { id: 'remote', label: 'Remote & Global Roles' },
  { id: 'fellowship', label: 'Paid Fellowships / Returnships' },
];

export const MatchedWorkSection: React.FC<MatchedWorkSectionProps> = ({
  profile,
  passport,
  vault,
  portfolio,
  contributions,
  applications,
  lockedBridges,
  onApplyWithLivingProof,
  onStartUpskillingBridge,
  onGoToUnlock,
  onGoToPulse,
}) => {
  const [workModeFilter, setWorkModeFilter] = useState<MatchedWorkMode>('all');
  const [previewOpportunity, setPreviewOpportunity] =
    useState<RankedMatchedWorkOpportunity | null>(null);
  const [recentAppliedTitle, setRecentAppliedTitle] = useState<string | null>(null);
  const [recentLockedBridge, setRecentLockedBridge] = useState<{
    opportunityTitle: string;
    missingSkillTitle: string;
    optionLabel: string;
  } | null>(null);

  // Track which opportunity cards have their "Job-to-Fit Upskilling Bridge" drawer open,
  // which option ('micro-bridge' vs 'apprenticeship-pod') is selected per card,
  // and any AI-tailored bridge overrides returned from /api/solve/upskilling-bridge
  const [expandedBridgeByOpp, setExpandedBridgeByOpp] = useState<Record<string, boolean>>({});
  const [selectedOptionByOpp, setSelectedOptionByOpp] = useState<
    Record<string, UpskillingBridgePathOption>
  >({});
  const [aiBridgeByOpp, setAiBridgeByOpp] = useState<
    Record<string, JobToFitUpskillingBridge>
  >({});
  const [loadingAiBridgeByOpp, setLoadingAiBridgeByOpp] = useState<Record<string, boolean>>({});

  const rankedOpportunities = useMemo(
    () =>
      rankMatchedWorkOpportunities({
        portfolio,
        profile,
        passport,
        vault,
      }),
    [portfolio, profile, passport, vault]
  );

  const visibleOpportunities = useMemo(
    () => filterMatchedWorkOpportunities(rankedOpportunities, workModeFilter),
    [rankedOpportunities, workModeFilter]
  );

  const appliedIds = useMemo(() => {
    const ids = new Set<string>(vault?.appliedOpportunityIds ?? []);
    for (const app of applications) {
      ids.add(app.opportunityId);
    }
    return ids;
  }, [vault?.appliedOpportunityIds, applications]);

  const lockedBridgeMap = useMemo(() => {
    const map = new Map<string, LockedUpskillingBridgeRecord>();
    for (const rec of lockedBridges) {
      map.set(rec.opportunityId, rec);
    }
    return map;
  }, [lockedBridges]);

  const lockedBridgeIds = useMemo(() => {
    const ids = new Set<string>(vault?.lockedBridgeOpportunityIds ?? []);
    for (const rec of lockedBridges) {
      ids.add(rec.opportunityId);
    }
    return ids;
  }, [vault?.lockedBridgeOpportunityIds, lockedBridges]);

  const completedSprintsCount = useMemo(
    () => contributions.filter((c) => c.status === 'completed').length,
    [contributions]
  );

  const hasProofCard = Boolean(portfolio.analysis);
  const workplaceSignalCount = countWorkplaceSignals(portfolio.workplaceSignals);
  const selectedTrack = getSkillTrackOption(portfolio.skillTrackId);
  const preCleared = rankedOpportunities[0]?.preClearedToContract ?? false;

  const isBridgeDrawerOpen = (opp: RankedMatchedWorkOpportunity): boolean => {
    if (typeof expandedBridgeByOpp[opp.id] === 'boolean') {
      return expandedBridgeByOpp[opp.id];
    }
    // Open automatically for 65%–90% fit cards so participants see an encouraging "Close the Final Gap" section instead of rejection
    return opp.isUpskillingBridgeFit;
  };

  const toggleBridgeDrawer = (opp: RankedMatchedWorkOpportunity) => {
    const current = isBridgeDrawerOpen(opp);
    setExpandedBridgeByOpp((prev) => ({
      ...prev,
      [opp.id]: !current,
    }));
  };

  const getActiveBridgeForOpportunity = (
    opp: RankedMatchedWorkOpportunity
  ): JobToFitUpskillingBridge => {
    return (
      aiBridgeByOpp[opp.id] ??
      buildPreseededUpskillingBridge({
        opportunity: opp,
        portfolio,
        profile,
        passport,
      })
    );
  };

  const handleAnalyzeDeltaWithAi = async (opp: RankedMatchedWorkOpportunity) => {
    if (loadingAiBridgeByOpp[opp.id]) return;
    setLoadingAiBridgeByOpp((prev) => ({ ...prev, [opp.id]: true }));
    try {
      const response = await fetch('/api/solve/upskilling-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opp.id,
          opportunityTitle: opp.title,
          partnerOrg: opp.partnerOrg,
          workMode: opp.workMode,
          scopeSummary: opp.scopeSummary,
          whyEmployersNeedThisNow: opp.whyEmployersNeedThisNow,
          payoutUsd: opp.payoutUsd,
          skillTrackLabel: selectedTrack.title,
          ageStage: profile.ageStage,
          problemStatement: profile.problemStatement,
          passportSkills: passport?.verifiedSkills.map((s) => s.name) ?? [],
          proofHighlights: portfolio.analysis?.visualHighlights ?? [],
          problemSolvedCaption: portfolio.problemSolvedCaption,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { bridge?: JobToFitUpskillingBridge };
        if (data.bridge) {
          setAiBridgeByOpp((prev) => ({
            ...prev,
            [opp.id]: data.bridge!,
          }));
        }
      }
    } catch {
      // Pre-seeded UNESCO UQP / ILO RPL fallback remains active
    } finally {
      setLoadingAiBridgeByOpp((prev) => ({ ...prev, [opp.id]: false }));
    }
  };

  const handleLockBridgeSpot = (opp: RankedMatchedWorkOpportunity) => {
    const bridge = getActiveBridgeForOpportunity(opp);
    const selectedOption: UpskillingBridgePathOption =
      selectedOptionByOpp[opp.id] ?? 'micro-bridge';

    onStartUpskillingBridge({
      opportunity: opp,
      selectedOption,
      bridge,
    });

    setRecentLockedBridge({
      opportunityTitle: opp.title,
      missingSkillTitle: bridge.singleMissingBridge.skillTitle,
      optionLabel:
        selectedOption === 'micro-bridge'
          ? 'Option A — Targeted Micro-Bridge'
          : 'Option B — ILO Upgraded Apprenticeship Pod',
    });
  };

  const handleConfirmApply = () => {
    if (!previewOpportunity) return;
    onApplyWithLivingProof(previewOpportunity);
    setRecentAppliedTitle(previewOpportunity.title);
    setPreviewOpportunity(null);
  };

  return (
    <section
      id="matched-work-section"
      aria-labelledby="matched-work-heading"
      data-testid="matched-work-section"
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6"
    >
      <WovenBridgeArcsMotif />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
            Module 2 · Cross-Age Solution Flows · SDGs 4, 8, 10 &amp; 17
          </p>
          <h2
            id="matched-work-heading"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
          >
            Matched Work &amp; Cross-Age Solution Flows
          </h2>
          <p className="mt-2 text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
            Connect your uploaded Living Proof Portfolio and Tab 2 Compliance Badge directly to scoped local and remote work—with built-in UNESCO UQP &amp; ILO RPL upskilling bridges for 65%–90% fit roles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {preCleared ? (
            <span
              data-testid="matched-work-precleared-shield"
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/35 dark:border-[#2EB88B]/40 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Pre-Cleared to Contract &amp; Pay</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onGoToUnlock}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/30 dark:border-[#E07B46]/35 text-xs font-semibold text-[#C4622D] dark:text-[#E07B46] inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Clear Tab 2 Compliance Shield</span>
            </button>
          )}
        </div>
      </div>

      {/* Work-Mode Filter Bar */}
      <div
        role="tablist"
        aria-label="Filter matched work by mode"
        data-testid="matched-work-filter-bar"
        className="relative z-10 flex flex-wrap items-center gap-2"
      >
        {WORK_MODE_FILTERS.map((filter) => {
          const active = workModeFilter === filter.id;
          const count = filterMatchedWorkOpportunities(rankedOpportunities, filter.id).length;
          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`matched-work-filter-${filter.id}`}
              onClick={() => setWorkModeFilter(filter.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                  : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              <span>{filter.label}</span>
              <span className="font-mono-tabular tabular-nums text-[11px] opacity-80">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Upskilling Bridge Confirmation Strip */}
      {recentLockedBridge && (
        <div
          role="status"
          data-testid="upskilling-bridge-locked-banner"
          className="relative z-10 rounded-xl bg-[#E7F3EE]/85 dark:bg-[#142B24]/90 border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE]">
            <CheckCircle2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Bridge Started &amp; Spot Locked: {recentLockedBridge.missingSkillTitle} ({recentLockedBridge.optionLabel})
              </p>
              <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                Reserved for {recentLockedBridge.opportunityTitle} · SDG 4 (Target 4.4 — Skills Verified) &amp; SDG 10 (Target 10.2 — Cross-Age Equity) incremented live in Pulse.
              </p>
            </div>
          </div>
          {onGoToPulse && (
            <button
              type="button"
              data-testid="bridge-locked-view-pulse-btn"
              onClick={onGoToPulse}
              className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 whitespace-nowrap"
            >
              <span>View SDG 4 &amp; 10 Pulse</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          )}
        </div>
      )}

      {/* Live Application Confirmation Strip */}
      {recentAppliedTitle && (
        <div
          role="status"
          data-testid="matched-work-applied-banner"
          className="relative z-10 rounded-xl bg-[#E7F3EE]/85 dark:bg-[#142B24]/90 border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE]">
            <CheckCircle2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Living Proof Bundle Sent: {recentAppliedTitle}
              </p>
              <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                Escrow pod opened &amp; SDG 8 (Work Unlocked) + SDG 17 (Partner Matches) incremented live in Pulse.
              </p>
            </div>
          </div>
          {onGoToPulse && (
            <button
              type="button"
              onClick={onGoToPulse}
              className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 whitespace-nowrap"
            >
              <span>View Pulse Impact</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          )}
        </div>
      )}

      {/* Curated Opportunity Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleOpportunities.map((opp) => {
          const isApplied = appliedIds.has(opp.id);
          const isBridgeLocked = lockedBridgeIds.has(opp.id);
          const lockedRecord = lockedBridgeMap.get(opp.id);
          const bridge = getActiveBridgeForOpportunity(opp);
          const drawerOpen = isBridgeDrawerOpen(opp);
          const selectedOption: UpskillingBridgePathOption =
            lockedRecord?.selectedOption ??
            selectedOptionByOpp[opp.id] ??
            'micro-bridge';
          const isAiLoading = Boolean(loadingAiBridgeByOpp[opp.id]);

          return (
            <article
              key={opp.id}
              data-testid={`matched-work-card-${opp.id}`}
              className={`rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border p-5 flex flex-col justify-between gap-4 transition-colors ${
                opp.isStrongFit
                  ? 'border-[#146C53]/45 dark:border-[#2EB88B]/45'
                  : 'border-[#E8E3DB] dark:border-[#2C3037]'
              }`}
            >
              <div className="space-y-3.5">
                {/* Top Status Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]">
                      {opp.workMode === 'local' ? (
                        <MapPin className="w-3 h-3 text-[#C4622D] dark:text-[#E07B46]" />
                      ) : (
                        <Globe className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B]" />
                      )}
                      <span>{opp.workMode === 'local' ? 'Local Role' : 'Remote Role'}</span>
                    </span>

                    {opp.fellowshipEligible && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/25 text-[#C4622D] dark:text-[#E07B46]">
                        <Award className="w-3 h-3" />
                        <span>Fellowship / Returnship</span>
                      </span>
                    )}
                  </div>

                  <span className="font-mono-tabular tabular-nums text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                    {opp.matchScore}% Proof Match
                  </span>
                </div>

                {/* Fit Status Pill: Strong Fit vs 65%–90% Close the Final Gap Pill */}
                <div className="flex flex-wrap items-center gap-2">
                  {opp.isStrongFit && (
                    <div
                      data-testid={`strong-fit-pill-${opp.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{opp.fitReasonLabel}</span>
                    </div>
                  )}

                  {opp.isUpskillingBridgeFit && (
                    <span
                      data-testid={`close-final-gap-pill-${opp.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/30 dark:border-[#E07B46]/35 text-[11px] font-semibold text-[#C4622D] dark:text-[#E07B46]"
                    >
                      <Compass className="w-3.5 h-3.5 shrink-0" />
                      <span>Close the Final Gap ({opp.matchScore}% Fit · 65%–90% Bridge)</span>
                    </span>
                  )}
                </div>

                {/* Title & Meta */}
                <div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    {opp.partnerOrg} · {opp.partnerLocation}
                  </p>
                  <h3 className="mt-1 font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                    {opp.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    {opp.scopeSummary}
                  </p>
                </div>

                {/* 1-Line Why Employers Need This Now */}
                <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C4622D] dark:text-[#E07B46]">
                    Why Employers Need This Now
                  </p>
                  <p className="mt-0.5 text-xs text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                    {opp.whyEmployersNeedThisNow}
                  </p>
                </div>

                {/* Cross-Age Pod Badge */}
                <div
                  data-testid={`cross-age-pod-badge-${opp.id}`}
                  className="rounded-xl bg-white/80 dark:bg-[#1A1C20]/80 border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                      <span>Cross-Age Pod Pairing</span>
                    </span>
                    <span className="text-[#146C53] dark:text-[#2EB88B]">
                      {opp.userPodSeat === 'lead' ? 'Your Seat: QA Lead' : 'Your Seat: Delivery Builder'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                    {opp.podLeadRole} + {opp.podDeliveryRole}
                  </p>
                </div>

                {/* Job-to-Fit Upskilling Bridge Drawer / Card (UNESCO UQP & ILO RPL) */}
                <div
                  data-testid={`upskilling-bridge-card-${opp.id}`}
                  className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 overflow-hidden"
                >
                  {/* Drawer Header / Toggle */}
                  <div className="px-3.5 py-2.5 bg-[#E7F3EE]/55 dark:bg-[#142B24]/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      data-testid={`toggle-upskilling-bridge-${opp.id}`}
                      aria-expanded={drawerOpen}
                      onClick={() => toggleBridgeDrawer(opp)}
                      className="flex-1 text-left flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                          Job-to-Fit Upskilling Bridge · UNESCO UQP &amp; ILO RPL
                        </p>
                        <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] truncate">
                          Close the Final Gap: {bridge.singleMissingBridge.skillTitle}
                        </p>
                      </div>
                      <span className="p-1 rounded-lg text-[#146C53] dark:text-[#2EB88B] shrink-0">
                        {drawerOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </button>
                  </div>

                  {drawerOpen && (
                    <div
                      data-testid={`upskilling-bridge-body-${opp.id}`}
                      className="p-3.5 space-y-3.5 border-t border-[#E8E3DB] dark:border-[#2C3037]"
                    >
                      {/* Top AI Delta Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                          {bridge.singleMissingBridge.frameworkTag}
                          {bridge.source === 'ai' ? ' · Gemini AI Tailored' : ''}
                        </span>
                        <button
                          type="button"
                          data-testid={`ai-delta-btn-${opp.id}`}
                          disabled={isAiLoading}
                          onClick={() => void handleAnalyzeDeltaWithAi(opp)}
                          className="min-h-[28px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 hover:border-[#146C53]/50 transition-colors disabled:opacity-60"
                        >
                          <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                          <span>
                            {isAiLoading ? 'Comparing Proof...' : 'AI Skill-to-Job Delta'}
                          </span>
                        </button>
                      </div>

                      {/* 1. Exact Skill-to-Job Delta */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {/* What You Already Prove (2 verified strengths in Amana Emerald #146C53) */}
                        <div
                          data-testid={`bridge-already-prove-${opp.id}`}
                          className="rounded-xl bg-[#E7F3EE]/60 dark:bg-[#142B24]/65 border border-[#146C53]/25 dark:border-[#2EB88B]/30 p-3 space-y-1.5"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
                            What You Already Prove (2 Verified Strengths)
                          </p>
                          <ul className="space-y-1">
                            {bridge.whatYouAlreadyProve.map((strength, sIdx) => (
                              <li
                                key={sIdx}
                                className="flex items-start gap-1.5 text-xs font-medium text-[#146C53] dark:text-[#2EB88B]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* The Single Missing Bridge */}
                        <div
                          data-testid={`bridge-single-missing-${opp.id}`}
                          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#C4622D]/30 dark:border-[#E07B46]/35 p-3 space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C4622D] dark:text-[#E07B46]">
                              The Single Missing Bridge
                            </p>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46]">
                              1 Concrete Practical Skill
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            {bridge.singleMissingBridge.skillTitle}
                          </p>
                          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                            {bridge.singleMissingBridge.practicalWhy}
                          </p>
                        </div>
                      </div>

                      {/* 2. Actionable Upskilling Path (2 Clean Options) */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
                          Actionable Upskilling Path (Choose 1 Option)
                        </p>

                        <div className="grid grid-cols-1 gap-2">
                          {/* Option A — Targeted Micro-Bridge */}
                          <button
                            type="button"
                            data-testid={`bridge-option-micro-${opp.id}`}
                            aria-pressed={selectedOption === 'micro-bridge'}
                            onClick={() =>
                              setSelectedOptionByOpp((prev) => ({
                                ...prev,
                                [opp.id]: 'micro-bridge',
                              }))
                            }
                            className={`text-left rounded-xl p-3 border transition-colors space-y-1.5 ${
                              selectedOption === 'micro-bridge'
                                ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border-[#146C53] dark:border-[#2EB88B]'
                                : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53]/40'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                [Option A — Targeted Micro-Bridge]
                              </span>
                              <span
                                data-testid={`stipend-eligible-pill-${opp.id}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E7F3EE] dark:bg-[#1A372E] border border-[#146C53]/30 text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B]"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{bridge.optionAMicroBridge.stipendPillLabel}</span>
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]">
                              {bridge.optionAMicroBridge.title} ·{' '}
                              <span className="text-[#146C53] dark:text-[#2EB88B]">
                                {bridge.optionAMicroBridge.durationLabel}
                              </span>
                            </p>
                            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                              {bridge.optionAMicroBridge.actionSummary}
                            </p>
                            <p className="text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B]">
                              {bridge.optionAMicroBridge.stipendCovers}
                            </p>
                          </button>

                          {/* Option B — ILO Upgraded Apprenticeship Pod */}
                          <button
                            type="button"
                            data-testid={`bridge-option-apprenticeship-${opp.id}`}
                            aria-pressed={selectedOption === 'apprenticeship-pod'}
                            onClick={() =>
                              setSelectedOptionByOpp((prev) => ({
                                ...prev,
                                [opp.id]: 'apprenticeship-pod',
                              }))
                            }
                            className={`text-left rounded-xl p-3 border transition-colors space-y-1.5 ${
                              selectedOption === 'apprenticeship-pod'
                                ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border-[#146C53] dark:border-[#2EB88B]'
                                : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53]/40'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                [Option B — ILO Upgraded Apprenticeship Pod]
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/30 text-[10px] font-semibold text-[#C4622D] dark:text-[#E07B46]">
                                <span>Paid Apprentice Builder · ${bridge.optionBApprenticeshipPod.paidApprenticeStipendUsd}</span>
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]">
                              {bridge.optionBApprenticeshipPod.mentorPairingLabel}
                            </p>
                            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                              {bridge.optionBApprenticeshipPod.cohesionNote}
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* 3. One-Click "Start Bridge & Lock Spot ->" Button */}
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          Increments SDG 4 (Target 4.4) &amp; SDG 10 (Target 10.2)
                        </span>

                        {isBridgeLocked ? (
                          <span
                            data-testid={`bridge-spot-locked-badge-${opp.id}`}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/35 dark:border-[#2EB88B]/40 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Bridge Started &amp; Spot Locked (
                              {selectedOption === 'micro-bridge' ? 'Option A' : 'Option B'})
                            </span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            data-testid={`start-bridge-lock-spot-btn-${opp.id}`}
                            onClick={() => handleLockBridgeSpot(opp)}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            <span>Start Bridge &amp; Lock Spot -&gt;</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-Cleared to Contract & Pay Shield */}
                {opp.preClearedToContract && (
                  <div
                    data-testid={`card-precleared-${opp.id}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Pre-Cleared to Contract &amp; Pay</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3.5 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono-tabular tabular-nums">
                  <span className="text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    ${opp.payoutUsd}
                  </span>
                  <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    {' '}
                    · {opp.estimatedHours}h · {opp.durationLabel.split('·')[0].trim()}
                  </span>
                </div>

                {isApplied ? (
                  <span
                    data-testid={`applied-badge-${opp.id}`}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Applied with Living Proof</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    data-testid={`apply-with-proof-btn-${opp.id}`}
                    onClick={() => setPreviewOpportunity(opp)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <span>Apply with Living Proof</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Calm 3-Part Bundle Confirmation Modal */}
      {previewOpportunity && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-bundle-modal-title"
          data-testid="apply-living-proof-modal"
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/55 backdrop-blur-xs p-4 sm:p-6 pt-16 sm:pt-20 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden my-4 sm:my-auto"
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#15171B] shrink-0">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Direct Living Proof Bundle · Zero Cold HR Portal</span>
                </p>
                <h3
                  id="apply-bundle-modal-title"
                  className="mt-1 font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  {previewOpportunity.title}
                </h3>
                <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  {previewOpportunity.partnerOrg} · ${previewOpportunity.payoutUsd} Milestone Escrow
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpportunity(null)}
                aria-label="Close application bundle preview"
                className="min-h-[36px] min-w-[36px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar">
              {/* Visual Progression Pathway */}
              <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
                  Crossing Pathway Progression
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div
                    className={`rounded-lg px-3 py-2 border ${
                      completedSprintsCount >= 2
                        ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border-[#146C53]/35 text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-[#FAF8F5] dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]'
                    }`}
                  >
                    <p className="font-semibold">1. Complete 2 Paid Sprints</p>
                    <p className="text-[11px] opacity-80 font-mono-tabular">
                      {Math.min(2, completedSprintsCount)}/2 complete
                    </p>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 border ${
                      completedSprintsCount >= 1 || hasProofCard
                        ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border-[#146C53]/35 text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-[#FAF8F5] dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]'
                    }`}
                  >
                    <p className="font-semibold">2. Verified Local/Remote Track Record</p>
                    <p className="text-[11px] opacity-80">
                      {hasProofCard ? 'Proof Card attached' : 'Evidence ready'}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 border ${
                      completedSprintsCount >= 2
                        ? 'bg-[#E7F3EE]/90 dark:bg-[#142B24] border-[#146C53] text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-[#FAF8F5] dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                    }`}
                  >
                    <p className="font-semibold">3. Direct Hiring Partner Intro &amp; Paid Fellowship</p>
                    <p className="text-[11px] opacity-80">
                      {completedSprintsCount >= 2 ? 'Unlocked' : 'Opens after 2 sprints'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exact 3-Part Bundle Preview */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  Exact 3-Part Bundle Sent to {previewOpportunity.partnerOrg}:
                </p>

                <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 flex items-start gap-3">
                  <FileCheck2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      1. Living Competency Passport
                    </p>
                    <p className="mt-0.5 text-[#575B62] dark:text-[#A3A7AE]">
                      {passport
                        ? `${passport.studioDomain} Passport · ${passport.fieldMatch} (${passport.verifiedSkills.length} verified skills)`
                        : `${profile.ageStage} Track Practitioner Profile · ${profile.problemStatement.slice(0, 90)}`}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      2. Uploaded Photo Proof &amp; Workplace Readiness Card
                    </p>
                    <p className="mt-0.5 text-[#575B62] dark:text-[#A3A7AE]">
                      {portfolio.analysis
                        ? `${selectedTrack.title} · ${portfolio.analysis.localReadinessPct}% Local · ${portfolio.analysis.remoteReadinessPct}% Remote · ${workplaceSignalCount}/3 readiness habits`
                        : `${selectedTrack.title} · ${portfolio.images.length} proof sample(s) · ${workplaceSignalCount}/3 readiness habits`}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      3. Cleared Compliance Dossier
                    </p>
                    <p className="mt-0.5 text-[#575B62] dark:text-[#A3A7AE]">
                      {previewOpportunity.preClearedToContract
                        ? `Pre-Cleared · Payout Rail: ${getFinancialPayoutRailLabel(vault?.financialRail ?? vault?.payoutRail ?? 'mobile-money')} · Host: ${vault?.onboardingHostCountry || 'Kenya'}`
                        : 'Pending Tab 2 Compliance Sign-Off (you can still send Proof & clear payout rails anytime).'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
                <button
                  type="button"
                  onClick={() => setPreviewOpportunity(null)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#121315] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="confirm-apply-living-proof-btn"
                  onClick={handleConfirmApply}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <span>Confirm &amp; Send Living Proof Bundle</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};
