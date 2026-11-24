import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
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
  SprintFeedback,
  SprintRatingScore,
  WorkReadyVault,
} from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';
import {
  SEED_BRIEFS,
  buildLedgerCsv,
  computeAnalyticsSummary,
  computeKnowledgeToWorkFlow,
  computeSdgPulseMetrics,
  computeSprintDueAlerts,
  computeSprintPerformanceSeries,
  filterAndRankBriefs,
} from '../utils/talentEngine';
import { Badges } from './Badges';
import { RippleConstellationMotif, WovenBridgeArcsMotif } from './ResilienceMotifs';
import { SprintPerformanceWidget } from './SprintPerformanceWidget';
import { SprintFeedbackPanel } from './SprintFeedbackPanel';
import solarEngineerImg from '../assets/images/community_solar_engineer_1795539856588.jpg';
import healthCoordImg from '../assets/images/community_health_coordinator_1795539856635.jpg';
import craftMentorsImg from '../assets/images/community_craft_mentors_1795539857588.jpg';

const inFlightPulseStoryPromises = new Map<string, Promise<string>>();

interface CommunityImpactStory {
  id: string;
  practitionerName: string;
  roleTitle: string;
  ageTrack: string;
  regionLabel: string;
  domain: string;
  quote: string;
  outcomeLine: string;
  imageSrc: string;
  imageAlt: string;
}

const COMMUNITY_IMPACT_STORIES: CommunityImpactStory[] = [
  {
    id: 'story-tariq-solar',
    practitionerName: 'Tariq Al-Mansoor',
    roleTitle: 'Off-Grid Solar Diagnostics Lead',
    ageTrack: '30–45 Specialist',
    regionLabel: 'Amman & Rift Valley Remote Pod',
    domain: 'Green Energy',
    quote:
      'Replaced eight years of lost engineering transcripts with a two-minute 48V microgrid scenario—unlocking paid clinic audits inside one week.',
    outcomeLine: '$1,240 milestone payouts · 3 clinic microgrids stabilized',
    imageSrc: solarEngineerImg,
    imageAlt:
      'A solar technician calibrating off-grid microgrid inverter diagnostics at a community workshop',
  },
  {
    id: 'story-halima-health',
    practitionerName: 'Halima Ndiaye',
    roleTitle: 'Maternal Triage & Cold-Chain Coordinator',
    ageTrack: '18–29 Emerging Builder',
    regionLabel: 'Kakuma → Nairobi Regional Clinics',
    domain: 'Healthcare Ops',
    quote:
      'Paired UNHCR registration attestation with Tier 1 mobile money verification and co-authored bilingual vaccine excursion checklists.',
    outcomeLine: '9 health posts aligned · Zero cold-chain spoilage',
    imageSrc: healthCoordImg,
    imageAlt:
      'A community healthcare operations coordinator updating vaccine cold-chain logs on a clinic tablet',
  },
  {
    id: 'story-beatrice-yusuf',
    practitionerName: 'Beatrice Wanjiru & Yusuf K.',
    roleTitle: 'Cross-Age Craft & Finance Guild Pod',
    ageTrack: '46+ Master · 15–17 Apprentice',
    regionLabel: 'Nakuru Cooperative Studio',
    domain: 'SME Finance',
    quote:
      'Our 46+ master practitioner audited workshop margins while a 17-year-old apprentice built a 13-week mobile supplier ledger.',
    outcomeLine: '16 artisans paid on time · Peer-verified passport',
    imageSrc: craftMentorsImg,
    imageAlt:
      'A master artisan mentoring a younger apprentice inside a sunlit craft and fabrication studio',
  },
];

