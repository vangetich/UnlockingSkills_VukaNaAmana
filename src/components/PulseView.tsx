import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  RefreshCw,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';
import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  ContributionStatus,
  PeerEndorsement,
  PractitionerProfile,
  SkillCapability,
  WorkReadyVault,
} from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';
import {
  SEED_BRIEFS,
  buildLedgerCsv,
  computeAnalyticsSummary,
  computeKnowledgeToWorkFlow,
  computeSdgPulseMetrics,
  computeSprintPerformanceSeries,
  filterAndRankBriefs,
} from '../utils/talentEngine';
import { Badges } from './Badges';
import { RippleConstellationMotif, WovenBridgeArcsMotif } from './ResilienceMotifs';
import { SprintPerformanceWidget } from './SprintPerformanceWidget';

interface PulseViewProps {
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
  vault: WorkReadyVault;
  endorsements: PeerEndorsement[];
  payouts: ContractPayout[];
  celebratedContribution: BriefSubmission | null;
  recentOnlineSync?: { syncedCount: number; timestampIso: string } | null;
  userEmail: string | null;
  lastSyncedIso: string | null;
  queuedCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  t: TranslationDictionary;
  onDismissCelebration: () => void;
  onDismissOnlineSyncToast?: () => void;
  onSignIn: () => void;
  onSyncNow: () => void;
  onGoToUnlock: () => void;
  onGoToVerify: () => void;
  onGoToSolve: () => void;
}

