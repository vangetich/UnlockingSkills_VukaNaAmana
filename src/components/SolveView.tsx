import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Compass,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type {
  BriefSubmission,
  CompetencyPassport,
  JobToFitUpskillingBridge,
  LivingProofPortfolio,
  LockedUpskillingBridgeRecord,
  MatchedWorkApplication,
  MentorPairingCadence,
  MentorPairingRequest,
  MentorRating,
  MentorRatingScore,
  MentorshipTrackProgressRecord,
  MentorshipTrackSpec,
  PractitionerProfile,
  ProblemBrief,
  RankedMatchedWorkOpportunity,
  RankedSolutionSprint,
  SkillCapability,
  SprintComplexityLevel,
  SprintMilestoneKey,
  StudioDomain,
  UpskillingBridgePathOption,
  WorkReadyVault,
} from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';
import {
  SEED_BRIEFS,
  SOLUTION_SPRINTS,
  SPRINT_COMPLEXITY_LEVELS,
  STUDIO_DOMAINS,
  filterSolutionSprints,
  getSprintComplexityLevel,
  getWorkspaceReadinessLabel,
  rankSolutionSprints,
} from '../utils/talentEngine';
import { TopographicAscentMotif } from './ResilienceMotifs';
import { LivingProofPortfolioSection } from './LivingProofPortfolioSection';
import { MatchedWorkSection } from './MatchedWorkSection';
import { WorkSetupPreferencesCard } from './WorkSetupPreferencesCard';
import { SprintMilestoneProgressBar } from './SprintMilestoneProgressBar';
import { SprintMilestoneChecklist } from './SprintMilestoneChecklist';
import { SprintReminders } from './SprintReminders';
import { MentorshipPathsModal } from './MentorshipPathsModal';
import { MentorshipAvailabilityScheduler } from './MentorshipAvailabilityScheduler';
import { PlatformFAQs } from './PlatformFAQs';
import { VoiceTextarea } from './VoiceField';
import { VoiceRecorder } from './VoiceRecorder';
import { useMessaging } from '../contexts/MessagingContext';
import { useAutoSave } from '../hooks/useAutoSave';

interface SolveViewProps {
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
  passport: CompetencyPassport | null;
  vault?: WorkReadyVault;
  proofPortfolio: LivingProofPortfolio;
  contributions: BriefSubmission[];
  sprintMilestonesByBrief: Record<string, SprintMilestoneKey[]>;
  matchedApplications: MatchedWorkApplication[];
  lockedBridges: LockedUpskillingBridgeRecord[];
  selectedBriefId: string | null;
  partnerPostedSprints?: ProblemBrief[];
  isOnline: boolean;
  speechLang: string;
  t: TranslationDictionary;
  onUpdateProofPortfolio: (next: LivingProofPortfolio) => void;
  onApplyMatchedWork: (opportunity: RankedMatchedWorkOpportunity) => void;
  onStartUpskillingBridge: (params: {
    opportunity: RankedMatchedWorkOpportunity;
    selectedOption: UpskillingBridgePathOption;
    bridge: JobToFitUpskillingBridge;
  }) => void;
  onToggleSprintMilestone: (briefId: string, milestone: SprintMilestoneKey) => void;
  onSelectBrief: (briefId: string) => void;
  onJoinSprintPod: (sprint: RankedSolutionSprint) => void;
  onSaveDraft: (submissionId: string, notes: string, hoursLogged: number) => void;
  onSubmitSolution: (submissionId: string, notes: string, hoursLogged: number) => void;
  onGoToUnlock: () => void;
  onGoToVerify: () => void;
  onGoToPulse?: () => void;
  onUpdateVault?: (next: WorkReadyVault) => void;
  mentorPairings?: MentorPairingRequest[];
  mentorRatings?: MentorRating[];
  mentorshipTrackProgress?: MentorshipTrackProgressRecord[];
  onRequestMentorPairing?: (input: {
    track: MentorshipTrackSpec;
    mentorName: string;
    sprintId?: string;
    sprintTitle?: string;
    preferredCadence: MentorPairingCadence;
    sprintGoals: string;
  }) => MentorPairingRequest;
  onDeleteMentorPairing?: (pairingId: string) => void;
  onSubmitMentorRating?: (input: {
    track: MentorshipTrackSpec;
    mentorId: string;
    mentorName: string;
    rating: MentorRatingScore;
    comment: string;
  }) => MentorRating;
  onDeleteMentorRating?: (ratingId: string) => void;
  onToggleTrackObjective?: (
    trackId: string,
    objectiveId: string
  ) => MentorshipTrackProgressRecord;
}