interface PulseViewProps {
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
  vault: WorkReadyVault;
  endorsements: PeerEndorsement[];
  payouts: ContractPayout[];
  sprintFeedback: SprintFeedback[];
  celebratedContribution: BriefSubmission | null;
  userEmail: string | null;
  lastSyncedIso: string | null;
  queuedCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  t: TranslationDictionary;
  onAddSprintFeedback: (input: {
    contributionId: string;
    briefId: string;
    briefTitle: string;
    partnerOrg: string;
    reviewerName: string;
    reviewerRole: string;
    rating: SprintRatingScore;
    reviewText: string;
  }) => void;
  onDismissCelebration: () => void;
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
  sprintFeedback,
  celebratedContribution,
  userEmail,
  lastSyncedIso,
  queuedCount,
  isOnline,
  isSyncing,
  t,
  onAddSprintFeedback,
  onDismissCelebration,
  onSignIn,
  onSyncNow,
  onGoToUnlock,
  onGoToVerify,
  onGoToSolve,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [liveCompleted, setLiveCompleted] = useState<BriefSubmission | null>(null);
  const previousStatusRef = useRef<Map<string, ContributionStatus>>(
    new Map(contributions.map((c) => [c.id, c.status]))
  );

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

  const sprintDueAlerts = useMemo(
    () => computeSprintDueAlerts(contributions),
    [contributions]
  );

  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  const analytics = useMemo(
    () => computeAnalyticsSummary(capabilities, contributions),
    [capabilities, contributions]
  );

  // Pulse Story (Gemini one-sentence human-centric summary)
  const completedContributionsList = useMemo(
    () => contributions.filter((c) => c.status === 'completed'),
    [contributions]
  );
  const verifiedCapabilitiesCount = useMemo(
    () => capabilities.filter((c) => c.verificationStatus !== 'pending').length,
    [capabilities]
  );
  const verifiedEndorsementsCount = useMemo(
    () => endorsements.filter((e) => e.status === 'verified').length,
    [endorsements]
  );
  const storyFingerprint = useMemo(
    () =>
      [
        profile.displayName,
        profile.ageStage,
        verifiedCapabilitiesCount,
        completedContributionsList.length,
        analytics.totalEarnedUsd,
        verifiedEndorsementsCount,
        passport?.id ?? 'no-passport',
      ].join('|'),
    [
      profile.displayName,
      profile.ageStage,
      verifiedCapabilitiesCount,
      completedContributionsList.length,
      analytics.totalEarnedUsd,
      verifiedEndorsementsCount,
      passport?.id,
    ]
  );

  const [pulseStoriesByFingerprint, setPulseStoriesByFingerprint] = useState<Record<string, string>>(
    () => {
      if (typeof window === 'undefined') return {};
      try {
        const raw = window.sessionStorage.getItem('vuka.pulseStories');
        return raw ? (JSON.parse(raw) as Record<string, string>) : {};
      } catch {
        return {};
      }
    }
  );
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  const activePulseStory = pulseStoriesByFingerprint[storyFingerprint] ?? null;

  const generatePulseStory = async (forceRefresh = false) => {
    if (!isOnline) {
      setStoryError('Pulse Story needs an internet connection to refresh via Gemini.');
      return;
    }
    setStoryError(null);
    setStoryLoading(true);
    try {
      let pendingPromise = !forceRefresh
        ? inFlightPulseStoryPromises.get(storyFingerprint)
        : undefined;

      if (!pendingPromise) {
        const topDomains = Array.from(
          new Set([
            ...capabilities.map((c) => c.domain),
            ...completedContributionsList.map((c) => c.domain),
            ...(passport ? [passport.studioDomain] : []),
          ])
        ).slice(0, 3);

        pendingPromise = fetch('/api/pulse/story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: profile.displayName,
            ageStage: profile.ageStage,
            verifiedCount: verifiedCapabilitiesCount,
            completedSprintsCount: completedContributionsList.length,
            earnedUsd: analytics.totalEarnedUsd,
            latestSprintTitle: completedContributionsList[0]?.briefTitle ?? '',
            topDomains,
            endorsementsCount: verifiedEndorsementsCount,
            passportFieldMatch: passport?.fieldMatch ?? '',
          }),
        })
          .then(async (res) => {
            const data = (await res.json()) as { story?: string; error?: string };
            if (!res.ok || !data.story) {
              throw new Error(data.error || 'Unable to generate Pulse Story right now.');
            }
            return data.story;
          })
          .finally(() => {
            inFlightPulseStoryPromises.delete(storyFingerprint);
          });