export const PulseView: React.FC<PulseViewProps> = ({
  profile,
  capabilities,
  contributions,
  passport,
  vault,
  endorsements,
  payouts,
  celebratedContribution,
  recentOnlineSync = null,
  userEmail,
  lastSyncedIso,
  queuedCount,
  isOnline,
  isSyncing,
  t,
  onDismissCelebration,
  onDismissOnlineSyncToast,
  onSignIn,
  onSyncNow,
  onGoToUnlock,
  onGoToVerify,
  onGoToSolve,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [liveCompleted, setLiveCompleted] = useState<BriefSubmission | null>(null);
  const [localSyncToast, setLocalSyncToast] = useState<{
    syncedCount: number;
    timestampIso: string;
  } | null>(null);
  const previousStatusRef = useRef<Map<string, ContributionStatus>>(
    new Map(contributions.map((c) => [c.id, c.status]))
  );
  const prevOnlineRef = useRef<boolean>(isOnline);
  const offlineQueuedCountRef = useRef<number>(queuedCount);

  useEffect(() => {
    if (!isOnline) {
      offlineQueuedCountRef.current = Math.max(offlineQueuedCountRef.current, queuedCount);
    }
  }, [isOnline, queuedCount]);

  // Detect offline -> online transition while mounted on Pulse
  useEffect(() => {
    const wasOffline = prevOnlineRef.current === false;
    prevOnlineRef.current = isOnline;
    if (wasOffline && isOnline) {
      const syncedCount = offlineQueuedCountRef.current;
      offlineQueuedCountRef.current = 0;
      if (userEmail) {
        onSyncNow();
      }
      setLocalSyncToast({
        syncedCount,
        timestampIso: new Date().toISOString(),
      });
    }
  }, [isOnline, userEmail, onSyncNow]);

  const syncToast = localSyncToast ?? recentOnlineSync;

  const dismissSyncToast = () => {
    setLocalSyncToast(null);
    onDismissOnlineSyncToast?.();
  };

  useEffect(() => {
    if (!syncToast) return;
    const timer = window.setTimeout(() => {
      setLocalSyncToast(null);
      onDismissOnlineSyncToast?.();
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [syncToast, onDismissOnlineSyncToast]);

  // Detect live in-progress -> completed transitions while on Pulse
  useEffect(() => {
    const prevMap = previousStatusRef.current;
    let newlyFinished: BriefSubmission | null = null;
    for (const item of contributions) {
      if (prevMap.get(item.id) === 'in-progress' && item.status === 'completed') {
        newlyFinished = item;
      }
    }
    previousStatusRef.current = new Map(contributions.map((c) => [c.id, c.status]));
    if (newlyFinished) {
      setLiveCompleted(newlyFinished);
    }
  }, [contributions]);

  const activeCelebration = liveCompleted ?? celebratedContribution;

  const handleDismissCelebration = () => {
    setLiveCompleted(null);
    onDismissCelebration();
  };

  const reactiveInputs = useMemo(
    () => ({
      profile,
      capabilities,
      passport,
      endorsements,
      vault,
      payouts,
      contributions,
    }),
    [profile, capabilities, passport, endorsements, vault, payouts, contributions]
  );

  const sdgMetrics = useMemo(
    () => computeSdgPulseMetrics(reactiveInputs),
    [reactiveInputs]
  );

  const flowStages = useMemo(
    () => computeKnowledgeToWorkFlow(reactiveInputs),
    [reactiveInputs]
  );

  const sprintPerformance = useMemo(
    () => computeSprintPerformanceSeries(contributions, payouts),
    [contributions, payouts]
  );

  const analytics = useMemo(
    () => computeAnalyticsSummary(capabilities, contributions),
    [capabilities, contributions]
  );

  const visibleContributions = useMemo(() => {
    if (statusFilter === 'all') return contributions;
    return contributions.filter((c) => c.status === statusFilter);
  }, [contributions, statusFilter]);

  const nextOpportunities = useMemo(() => {
    const existingIds = new Set(contributions.map((c) => c.briefId));
    return filterAndRankBriefs(
      SEED_BRIEFS,
      '',
      'ALL',
      profile.problemStatement,
      profile.ageStage,
      capabilities,
      'ALL',
      passport
    )
      .filter((b) => !existingIds.has(b.id))
      .sort((a, b) => b.payoutUsd - a.payoutUsd)
      .slice(0, 2);
  }, [contributions, profile.problemStatement, profile.ageStage, capabilities, passport]);

  const handleExportCsv = () => {
    const csv = buildLedgerCsv(contributions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vuka-na-amana-contribution-ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="pulse-heading" className="space-y-10">
      {/* Executive Impact Header with Resilience Ripple Constellation Motif */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8">
        <RippleConstellationMotif />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
              Executive Impact Dashboard · Real-Time SDG Pulse
            </p>
            <h1
              id="pulse-heading"
              className="mt-1.5 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
            >
              Visible human momentum across every crossing
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
              Every verified capability in Verify, cleared compliance rail in Unlock, and delivered pod sprint in Solve updates these live economic impact counters immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onGoToSolve}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Join Next Sprint Pod</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportCsvCta}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Framer Motion Celebratory Micro-Interaction on In-Progress -> Completed */}
      <AnimatePresence>
        {activeCelebration && (
          <motion.div
            key={activeCelebration.id}
            role="status"
            aria-live="polite"
            data-testid="pulse-celebration-banner"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative overflow-hidden rounded-2xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-5 sm:p-6"
          >
            <motion.div
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'left' }}
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C4622D] via-[#146C53] to-[#2EB88B]"
            />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <motion.div
                  initial={{ scale: 0.7, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.08 }}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-[#10201B] border border-[#146C53]/30 dark:border-[#2EB88B]/35 flex items-center justify-center shrink-0"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-[#146C53] dark:text-[#2EB88B]"
                    fill="none"
                    aria-hidden="true"
                  >
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="9.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      initial={{ pathLength: 0, opacity: 0.4 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    <motion.path
                      d="M8 12.4l2.7 2.7 5.5-5.8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
                    />
                  </svg>
                </motion.div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#C4622D] dark:text-[#E07B46]" />
                    <span>Milestone Verified &amp; Added to Your Proof Ledger</span>
                  </div>
                  <h2 className="mt-1 font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    {activeCelebration.briefTitle}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#43484E] dark:text-[#C4C9D0]">
                    Transitioned from in-progress to completed ·{' '}
                    <span className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      +${activeCelebration.payoutUsd} USD
                    </span>{' '}
                    earned across {activeCelebration.hoursLogged}h of verified work.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissCelebration}
                aria-label="Dismiss milestone celebration"
                className="min-h-[34px] min-w-[34px] rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP ROW: 5 Clean SDG Pulse Cards (Minimalist Live Counters + Human Micro-Stories) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
              SDG Economic Momentum Pulse
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
              Live counters paired with real economic value unlocked across Tabs 1–3.
            </p>
          </div>
          <span className="text-xs font-mono-tabular tabular-nums text-[#146C53] dark:text-[#2EB88B] font-semibold">
            5 UN SDG Alignment Streams
          </span>
        </div>

        <div
          data-testid="sdg-pulse-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
          {sdgMetrics.map((metric) => {
            const isTerracotta = metric.accent === 'terracotta';
            return (
              <motion.article
                key={metric.sdgNumber}
                data-testid={`sdg-card-${metric.sdgNumber}`}
                layout
                className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular">
                    <span
                      className={`font-semibold uppercase tracking-[0.12em] ${
                        isTerracotta
                          ? 'text-[#C4622D] dark:text-[#E07B46]'
                          : 'text-[#146C53] dark:text-[#2EB88B]'
                      }`}
                    >
                      {metric.sdgLabel}
                    </span>
                    <span
                      data-testid={`sdg-delta-${metric.sdgNumber}`}
                      className="font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap"
                    >
                      {metric.liveDeltaLabel}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                    {metric.title}
                  </h3>

                  <div>
                    <motion.p
                      key={`${metric.sdgNumber}-${metric.numericValue}`}
                      data-testid={`sdg-value-${metric.sdgNumber}`}
                      initial={{ opacity: 0.7, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28 }}
                      className={`font-mono-tabular tabular-nums text-2xl sm:text-3xl font-semibold tracking-tight ${
                        isTerracotta
                          ? 'text-[#C4622D] dark:text-[#E07B46]'
                          : 'text-[#146C53] dark:text-[#2EB88B]'
                      }`}
                    >
                      {metric.primaryValue}
                    </motion.p>
                    <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      {metric.metricCaption}
                    </p>
                  </div>
                </div>

                <p className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] text-xs leading-relaxed text-[#43484E] dark:text-[#C4C9D0]">
                  {metric.microStory}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* SPRINT PERFORMANCE SPARKLINE WIDGET */}
      <SprintPerformanceWidget data={sprintPerformance} />

      {/* BOTTOM ROW: Visual "Knowledge-to-Work Flow" Diagram */}
      <section
        aria-labelledby="knowledge-flow-heading"
        data-testid="knowledge-to-work-flow"
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6"
      >
        <WovenBridgeArcsMotif />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
              Knowledge-to-Work Flow · Live Conversion Funnel
            </p>
            <h2
              id="knowledge-flow-heading"
              className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Paperless Intake → Verified Passport → Compliant Payout → Paid Placement
            </h2>
          </div>
          <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Updates live as milestones clear across Tabs 1–3
          </span>
        </div>

        <ol className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {flowStages.map((stage, idx) => {
            const isVerified = stage.status === 'verified';
            return (
              <li
                key={stage.id}
                data-testid={`flow-stage-${stage.id}`}
                className="relative flex flex-col"
              >
                <div
                  className={`flex-1 rounded-xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors ${
                    isVerified
                      ? 'bg-[#FAF8F5] dark:bg-[#121315] border-[#146C53]/35 dark:border-[#2EB88B]/40'
                      : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular">
                      <span className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                        STEP {stage.stepNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{stage.conversionPct}% conv.</span>
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      {stage.label}
                    </h3>

                    <motion.p
                      key={`${stage.id}-${stage.count}`}
                      data-testid={`flow-count-${stage.id}`}
                      initial={{ opacity: 0.7, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-mono-tabular tabular-nums text-2xl sm:text-3xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      {stage.count.toLocaleString()}
                    </motion.p>

                    <div
                      className="h-1.5 w-full rounded-full bg-[#E8E3DB] dark:bg-[#2C3037] overflow-hidden"
                      role="progressbar"
                      aria-label={`${stage.label} conversion`}
                      aria-valuenow={stage.conversionPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] transition-[width] duration-300"
                        style={{ width: `${stage.conversionPct}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
                    {stage.microCaption}
                  </p>
                </div>

                {/* Desktop horizontal connector arrow */}
                {idx < flowStages.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden lg:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[#146C53] dark:text-[#2EB88B]"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Emerald-Toned Milestone Badges Component */}
      <Badges
        capabilities={capabilities}
        contributions={contributions}
        passport={passport}
      />

      {/* Skill Growth Analytics & Cloud Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 space-y-6">
          <div>
            <h2 className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
              {t.skillGrowthHeading}
            </h2>
            <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
              {t.skillGrowthSubcopy}
            </p>
          </div>

          {analytics.domainGrowth.length === 0 ? (
            <p className="text-sm text-[#575B62] dark:text-[#A3A7AE]">
              Add verified skills or complete a sprint to chart your domain progression.
            </p>
          ) : (
            <div className="space-y-4">
              {analytics.domainGrowth.map((item) => (
                <div key={item.domain} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      {item.domain}
                    </span>
                    <span
                      dir="ltr"
                      className="text-xs tabular-nums font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]"
                    >
                      {item.baselineScore}% →{' '}
                      <strong className="text-[#146C53] dark:text-[#2EB88B]">
                        {item.currentScore}%
                      </strong>
                    </span>
                  </div>
                  <div
                    className="h-2 w-full rounded-full bg-[#F2EEE8] dark:bg-[#22252A] overflow-hidden"
                    role="progressbar"
                    aria-label={`${item.domain} skill progression`}
                    aria-valuenow={item.currentScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] transition-[width] duration-300"
                      style={{ width: `${item.currentScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] tabular-nums">
                    {item.verifiedCount} {t.verifiedLabel} · {item.completedCount}{' '}
                    {t.completedBriefsLabel}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Next Opportunities + Cross-Platform Sync */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 space-y-4">
            <h2 className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
              Next Opportunities &amp; Readiness
            </h2>

            {passport ? (
              <div className="rounded-xl bg-[#E7F3EE]/75 dark:bg-[#142B24]/85 border border-[#146C53]/25 dark:border-[#2EB88B]/30 p-4 space-y-1">
                <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  Active Micro-Bridging Track · {passport.microBridge.estimatedDuration}
                </p>
                <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {passport.microBridge.title}
                </p>
                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  Stipend / fee-waiver status:{' '}
                  <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    {passport.stipendEligible ? 'Requested' : 'Available in Verify'}
                  </span>
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2">
                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  Complete one 2-minute practical scenario in Talent Studio to generate your Living Competency Passport and boost SDG 4 verification momentum.
                </p>
                <button
                  type="button"
                  onClick={onGoToVerify}
                  className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1 hover:underline"
                >
                  <span>Open Talent Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            )}

            {nextOpportunities.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                  Highest-Value Paid Briefs Aligned to You
                </p>
                {nextOpportunities.map((brief) => (
                  <div
                    key={brief.id}
                    className="flex items-start justify-between gap-3 py-2.5 border-t border-[#E8E3DB] dark:border-[#2C3037]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE] truncate">
                        {brief.title}
                      </p>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        {brief.domain} · {brief.complexity} · {brief.matchScore}% match
                      </p>
                    </div>
                    <span className="text-sm font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B] shrink-0">
                      ${brief.payoutUsd}
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={onGoToUnlock}
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Review Work-Ready Vault</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 space-y-4">
            <h2 className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
              {t.syncCardHeading}
            </h2>
            <p className="text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
              {t.syncCardBody}
            </p>

            <dl className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2 text-xs">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#575B62] dark:text-[#A3A7AE]">{t.accountLabel}</dt>
                <dd className="font-medium text-[#17191C] dark:text-[#F4F2EE] truncate">
                  {userEmail || t.guestLocalMode}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#575B62] dark:text-[#A3A7AE]">{t.lastSyncedLabel}</dt>
                <dd className="tabular-nums font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  {lastSyncedIso
                    ? new Date(lastSyncedIso).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : t.notSyncedYet}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#575B62] dark:text-[#A3A7AE]">{t.offlineQueueLabel}</dt>
                <dd className="tabular-nums font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  {queuedCount} {t.pendingSuffix}
                </dd>
              </div>
            </dl>

            <div className="pt-2">
              {!userEmail ? (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold transition-colors"
                >
                  {t.signInGoogle}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSyncNow}
                  disabled={!isOnline || isSyncing}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{t.syncNow}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Ledger Table */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] overflow-hidden">
        <div className="p-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <h2 className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
            {t.ledgerHeading}
          </h2>

          <div className="inline-flex items-center p-1 rounded-lg bg-[#F2EEE8] dark:bg-[#121315]">
            {(['all', 'completed', 'in-progress'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                    : 'text-[#575B62] dark:text-[#A3A7AE]'
                }`}
              >
                {status === 'all'
                  ? t.filterAllStatus
                  : status === 'completed'
                    ? t.completedBadge
                    : t.inProgressBadge}
              </button>
            ))}
          </div>
        </div>

        {visibleContributions.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#575B62] dark:text-[#A3A7AE]">
            {t.ledgerEmpty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  <th className="py-3 px-6 font-medium text-start">{t.ledgerColBrief}</th>
                  <th className="py-3 px-4 font-medium text-start">{t.ledgerColDomain}</th>
                  <th className="py-3 px-4 font-medium text-start">{t.ledgerColStatus}</th>
                  <th className="py-3 px-4 font-medium text-end">{t.ledgerColHours}</th>
                  <th className="py-3 px-6 font-medium text-end">{t.ledgerColPayout}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] text-sm">
                {visibleContributions.map((row) => {
                  const isNewlyCompleted = activeCelebration?.id === row.id;
                  return (
                    <motion.tr
                      key={row.id}
                      initial={isNewlyCompleted ? { opacity: 0.6, y: 4 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className={
                        isNewlyCompleted
                          ? 'bg-[#E7F3EE]/60 dark:bg-[#142B24]/60 transition-colors'
                          : 'hover:bg-[#FAF8F5]/70 dark:hover:bg-[#22252A]/60 transition-colors'
                      }
                    >
                      <td className="py-3.5 px-6 font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        {row.briefTitle}
                      </td>
                      <td className="py-3.5 px-4 text-[#575B62] dark:text-[#A3A7AE]">
                        {row.domain}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={
                            row.status === 'completed'
                              ? 'text-xs font-medium text-[#146C53] dark:text-[#2EB88B]'
                              : 'text-xs font-medium text-[#C4622D] dark:text-[#E07B46]'
                          }
                        >
                          {row.status === 'completed' ? t.completedBadge : t.inProgressBadge}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                        {row.hoursLogged}h
                      </td>
                      <td className="py-3.5 px-6 text-end font-mono-tabular tabular-nums font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        ${row.payoutUsd}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Offline -> Online Cloud Sync Confirmation Toast */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            key={syncToast.timestampIso}
            role="status"
            aria-live="polite"
            data-testid="pulse-online-sync-toast"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/40 dark:border-[#2EB88B]/45 shadow-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  Back Online · Synced to Cloud
                </p>
                <p className="mt-0.5 text-xs text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                  {syncToast.syncedCount > 0
                    ? `Your local queue (${syncToast.syncedCount} update${syncToast.syncedCount === 1 ? '' : 's'}) has been successfully synced to the cloud.`
                    : 'Connection restored — your local Proof Ledger queue is up to date and synced to the cloud.'}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissSyncToast}
                aria-label="Dismiss sync notification"
                data-testid="dismiss-sync-toast-btn"
                className="min-h-[28px] min-w-[28px] rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