export const SolveView: React.FC<SolveViewProps> = ({
  profile,
  capabilities,
  passport,
  vault,
  proofPortfolio,
  contributions = [],
  sprintMilestonesByBrief = {},
  matchedApplications = [],
  lockedBridges,
  selectedBriefId,
  partnerPostedSprints = [],
  isOnline,
  speechLang,
  t,
  onUpdateProofPortfolio,
  onApplyMatchedWork,
  onStartUpskillingBridge,
  onToggleSprintMilestone,
  onSelectBrief,
  onJoinSprintPod,
  onSaveDraft,
  onSubmitSolution,
  onGoToUnlock,
  onGoToVerify,
  onGoToPulse,
  onUpdateVault,
  mentorPairings = [],
  mentorRatings = [],
  mentorshipTrackProgress = [],
  onRequestMentorPairing,
  onDeleteMentorPairing,
  onSubmitMentorRating,
  onDeleteMentorRating,
  onToggleTrackObjective,
}) => {
  const workbenchRef = useRef<HTMLDivElement | null>(null);
  const {
    mentorshipSessions,
    openMentorThread,
    bookMentorshipSession,
    getMentorForSprint,
    getMessagesForSprint,
    getSessionsForSprint,
  } = useMessaging();

  const rankedSprints = useMemo(
    () => rankSolutionSprints(profile, capabilities, passport, partnerPostedSprints),
    [profile, capabilities, passport, partnerPostedSprints]
  );

  const activeSubmission =
    contributions.find((c) => c.briefId === selectedBriefId) ??
    contributions.find((c) => c.status === 'in-progress') ??
    contributions[0] ??
    null;

  const [levelFilter, setLevelFilter] = useState<'ALL' | SprintComplexityLevel>('ALL');
  const [domainFilter, setDomainFilter] = useState<'ALL' | StudioDomain>('ALL');
  const [inclusiveOnly, setInclusiveOnly] = useState(false);
  const [notes, setNotes] = useState(activeSubmission?.solutionNotes ?? '');
  const [hours, setHours] = useState<string>(
    activeSubmission ? String(activeSubmission.hoursLogged || 2) : '2'
  );
  const [checkedDeliverables, setCheckedDeliverables] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justJoinedTitle, setJustJoinedTitle] = useState<string | null>(null);
  const [submissionCelebration, setSubmissionCelebration] = useState<{
    id: string;
    briefTitle: string;
    payoutUsd: number;
    hoursLogged: number;
  } | null>(null);
  const [isMentorshipPathsOpen, setIsMentorshipPathsOpen] = useState(false);
  const [isAvailabilityPopoverOpen, setIsAvailabilityPopoverOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const visibleSprints = useMemo(() => {
    const base = filterSolutionSprints(rankedSprints, levelFilter, domainFilter);
    if (!inclusiveOnly) return base;
    return base.filter(
      (s) =>
        Boolean(s.inclusiveReady) ||
        Boolean(s.workspaceReadiness && s.workspaceReadiness.length > 0)
    );
  }, [rankedSprints, levelFilter, domainFilter, inclusiveOnly]);

  const hasActiveFilters = levelFilter !== 'ALL' || domainFilter !== 'ALL' || inclusiveOnly;

  useEffect(() => {
    if (activeSubmission) {
      setNotes(activeSubmission.solutionNotes);
      setHours(String(activeSubmission.hoursLogged || 2));
      setFeedback(null);
      setError(null);
    }
  }, [activeSubmission?.id]);

  // 5-second debounced auto-save for Solve workbench draft & deliverables
  useAutoSave({
    key: `solve_draft_${activeSubmission?.id ?? 'default'}`,
    data: {
      submissionId: activeSubmission?.id ?? null,
      notes,
      hours: Math.max(0, Number(hours) || 0),
      checkedDeliverables,
    },
    debounceMs: 5000,
    enabled: Boolean(activeSubmission && activeSubmission.status !== 'completed'),
    onAutoSaved: (saved) => {
      if (saved.submissionId && saved.notes !== activeSubmission?.solutionNotes) {
        onSaveDraft(saved.submissionId, saved.notes, saved.hours);
      }
    },
  });

  const completedSprintsCount = useMemo(
    () => contributions.filter((c) => c.status === 'completed').length,
    [contributions]
  );
  const activePodCount = useMemo(
    () => contributions.filter((c) => c.status === 'in-progress').length,
    [contributions]
  );
  const pathwayUnlocked = completedSprintsCount >= 2;
  const proofEarned = completedSprintsCount >= 1;

  const matchedSprint = activeSubmission
    ? rankedSprints.find((s) => s.id === activeSubmission.briefId) ??
      SOLUTION_SPRINTS.find((s) => s.id === activeSubmission.briefId) ??
      null
    : null;

  const matchedLegacyBrief =
    activeSubmission && !matchedSprint
      ? SEED_BRIEFS.find((b) => b.id === activeSubmission.briefId) ?? null
      : null;

  const isCompleted = activeSubmission?.status === 'completed';

  const handleJoinClick = (sprint: RankedSolutionSprint) => {
    onJoinSprintPod(sprint);
    setJustJoinedTitle(sprint.title);
    window.setTimeout(() => {
      workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleAppendTranscript = (chunk: string) => {
    setNotes((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${chunk}` : chunk;
    });
    if (error) setError(null);
    if (feedback) setFeedback(null);
  };

  const toggleDeliverable = (briefId: string, item: string) => {
    const key = `${briefId}::${item}`;
    setCheckedDeliverables((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!activeSubmission) return;
    setError(null);
    const parsedHours = Math.max(0, Number(hours) || 0);
    onSaveDraft(activeSubmission.id, notes, parsedHours);
    setFeedback('Saved locally');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    const parsedHours = Number(hours) || 0;
    if (notes.trim().length < 10 || parsedHours <= 0) {
      setError(t.validationSolutionMinLength);
      return;
    }
    setError(null);
    onSubmitSolution(activeSubmission.id, notes.trim(), parsedHours);
    setFeedback('Sprint milestone verified and added to your Proof Ledger.');
    setSubmissionCelebration({
      id: `${activeSubmission.id}-${Date.now()}`,
      briefTitle: activeSubmission.briefTitle || 'Solution Sprint',
      payoutUsd: activeSubmission.payoutUsd,
      hoursLogged: parsedHours,
    });
  };

  return (
    <section aria-labelledby="solve-heading" className="space-y-10">
      {/* Module 1: Living Proof Portfolio & Market Readiness */}
      <LivingProofPortfolioSection
        profile={profile}
        portfolio={proofPortfolio}
        isOnline={isOnline}
        speechLang={speechLang}
        onUpdatePortfolio={onUpdateProofPortfolio}
      />

      {/* Module 2: Matched Work & Cross-Age Solution Flows */}
      <MatchedWorkSection
        profile={profile}
        passport={passport}
        vault={vault}
        portfolio={proofPortfolio}
        contributions={contributions}
        applications={matchedApplications}
        lockedBridges={lockedBridges}
        onApplyWithLivingProof={onApplyMatchedWork}
        onStartUpskillingBridge={onStartUpskillingBridge}
        onGoToUnlock={onGoToUnlock}
        onGoToPulse={onGoToPulse}
      />

      {/* Header Banner + 3-Stage Proof-of-Work Pathway */}
      <div className="relative rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <TopographicAscentMotif />
        </div>

        <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
              Solution-Flow Marketplace · Cross-Age Pods
            </p>
            <h1
              id="solve-heading"
              className="mt-1.5 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
            >
              Scoped paid Solution Sprints built around real pain points
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
              Ranked dynamically from your Living Competency Passport. Every sprint pairs a Senior Specialist/Master with an Emerging Builder inside a 2-person pod.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {vault?.onboardingPackGenerated && (
              <span
                data-testid="solve-pre-cleared-badge"
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/35 dark:border-[#2EB88B]/40 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Pre-Cleared for Hiring Partners</span>
              </span>
            )}
            {!passport && (
              <button
                type="button"
                onClick={onGoToVerify}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                <span>Generate Passport to Sharpen Match</span>
              </button>
            )}
            <button
              type="button"
              data-testid="open-mentorship-paths-btn"
              onClick={() => setIsMentorshipPathsOpen(true)}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 hover:bg-[#D8EDE4] dark:hover:bg-[#1A392F] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>
                Mentorship Paths
                {mentorPairings.length > 0 ? ` (${mentorPairings.length})` : ''}
              </span>
            </button>
            <div className="relative inline-flex">
              <button
                type="button"
                data-testid="open-availability-scheduler-popover-btn"
                aria-expanded={isAvailabilityPopoverOpen}
                aria-haspopup="dialog"
                onClick={() => setIsAvailabilityPopoverOpen((prev) => !prev)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <CalendarClock className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                <span>Book Mentor Slot</span>
              </button>
              <MentorshipAvailabilityScheduler
                variant="popover"
                isOpen={isAvailabilityPopoverOpen}
                onClose={() => setIsAvailabilityPopoverOpen(false)}
                activeSubmission={activeSubmission}
                contributions={contributions}
                mentorshipSessions={mentorshipSessions}
                onBookSlot={(payload) =>
                  bookMentorshipSession({
                    sprintId: payload.sprintId,
                    sprintTitle: payload.sprintTitle,
                    mentor: payload.mentor,
                    focusTopic: payload.focusTopic,
                    durationMinutes: payload.durationMinutes,
                    status: 'scheduled',
                    takeawayNote: payload.takeawayNote,
                    scheduledAtIso: payload.scheduledAtIso,
                  })
                }
              />
            </div>
            <button
              type="button"
              onClick={onGoToUnlock}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Work-Ready Vault</span>
            </button>
          </div>
        </div>

        {/* Visual 3-Stage Progression Pathway */}
        <div
          data-testid="sprint-pathway-stepper"
          className="relative z-10 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Your Paid Fellowship &amp; Hiring Partner Pathway
            </p>
            <span className="text-xs font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
              {Math.min(completedSprintsCount, 2)}/2 Sprints Completed
              {activePodCount > 0 ? ` · ${activePodCount} Active Pod` : ''}
            </span>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <li
              className={`rounded-xl border p-4 transition-colors ${
                pathwayUnlocked
                  ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border-[#146C53]/35 dark:border-[#2EB88B]/35'
                  : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#C4622D]/35 dark:border-[#E07B46]/35'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono-tabular font-semibold text-[#C4622D] dark:text-[#E07B46]">
                  STEP 01
                </span>
                <span className="font-semibold text-[#146C53] dark:text-[#2EB88B] font-mono-tabular tabular-nums">
                  {Math.min(completedSprintsCount, 2)}/2 Done
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Complete 2 Sprints
              </p>
              <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                Deliver two scoped 1–2 week sprints inside a cross-age pod.
              </p>
            </li>

            <li
              className={`rounded-xl border p-4 transition-colors ${
                proofEarned
                  ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border-[#146C53]/35 dark:border-[#2EB88B]/35'
                  : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  STEP 02
                </span>
                <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  {proofEarned ? 'Active' : 'Next'}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Earn Local Proof-of-Work
              </p>
              <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                Verified deliverables attach automatically to your Proof Ledger.
              </p>
            </li>

            <li
              className={`rounded-xl border p-4 transition-colors ${
                pathwayUnlocked
                  ? 'bg-[#E7F3EE]/90 dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B]'
                  : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  STEP 03
                </span>
                <span
                  className={`font-semibold ${
                    pathwayUnlocked
                      ? 'text-[#146C53] dark:text-[#2EB88B]'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  {pathwayUnlocked ? 'Unlocked' : 'At 2 Sprints'}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Unlock Paid Fellowship / Hiring Partner Intro
              </p>
              <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                Direct warm introductions to SME, NGO, and remote tech hiring leads.
              </p>
            </li>
          </ol>
        </div>
      </div>

      {/* Active Sprint Deadline Reminders (phase-aware via sprintMilestonesByBrief) */}
      <SprintReminders
        contributions={contributions}
        sprintMilestonesByBrief={sprintMilestonesByBrief}
        onSelectSprint={(briefId) => {
          onSelectBrief(briefId);
          window.setTimeout(() => {
            workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 60);
        }}
      />

      {/* Optional & Private by Default "How I Work Best" Card (ILO Inclusive Work Standard) */}
      <WorkSetupPreferencesCard
        vault={vault}
        onUpdateVault={onUpdateVault}
        onJumpToStipendPool={onGoToVerify}
        contextLabel="solve"
      />

      {/* 4 Curated Paid Solution Sprints Grid */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
              Curated 1–2 Week Paid Solution Sprints
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
              {passport
                ? `Ranked for your ${passport.studioDomain} Living Competency Passport (${passport.fieldMatch}).`
                : 'Ranked from your verified capabilities and problem focus.'}
            </p>
          </div>
          <span
            data-testid="solve-sprint-count"
            className="text-xs font-mono-tabular tabular-nums text-[#146C53] dark:text-[#2EB88B] font-semibold whitespace-nowrap"
          >
            Showing {visibleSprints.length} of {rankedSprints.length} Solution Sprints
          </span>
        </div>

        {/* Calm Complexity Level & Domain Filter Bar */}
        <div
          data-testid="solve-filter-bar"
          className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE] me-1">
                Complexity
              </span>
              {(['ALL', ...SPRINT_COMPLEXITY_LEVELS] as const).map((level) => {
                const active = levelFilter === level;
                const count = filterSolutionSprints(rankedSprints, level, domainFilter).length;
                return (
                  <button
                    key={level}
                    type="button"
                    data-testid={`solve-filter-level-${level}`}
                    aria-pressed={active}
                    onClick={() => setLevelFilter(level)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                        : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                    }`}
                  >
                    <span>{level === 'ALL' ? 'All Levels' : level}</span>
                    <span className="font-mono-tabular tabular-nums opacity-75 text-[11px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE] me-1">
                Domain
              </span>
              {(['ALL', ...STUDIO_DOMAINS] as const).map((domain) => {
                const active = domainFilter === domain;
                const count = filterSolutionSprints(rankedSprints, levelFilter, domain).length;
                return (
                  <button
                    key={domain}
                    type="button"
                    data-testid={`solve-filter-domain-${domain}`}
                    aria-pressed={active}
                    onClick={() => setDomainFilter(domain)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#17191C] dark:bg-[#F4F2EE] text-[#FAF8F5] dark:text-[#121315] font-semibold'
                        : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                    }`}
                  >
                    <span>{domain === 'ALL' ? 'All Domains' : domain}</span>
                    <span className="font-mono-tabular tabular-nums opacity-75 text-[11px]">
                      {count}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                data-testid="solve-filter-inclusive-chip"
                aria-pressed={inclusiveOnly}
                onClick={() => setInclusiveOnly((prev) => !prev)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                  inclusiveOnly
                    ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                    : 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B] hover:bg-[#D8EDE4] dark:hover:bg-[#1A392F]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Inclusive &amp; Remote-Ready Sprints</span>
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-2.5 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between gap-3 text-xs">
              <span className="text-[#575B62] dark:text-[#A3A7AE]">
                Active filters:{' '}
                <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                  {[
                    levelFilter !== 'ALL' ? levelFilter : null,
                    domainFilter !== 'ALL' ? domainFilter : null,
                    inclusiveOnly ? 'Inclusive & Remote-Ready' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </strong>
              </span>
              <button
                type="button"
                data-testid="solve-clear-filters-inline-btn"
                onClick={() => {
                  setLevelFilter('ALL');
                  setDomainFilter('ALL');
                  setInclusiveOnly(false);
                }}
                className="font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline whitespace-nowrap"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {visibleSprints.length === 0 ? (
          <div
            data-testid="solve-empty-filter-state"
            className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-8 text-center space-y-3"
          >
            <p className="font-display text-lg text-[#17191C] dark:text-[#F4F2EE]">
              No active sprints match that exact Complexity &amp; Domain combination.
            </p>
            <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
              Clear the filters to view all 4 employer pain-point sprints ranked for your Passport.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                data-testid="solve-reset-filters-btn"
                onClick={() => {
                  setLevelFilter('ALL');
                  setDomainFilter('ALL');
                  setInclusiveOnly(false);
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleSprints.map((sprint, idx) => {
            const existing = contributions.find((c) => c.briefId === sprint.id);
            const sprintCompleted = existing?.status === 'completed';
            const sprintInProgress = existing?.status === 'in-progress';
            const isSelected = activeSubmission?.briefId === sprint.id;
            const complexityLevel = getSprintComplexityLevel(sprint.complexity);

            return (
              <article
                key={sprint.id}
                data-testid={`solution-sprint-card-${sprint.id}`}
                className={`rounded-2xl bg-white dark:bg-[#1A1C20] border p-5 sm:p-6 flex flex-col justify-between gap-5 transition-colors ${
                  isSelected
                    ? 'border-[#146C53] dark:border-[#2EB88B]'
                    : 'border-[#E8E3DB] dark:border-[#2C3037]'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Unboxed Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5 text-[#575B62] dark:text-[#A3A7AE]">
                      <span className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                        {sprint.partnerType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{sprint.partnerOrg}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sprint.durationLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sprint.studioDomain}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        {complexityLevel}
                      </span>
                    </div>

                    <span className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap">
                      {idx === 0 && !hasActiveFilters ? 'Top Fit · ' : ''}
                      {sprint.matchScore}% Match
                    </span>
                  </div>

                  {/* Title & Employer Pain Point */}
                  <div>
                    <h3 className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                      {sprint.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      {sprint.painPoint}
                    </p>
                    {sprint.workspaceReadiness && sprint.workspaceReadiness.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {sprint.workspaceReadiness.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[10px] font-medium text-[#146C53] dark:text-[#5EEAD4]"
                          >
                            {getWorkspaceReadinessLabel(tag)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Crisp "Why You Fit" Rationale */}
                  <div
                    data-testid={`why-you-fit-${sprint.id}`}
                    className="rounded-xl bg-[#E7F3EE]/65 dark:bg-[#142B24]/80 border border-[#146C53]/20 dark:border-[#2EB88B]/30 px-4 py-3 space-y-1"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                      Why You Fit
                    </p>
                    <p className="text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                      {sprint.whyYouFit}
                    </p>
                  </div>

                  {/* Cross-Age Pod Structure Pairing */}
                  <div
                    data-testid={`pod-structure-${sprint.id}`}
                    className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#17191C] dark:text-[#F4F2EE]">
                        <Users className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                        <span>Pod Structure · Cross-Age Pairing</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div
                        className={`rounded-lg px-3 py-2 border ${
                          sprint.userPodSeat === 'lead'
                            ? 'bg-white dark:bg-[#1A1C20] border-[#146C53]/40 dark:border-[#2EB88B]/45'
                            : 'bg-white/60 dark:bg-[#1A1C20]/60 border-[#E8E3DB] dark:border-[#2C3037]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            30–46+ Lead &amp; Mentor
                          </span>
                          {sprint.userPodSeat === 'lead' && (
                            <span className="text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                              Your Seat
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          {sprint.podLeadRole}
                        </p>
                      </div>

                      <div
                        className={`rounded-lg px-3 py-2 border ${
                          sprint.userPodSeat === 'delivery'
                            ? 'bg-white dark:bg-[#1A1C20] border-[#146C53]/40 dark:border-[#2EB88B]/45'
                            : 'bg-white/60 dark:bg-[#1A1C20]/60 border-[#E8E3DB] dark:border-[#2C3037]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            15–29 Delivery Partner
                          </span>
                          {sprint.userPodSeat === 'delivery' && (
                            <span className="text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                              Your Seat
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          {sprint.podDeliveryRole}
                        </p>
                      </div>
                    </div>

                    {/* Pod Mentorship Live Status on Active Sprint Cards */}
                    {sprintInProgress && (() => {
                      const assignedMentor = getMentorForSprint(sprint.id, sprint.domain);
                      const threadCount = getMessagesForSprint(sprint.id).length;
                      return (
                        <div
                          data-testid={`card-pod-mentorship-${sprint.id}`}
                          className="pt-2.5 mt-1 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span
                                aria-hidden="true"
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  assignedMentor.availability === 'available'
                                    ? 'bg-[#146C53] dark:bg-[#2EB88B]'
                                    : assignedMentor.availability === 'in-review'
                                      ? 'bg-[#C4622D] dark:bg-[#E07B46]'
                                      : 'bg-[#8A847A]'
                                }`}
                              />
                              <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                {assignedMentor.name}
                              </span>
                              <span aria-hidden="true" className="text-[#8A847A]">·</span>
                              <span
                                className={`font-medium ${
                                  assignedMentor.availability === 'available'
                                    ? 'text-[#146C53] dark:text-[#2EB88B]'
                                    : 'text-[#C4622D] dark:text-[#E07B46]'
                                }`}
                              >
                                {assignedMentor.availabilityLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                              {assignedMentor.ageStageBadge} · {assignedMentor.responseWindow}
                              {threadCount > 0 ? ` · ${threadCount} msg${threadCount === 1 ? '' : 's'}` : ''}
                            </p>
                          </div>

                          <button
                            type="button"
                            data-testid={`card-message-mentor-btn-${sprint.id}`}
                            onClick={() => openMentorThread(sprint.id, sprint.title, sprint.domain)}
                            className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message Mentor</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Interactive Multi-Step Delivery Progress Bar */}
                  <SprintMilestoneProgressBar
                    sprintId={sprint.id}
                    milestonesDone={existing?.milestonesDone ?? sprintMilestonesByBrief?.[sprint.id]}
                    isCompleted={Boolean(sprintCompleted)}
                    onToggleMilestone={onToggleSprintMilestone}
                    compact
                  />
                </div>

                {/* Footer: Payout + Single Primary Action */}
                <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono-tabular tabular-nums">
                    <span className="text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      ${sprint.payoutUsd}
                    </span>
                    <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      {' '}
                      · {sprint.estimatedHours}h scoped · Escrow backed
                    </span>
                  </div>

                  {sprintCompleted ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBrief(sprint.id);
                        workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed · View Proof</span>
                    </button>
                  ) : sprintInProgress ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBrief(sprint.id);
                        workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] hover:bg-[#D5EBE2] dark:hover:bg-[#1C3B31] text-[#146C53] dark:text-[#2EB88B] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>Open Active Pod</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`join-pod-btn-${sprint.id}`}
                      onClick={() => handleJoinClick(sprint)}
                      className="min-h-[44px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>Join Sprint Pod</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        )}
      </div>

      {/* Just-Joined Confirmation Strip */}
      {justJoinedTitle && (
        <div
          role="status"
          data-testid="joined-pod-confirmation"
          className="rounded-2xl bg-[#E7F3EE]/85 dark:bg-[#142B24]/90 border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE]">
              <p className="font-semibold">
                Pod seat reserved: {justJoinedTitle}
              </p>
              <p className="mt-0.5 text-[#575B62] dark:text-[#A3A7AE]">
                Escrow logged in your Work-Ready Vault. Complete 2 sprints → Earn Local Proof-of-Work → Unlock Paid Fellowship / Hiring Partner Intro.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJustJoinedTitle(null)}
            className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline self-start sm:self-center shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Sprint Pod Workbench */}
      {activeSubmission && (
        <div
          ref={workbenchRef}
          data-testid="active-sprint-workbench"
          className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                Active Sprint Pod Workbench
              </p>
              <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                Deliverables &amp; Milestone Sign-Off
              </h2>
            </div>
            <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
              Dictate notes with Voice-to-Text or type — saved offline automatically.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Sidebar: Active & Completed Pods */}
            <aside className="lg:col-span-4 space-y-3">
              <p className="text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE]">
                Your Sprint Pods ({contributions.length})
              </p>
              {contributions.map((item) => {
                const selected = item.id === activeSubmission.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectBrief(item.briefId)}
                    className={`w-full text-start rounded-xl p-4 border transition-colors ${
                      selected
                        ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B]'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      <span>{item.domain}</span>
                      <span
                        className={`font-semibold ${
                          item.status === 'completed'
                            ? 'text-[#146C53] dark:text-[#2EB88B]'
                            : 'text-[#C4622D] dark:text-[#E07B46]'
                        }`}
                      >
                        {item.status === 'completed' ? t.completedBadge : t.inProgressBadge}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {item.briefTitle}
                    </div>
                    <div className="mt-1 text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                      ${item.payoutUsd} · {item.hoursLogged}h logged
                    </div>
                  </button>
                );
              })}

              {/* Mentor Availability & Direct Slot Booking Sidebar */}
              <div className="pt-2">
                <MentorshipAvailabilityScheduler
                  variant="sidebar"
                  activeSubmission={activeSubmission}
                  contributions={contributions}
                  mentorshipSessions={mentorshipSessions}
                  onBookSlot={(payload) =>
                    bookMentorshipSession({
                      sprintId: payload.sprintId,
                      sprintTitle: payload.sprintTitle,
                      mentor: payload.mentor,
                      focusTopic: payload.focusTopic,
                      durationMinutes: payload.durationMinutes,
                      status: 'scheduled',
                      takeawayNote: payload.takeawayNote,
                      scheduledAtIso: payload.scheduledAtIso,
                    })
                  }
                />
              </div>
            </aside>

            {/* Right Workbench */}
            <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-5">
                <div>
                  <div className="text-xs text-[#575B62] dark:text-[#A3A7AE] flex flex-wrap items-center gap-1.5">
                    <span>{activeSubmission.domain}</span>
                    {matchedSprint && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{matchedSprint.partnerOrg}</span>
                        <span aria-hidden="true">·</span>
                        <span>{matchedSprint.durationLabel}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      ${activeSubmission.payoutUsd}
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-medium mt-1 text-[#17191C] dark:text-[#F4F2EE]">
                    {activeSubmission.briefTitle}
                  </h3>
                </div>

                <span
                  className={`text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                    isCompleted
                      ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
                      : 'bg-[#F9ECE5] dark:bg-[#2D1E17] border-[#C4622D]/25 dark:border-[#E07B46]/30 text-[#C4622D] dark:text-[#E07B46]'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock3 className="w-3.5 h-3.5" />
                  )}
                  <span>{isCompleted ? t.completedBadge : t.inProgressBadge}</span>
                </span>
              </div>

              {/* Celebratory Sprint Submission Animation */}
              <AnimatePresence>
                {submissionCelebration && (
                  <motion.div
                    key={submissionCelebration.id}
                    role="status"
                    aria-live="polite"
                    data-testid="solve-submission-celebration"
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="relative overflow-hidden rounded-2xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/85 dark:bg-[#142B24]/85 p-5 sm:p-6"
                  >
                    {/* Tasteful compositor-only celebration spark burst */}
                    {!shouldReduceMotion && (
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                        {[
                          { x: -64, y: -38, color: 'bg-[#146C53] dark:bg-[#2EB88B]', delay: 0.04, size: 'w-2 h-2 rounded-full' },
                          { x: 74, y: -44, color: 'bg-[#C4622D] dark:bg-[#E07B46]', delay: 0.08, size: 'w-2.5 h-2.5 rounded-xs rotate-45' },
                          { x: -96, y: 20, color: 'bg-[#C4622D] dark:bg-[#E07B46]', delay: 0.12, size: 'w-2 h-2 rounded-xs rotate-12' },
                          { x: 102, y: 26, color: 'bg-[#146C53] dark:bg-[#2EB88B]', delay: 0.1, size: 'w-2 h-2 rounded-full' },
                          { x: 18, y: -56, color: 'bg-[#146C53] dark:bg-[#2EB88B]', delay: 0.06, size: 'w-1.5 h-3 rounded-full' },
                          { x: -24, y: -54, color: 'bg-[#C4622D] dark:bg-[#E07B46]', delay: 0.14, size: 'w-1.5 h-1.5 rounded-full' },
                        ].map((spark, idx) => (
                          <motion.span
                            key={idx}
                            initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                            animate={{
                              opacity: [0, 1, 0],
                              x: spark.x,
                              y: spark.y,
                              scale: [0.3, 1.15, 0.7],
                            }}
                            transition={{ duration: 1.05, delay: spark.delay, ease: 'easeOut' }}
                            className={`absolute left-12 top-1/2 ${spark.size} ${spark.color}`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="relative shrink-0 mt-0.5">
                          {!shouldReduceMotion && (
                            <motion.span
                              aria-hidden="true"
                              initial={{ scale: 0.8, opacity: 0.75 }}
                              animate={{ scale: 1.8, opacity: 0 }}
                              transition={{ duration: 0.9, ease: 'easeOut' }}
                              className="absolute inset-0 rounded-full border-2 border-[#146C53] dark:border-[#2EB88B]"
                            />
                          )}
                          <motion.div
                            initial={shouldReduceMotion ? false : { scale: 0.4, rotate: -25 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                            className="w-11 h-11 rounded-full bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] flex items-center justify-center shadow-xs"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-5 h-5"
                              aria-hidden="true"
                            >
                              <motion.path
                                d="M5 13l4 4L19 7"
                                initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
                              />
                            </svg>
                          </motion.div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                            Pod Sprint Submitted · Proof Verified
                          </p>
                          <h4 className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
                            {submissionCelebration.briefTitle}
                          </h4>
                          <p className="text-xs sm:text-sm text-[#43484E] dark:text-[#D5DAE0]">
                            <span className="font-mono-tabular tabular-nums font-semibold">
                              {submissionCelebration.hoursLogged}h
                            </span>{' '}
                            logged &amp;{' '}
                            <span className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
                              ${submissionCelebration.payoutUsd.toLocaleString()} USD
                            </span>{' '}
                            escrow milestone recorded in your Proof Ledger.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {onGoToPulse && (
                          <button
                            type="button"
                            onClick={onGoToPulse}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>View in Pulse</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSubmissionCelebration(null)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-xs font-medium text-[#146C53] dark:text-[#2EB88B] hover:bg-white/60 dark:hover:bg-[#1A1C20]/60 transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active Workbench Interactive Delivery Milestone Progress Bar */}
              <SprintMilestoneProgressBar
                sprintId={`workbench-${activeSubmission.briefId}`}
                milestonesDone={
                  activeSubmission.milestonesDone ??
                  sprintMilestonesByBrief?.[activeSubmission.briefId]
                }
                isCompleted={isCompleted}
                onToggleMilestone={(_id, milestone) =>
                  onToggleSprintMilestone(activeSubmission.briefId, milestone)
                }
              />

              {/* Pod Mentorship Real-Time Status Indicator for Active Sprints */}
              {!isCompleted && (() => {
                const activeMentor = getMentorForSprint(
                  activeSubmission.briefId,
                  activeSubmission.domain
                );
                const threadCount = getMessagesForSprint(activeSubmission.briefId).length;
                const sprintSessions = getSessionsForSprint(activeSubmission.briefId);
                const attendedCount = sprintSessions.filter((s) => s.status === 'attended').length;
                const scheduledCount = sprintSessions.filter((s) => s.status === 'scheduled').length;
                const doneMilestones =
                  activeSubmission.milestonesDone ??
                  sprintMilestonesByBrief?.[activeSubmission.briefId] ??
                  [];
                const needsPreSubmitQa =
                  doneMilestones.includes('draft-ready') && attendedCount === 0;

                return (
                  <div
                    data-testid="pod-mentorship-indicator"
                    className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                            Pod Mentorship
                          </span>
                          <span aria-hidden="true" className="text-[#8A847A]">·</span>
                          <span
                            data-testid="mentor-availability-status"
                            className="inline-flex items-center gap-1.5 font-medium text-[#17191C] dark:text-[#F4F2EE]"
                          >
                            <span
                              aria-hidden="true"
                              className={`inline-flex rounded-full h-2 w-2 shrink-0 ${
                                activeMentor.availability === 'available'
                                  ? 'bg-[#146C53] dark:bg-[#2EB88B]'
                                  : activeMentor.availability === 'in-review'
                                    ? 'bg-[#C4622D] dark:bg-[#E07B46]'
                                    : 'bg-[#8A847A]'
                              }`}
                            />
                            <span>{activeMentor.availabilityLabel}</span>
                          </span>
                          <span aria-hidden="true" className="text-[#8A847A]">·</span>
                          <span className="text-[#575B62] dark:text-[#A3A7AE]">
                            {activeMentor.responseWindow}
                          </span>
                          <span aria-hidden="true" className="text-[#8A847A]">·</span>
                          <span
                            data-testid="solve-qa-sessions-summary"
                            className="font-mono-tabular tabular-nums text-[#146C53] dark:text-[#2EB88B] font-medium"
                          >
                            {attendedCount} QA session{attendedCount === 1 ? '' : 's'} attended
                            {scheduledCount > 0 ? ` (${scheduledCount} scheduled)` : ''}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          {activeMentor.name}{' '}
                          <span className="font-normal text-xs text-[#575B62] dark:text-[#A3A7AE]">
                            — {activeMentor.roleTitle} ({activeMentor.ageStageBadge})
                          </span>
                        </p>

                        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                          {activeMentor.hubLocation} · {activeMentor.specialty}
                          {threadCount > 0 ? ` · ${threadCount} message${threadCount === 1 ? '' : 's'} in thread` : ''}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          data-testid="solve-pod-mentorship-paths-btn"
                          onClick={() => setIsMentorshipPathsOpen(true)}
                          className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#17191C] dark:text-[#F4F2EE] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                          <span>Mentorship Paths</span>
                        </button>

                        <button
                          type="button"
                          data-testid="solve-log-qa-session-btn"
                          onClick={() =>
                            openMentorThread(
                              activeSubmission.briefId,
                              activeSubmission.briefTitle,
                              activeSubmission.domain,
                              { initialPanel: 'session' }
                            )
                          }
                          className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#17191C] dark:text-[#F4F2EE] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <span>Log QA Session</span>
                        </button>

                        <button
                          type="button"
                          data-testid="message-mentor-btn"
                          onClick={() =>
                            openMentorThread(
                              activeSubmission.briefId,
                              activeSubmission.briefTitle,
                              activeSubmission.domain
                            )
                          }
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message Mentor</span>
                        </button>
                      </div>
                    </div>

                    {needsPreSubmitQa && (
                      <div
                        data-testid="mentor-qa-readiness-hint"
                        className="pt-2.5 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#C4622D] dark:text-[#E07B46]"
                      >
                        <span>
                          Draft Ready milestone reached with 0 mentor QA sessions logged yet — run a quick 15m handover check before final submission.
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openMentorThread(
                              activeSubmission.briefId,
                              activeSubmission.briefTitle,
                              activeSubmission.domain,
                              {
                                initialPanel: 'session',
                                contextNote: 'Pre-submit Draft Ready QA check',
                              }
                            )
                          }
                          className="font-semibold underline whitespace-nowrap self-start sm:self-center cursor-pointer"
                        >
                          Log 15m QA Check →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Dynamic Task-Based Completion Milestones for the Active Pod Sprint */}
              <SprintMilestoneChecklist
                submission={activeSubmission}
                sprint={matchedSprint}
                legacyBrief={matchedLegacyBrief}
                milestonesDone={
                  activeSubmission.milestonesDone ??
                  sprintMilestonesByBrief?.[activeSubmission.briefId]
                }
                isCompleted={isCompleted}
                checkedDeliverables={checkedDeliverables}
                mentorshipSessions={getSessionsForSprint(activeSubmission.briefId)}
                headingLabel={t.deliverablesHeading}
                onToggleDeliverable={toggleDeliverable}
                onTogglePhaseMilestone={onToggleSprintMilestone}
                onOpenMentorSessionDrawer={() =>
                  openMentorThread(
                    activeSubmission.briefId,
                    activeSubmission.briefTitle,
                    activeSubmission.domain,
                    {
                      initialPanel: 'session',
                      contextNote: 'Mentor QA prerequisite for final sprint milestone',
                    }
                  )
                }
              />

              {isCompleted ? (
                <div className="space-y-4 pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037]">
                  <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    {t.solutionNotesLabel}
                  </p>
                  <p className="text-sm leading-relaxed text-[#575B62] dark:text-[#A3A7AE] whitespace-pre-wrap">
                    {activeSubmission.solutionNotes}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                      {t.hoursLoggedLabel}: {activeSubmission.hoursLogged}h · ${activeSubmission.payoutUsd}
                    </p>
                    {onGoToPulse && (
                      <button
                        type="button"
                        onClick={onGoToPulse}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <span>View Verified Milestone in Pulse</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <VoiceRecorder
                    speechLang={speechLang}
                    onAppendTranscript={handleAppendTranscript}
                  />

                  <VoiceTextarea
                    id="solve-notes-input"
                    label={t.solutionNotesLabel}
                    value={notes}
                    onChange={(v) => {
                      setNotes(v);
                      if (error) setError(null);
                      if (feedback) setFeedback(null);
                    }}
                    placeholder={t.solutionNotesPlaceholder}
                    speechLang={speechLang}
                    t={t}
                    maxLength={2000}
                    rows={5}
                  />

                  <div className="max-w-xs space-y-1.5">
                    <label
                      htmlFor="solve-hours-input"
                      className="block text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      {t.hoursLoggedLabel}
                    </label>
                    <input
                      id="solve-hours-input"
                      type="number"
                      min="0.5"
                      max="500"
                      step="0.5"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-2 text-sm font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
                      {error}
                    </p>
                  )}

                  {feedback && (
                    <p role="status" className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
                      {feedback}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="submit"
                      className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      {t.submitSolutionCta}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="min-h-[46px] px-5 py-2.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-sm font-medium text-[#17191C] dark:text-[#F4F2EE] transition-colors whitespace-nowrap"
                    >
                      {t.saveDraftCta}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* How Vuka Works: Platform FAQs & Guide */}
      <PlatformFAQs variant="solve" />

      {/* Mentorship Paths & Formal Pairing Modal */}
      <MentorshipPathsModal
        isOpen={isMentorshipPathsOpen}
        onClose={() => setIsMentorshipPathsOpen(false)}
        activeSubmission={activeSubmission}
        contributions={contributions}
        passport={passport}
        mentorPairings={mentorPairings}
        mentorshipSessions={mentorshipSessions}
        mentorRatings={mentorRatings}
        mentorshipTrackProgress={mentorshipTrackProgress}
        onBookSessionClick={() => {
          setIsMentorshipPathsOpen(false);
          setIsAvailabilityPopoverOpen(true);
        }}
        onRequestMentorPairing={(input) => {
          if (onRequestMentorPairing) {
            return onRequestMentorPairing(input);
          }
          const now = new Date().toISOString();
          return {
            id: `pairing-${Date.now()}`,
            ownerUid: profile.uid,
            trackId: input.track.id,
            trackTitle: input.track.title,
            domain: input.track.domain,
            mentorId: input.track.mentorId,
            mentorName: input.mentorName,
            sprintId: input.sprintId,
            sprintTitle: input.sprintTitle,
            preferredCadence: input.preferredCadence,
            sprintGoals: input.sprintGoals,
            status: 'requested',
            createdAtIso: now,
            updatedAtIso: now,
          };
        }}
        onDeleteMentorPairing={onDeleteMentorPairing}
        onSubmitMentorRating={onSubmitMentorRating}
        onDeleteMentorRating={onDeleteMentorRating}
        onToggleTrackObjective={onToggleTrackObjective}
        onOpenMentorThread={openMentorThread}
      />
    </section>
  );
};