        inFlightPulseStoryPromises.set(storyFingerprint, pendingPromise);
      }

      const generatedStory = await pendingPromise;
      setPulseStoriesByFingerprint((prev) => {
        const next = {
          ...prev,
          [storyFingerprint]: generatedStory,
        };
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem('vuka.pulseStories', JSON.stringify(next));
          } catch {
            // Ignore storage quota errors
          }
        }
        return next;
      });
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : 'Unable to generate Pulse Story summary.';
      const cleanMessage =
        rawMessage.includes('quota') || rawMessage.includes('429')
          ? 'Live AI story rate limit reached temporarily — your verified SDG metrics remain active below.'
          : rawMessage;
      setStoryError(cleanMessage);
    } finally {
      setStoryLoading(false);
    }
  };

  useEffect(() => {
    if (!isOnline || activePulseStory) return;
    void generatePulseStory(false);
    // Auto-generate when milestone fingerprint changes while online
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyFingerprint, isOnline]);

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

        {/* Subtle Sprint Due Alert Badge (< 48h before active sprint deadline) */}
        {sprintDueAlerts.length > 0 && (
          <div className="relative z-10 mt-5 pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                role="status"
                data-testid="sprint-due-alert-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/30 dark:border-[#E07B46]/35 text-xs font-semibold text-[#C4622D] dark:text-[#E07B46]"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Sprint Due Alert · {sprintDueAlerts[0].formattedRemaining}
                </span>
              </span>
              <span className="text-xs text-[#43484E] dark:text-[#C4C9D0]">
                {sprintDueAlerts[0].briefTitle}
                {sprintDueAlerts.length > 1
                  ? ` (+${sprintDueAlerts.length - 1} more due within 48h)`
                  : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={onGoToSolve}
              data-testid="sprint-due-resume-btn"
              className="text-xs font-semibold text-[#C4622D] dark:text-[#E07B46] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Complete in Solve</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        )}
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

      {/* Pulse Story Card: Dynamic One-Sentence Human-Centric Gemini Impact Summary */}
      <div
        data-testid="pulse-story-card"
        className="rounded-2xl bg-[#E7F3EE]/65 dark:bg-[#142B24]/75 border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
            <Sparkles className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46] shrink-0" />
            <span>Pulse Story · Live Impact Narrative</span>
          </div>

          {storyLoading && !activePulseStory ? (
            <p
              data-testid="pulse-story-loading"
              className="text-sm text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center gap-2"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#146C53] dark:text-[#2EB88B]" />
              <span>Synthesizing your latest skill verification and sprint impact…</span>
            </p>
          ) : activePulseStory ? (
            <p
              data-testid="pulse-story-text"
              className="font-display text-base sm:text-lg font-medium leading-relaxed text-[#17191C] dark:text-[#F4F2EE]"
            >
              {activePulseStory}
            </p>
          ) : (
            <p
              data-testid="pulse-story-fallback"
              className="text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed"
            >
              {storyError ||
                'Verify skills or complete a sprint to generate your live one-sentence Gemini impact narrative.'}
            </p>
          )}

          {storyError && activePulseStory && (
            <p role="status" className="text-xs text-[#C4622D] dark:text-[#E07B46]">
              {storyError}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={storyLoading}
          data-testid="refresh-pulse-story-btn"
          onClick={() => void generatePulseStory(true)}
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-white dark:bg-[#1A1C20] hover:bg-[#FAF8F5] dark:hover:bg-[#22252A] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${storyLoading ? 'animate-spin' : ''}`} />
          <span>{storyLoading ? 'Refreshing…' : 'Refresh Story'}</span>
        </button>
      </div>

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

      {/* SPRINT PERFORMANCE SPARKLINE & PARTNER SPRINT FEEDBACK LOOP */}
      <div
        data-testid="performance-and-feedback-band"
        className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch"
      >
        <div className="xl:col-span-7 flex flex-col [&>section]:flex-1">
          <SprintPerformanceWidget data={sprintPerformance} />
        </div>
        <div className="xl:col-span-5 flex flex-col [&>section]:flex-1">
          <SprintFeedbackPanel
            contributions={contributions}
            feedbackList={sprintFeedback}
            onAddSprintFeedback={onAddSprintFeedback}
          />
        </div>
      </div>

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
                        {row.status === 'completed' ? (
                          <motion.span
                            key={`completed-${row.id}`}
                            data-testid={`contribution-status-${row.id}`}
                            data-status="completed"
                            initial={{ scale: 0.86, opacity: 0.65 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 340,
                              damping: 20,
                            }}
                            whileHover={{ scale: 1.04 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] shadow-[0_0_0_1px_rgba(20,108,83,0.06)] whitespace-nowrap"
                          >
                            <motion.span
                              aria-hidden="true"
                              animate={{
                                scale: [1, 1.22, 1],
                                rotate: [0, 10, -6, 0],
                              }}
                              transition={{
                                duration: 2.6,
                                repeat: Infinity,
                                repeatDelay: 2.4,
                                ease: 'easeInOut',
                              }}
                              className="inline-flex items-center justify-center"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                            </motion.span>
                            <span>{t.completedBadge}</span>
                          </motion.span>
                        ) : (
                          <div className="inline-flex flex-wrap items-center gap-1.5">
                            <span
                              data-testid={`contribution-status-${row.id}`}
                              data-status="in-progress"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F9ECE5] dark:bg-[#2D1E17] text-xs font-medium text-[#C4622D] dark:text-[#E07B46] whitespace-nowrap"
                            >
                              {t.inProgressBadge}
                            </span>
                            {(() => {
                              const rowAlert = sprintDueAlerts.find(
                                (a) => a.contributionId === row.id
                              );
                              if (!rowAlert) return null;
                              return (
                                <span
                                  data-testid={`ledger-due-badge-${row.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-mono-tabular font-semibold text-[#C4622D] dark:text-[#E07B46] whitespace-nowrap"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{rowAlert.formattedRemaining}</span>
                                </span>
                              );
                            })()}
                          </div>
                        )}
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

      {/* Community Impact Editorial Gallery */}
      <section
        aria-labelledby="community-impact-heading"
        data-testid="community-impact-gallery"
        className="space-y-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
              Community Impact · Voices Across the Bridge
            </p>
            <h2
              id="community-impact-heading"
              className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Real practitioners turning verified craft into livelihood
            </h2>
          </div>
          <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Field stories across Green Energy, Healthcare Ops &amp; SME Pods
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMMUNITY_IMPACT_STORIES.map((story) => {
            const imgFailed = Boolean(failedImageIds[story.id]);
            return (
              <article
                key={story.id}
                data-testid={`community-impact-card-${story.id}`}
                className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] w-full bg-[#F2EEE8] dark:bg-[#121315] overflow-hidden relative">
                    {!imgFailed ? (
                      <img
                        src={story.imageSrc}
                        alt={story.imageAlt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImageIds((prev) => ({ ...prev, [story.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#E7F3EE] to-[#FAF8F5] dark:from-[#142B24] dark:to-[#1A1C20]">
                        <span className="font-display text-lg font-medium text-[#146C53] dark:text-[#2EB88B]">
                          {story.practitionerName}
                        </span>
                        <span className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                          {story.domain} · {story.regionLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {story.domain}
                      </span>
                      <span>{story.ageTrack}</span>
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        {story.practitionerName}
                      </h3>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        {story.roleTitle} · {story.regionLabel}
                      </p>
                    </div>

                    <p className="text-sm leading-relaxed text-[#43484E] dark:text-[#C4C9D0]">
                      “{story.quote}”
                    </p>
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-3.5 border-t border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5]/70 dark:bg-[#121315]/70 text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
                  {story.outcomeLine}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
};
