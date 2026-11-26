import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  MessageSquareShare,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import type {
  MentorMilestoneFeedback,
  MentorRatingScore,
  MilestoneFeedbackReadiness,
  PodMentorProfile,
  SprintMilestoneKey,
} from '../types/kora';
import { isValidFirebaseId, sanitizeText } from '../utils/talentEngine';

export interface ProjectMilestoneMeta {
  key: SprintMilestoneKey;
  stepNumber: 1 | 2 | 3;
  title: string;
  gateLabel: string;
  focusCriteria: string;
  defaultStrengths: string;
  defaultConstructive: string;
  defaultNextAction: string;
}

export const PROJECT_MILESTONE_CATALOG: Record<SprintMilestoneKey, ProjectMilestoneMeta> = {
  'analysis-complete': {
    key: 'analysis-complete',
    stepNumber: 1,
    title: 'Milestone 1 · Problem Framing & Diagnostic Baseline',
    gateLabel: 'Gate 1 · Diagnostic Baseline',
    focusCriteria: 'Root-cause isolation, field telemetry reading, and scoped diagnostic table.',
    defaultStrengths:
      'Methodical root-cause isolation from field logs with clear baseline measurements and safety constraint checks.',
    defaultConstructive:
      'Add ambient load/condition delta notes so the site team can compare peak vs. off-peak operating behavior.',
    defaultNextAction:
      'Advance to Milestone 2 (Working Deliverable & Pod QA Review) and attach the draft remediation schematic.',
  },
  'draft-ready': {
    key: 'draft-ready',
    stepNumber: 2,
    title: 'Milestone 2 · Working Deliverable & Pod QA Review',
    gateLabel: 'Gate 2 · Working Deliverable',
    focusCriteria: 'Technical accuracy, implementation feasibility, and peer/mentor QA verification.',
    defaultStrengths:
      'Working deliverable meets technical specification with reproducible test steps and clear component tolerances.',
    defaultConstructive:
      'Tighten edge-case fallback steps in the technician checklist before final partner handover.',
    defaultNextAction:
      'Complete final QA verification items and package the Milestone 3 Partner Handover bundle.',
  },
  'final-submission': {
    key: 'final-submission',
    stepNumber: 3,
    title: 'Milestone 3 · Final Partner Handover Package',
    gateLabel: 'Gate 3 · Partner Handover',
    focusCriteria: 'Documentation completeness, operational handover readiness, and escrow release sign-off.',
    defaultStrengths:
      'Complete, audit-ready partner handover package co-signed for immediate deployment and escrow release.',
    defaultConstructive:
      'Document key lessons learned in your Mentorship Journal and claim your Digital Skill Badge in the Competency Passport.',
    defaultNextAction:
      'Milestone loop closed — sprint cleared for final partner sign-off and Competency Passport endorsement.',
  },
};

export const MILESTONE_READINESS_META: Record<
  MilestoneFeedbackReadiness,
  {
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  exemplary: {
    label: 'Exemplary · Exceeds Pod Bar',
    shortLabel: 'Exemplary',
    description: 'Benchmark execution ready for immediate partner showcase and lead pod consideration.',
  },
  approved: {
    label: 'Approved for Next Gate',
    shortLabel: 'Approved',
    description: 'Meets all milestone acceptance criteria; cleared to advance to the next project gate.',
  },
  'needs-revision': {
    label: 'Targeted Revision Requested',
    shortLabel: 'Needs Revision',
    description: 'Actionable adjustments required before co-signing this milestone gate.',
  },
};

export interface MilestoneFeedbackDraftInput {
  sprintId: string;
  sprintTitle: string;
  milestoneKey: SprintMilestoneKey;
  mentorId: string;
  mentorName: string;
  rating: number;
  readinessStatus: MilestoneFeedbackReadiness;
  strengthsNote: string;
  constructiveFeedback: string;
  nextMilestoneAction?: string;
}

export function validateAndFormatMilestoneFeedback(input: MilestoneFeedbackDraftInput): {
  valid: boolean;
  error?: string;
  formatted?: Omit<MentorMilestoneFeedback, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>;
} {
  const safeSprintId = sanitizeText(input.sprintId, 128);
  if (!safeSprintId || !isValidFirebaseId(safeSprintId)) {
    return { valid: false, error: 'Valid sprint identifier is required.' };
  }

  const safeSprintTitle = sanitizeText(input.sprintTitle, 160) || 'Solution Sprint';
  const allowedMilestones: SprintMilestoneKey[] = [
    'analysis-complete',
    'draft-ready',
    'final-submission',
  ];
  const safeMilestoneKey: SprintMilestoneKey = allowedMilestones.includes(input.milestoneKey)
    ? input.milestoneKey
    : 'analysis-complete';

  const safeMentorId =
    input.mentorId && isValidFirebaseId(input.mentorId) ? input.mentorId : 'mentor-green-01';
  const safeMentorName = sanitizeText(input.mentorName, 80) || 'Senior Specialist';

  const numericRating = Math.round(Number(input.rating));
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return { valid: false, error: 'Milestone rating must be between 1 and 5.' };
  }
  const safeRating = numericRating as MentorRatingScore;

  const allowedStatuses: MilestoneFeedbackReadiness[] = [
    'approved',
    'needs-revision',
    'exemplary',
  ];
  const safeReadiness: MilestoneFeedbackReadiness = allowedStatuses.includes(
    input.readinessStatus
  )
    ? input.readinessStatus
    : 'approved';

  const safeStrengths = sanitizeText(input.strengthsNote, 500);
  if (safeStrengths.length < 5) {
    return {
      valid: false,
      error: 'Observed strengths note must be at least 5 characters.',
    };
  }

  const safeConstructive = sanitizeText(input.constructiveFeedback, 1000);
  if (safeConstructive.length < 10) {
    return {
      valid: false,
      error: 'Constructive feedback must be at least 10 characters.',
    };
  }

  const defaultAction = PROJECT_MILESTONE_CATALOG[safeMilestoneKey].defaultNextAction;
  const safeNextAction =
    sanitizeText(input.nextMilestoneAction ?? defaultAction, 500) || defaultAction;

  return {
    valid: true,
    formatted: {
      sprintId: safeSprintId,
      sprintTitle: safeSprintTitle,
      milestoneKey: safeMilestoneKey,
      mentorId: safeMentorId,
      mentorName: safeMentorName,
      rating: safeRating,
      readinessStatus: safeReadiness,
      strengthsNote: safeStrengths,
      constructiveFeedback: safeConstructive,
      nextMilestoneAction: safeNextAction,
    },
  };
}

export interface MilestoneFeedbackLoopSummary {
  totalReviews: number;
  averageRating: number;
  coveredMilestonesCount: number;
  approvedOrExemplaryCount: number;
  revisionRequestedCount: number;
  loopClosedPct: number;
}

export function computeMilestoneFeedbackLoopSummary(
  feedbackList: MentorMilestoneFeedback[],
  sprintId?: string
): MilestoneFeedbackLoopSummary {
  const scoped = sprintId
    ? feedbackList.filter((item) => item.sprintId === sprintId)
    : feedbackList;

  if (scoped.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      coveredMilestonesCount: 0,
      approvedOrExemplaryCount: 0,
      revisionRequestedCount: 0,
      loopClosedPct: 0,
    };
  }

  const totalRating = scoped.reduce((acc, item) => acc + item.rating, 0);
  const averageRating = Number((totalRating / scoped.length).toFixed(1));
  const coveredMilestones = new Set(scoped.map((item) => item.milestoneKey));
  const approvedOrExemplaryCount = scoped.filter(
    (item) => item.readinessStatus === 'approved' || item.readinessStatus === 'exemplary'
  ).length;
  const revisionRequestedCount = scoped.filter(
    (item) => item.readinessStatus === 'needs-revision'
  ).length;
  const loopClosedPct = Math.min(100, Math.round((coveredMilestones.size / 3) * 100));

  return {
    totalReviews: scoped.length,
    averageRating,
    coveredMilestonesCount: coveredMilestones.size,
    approvedOrExemplaryCount,
    revisionRequestedCount,
    loopClosedPct,
  };
}

export function formatMilestoneFeedbackForChat(
  feedback: Omit<MentorMilestoneFeedback, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>
): string {
  const milestoneMeta = PROJECT_MILESTONE_CATALOG[feedback.milestoneKey];
  const statusMeta = MILESTONE_READINESS_META[feedback.readinessStatus];
  return `[Milestone Feedback · ${milestoneMeta.gateLabel} · ${feedback.rating}/5 ★ · ${statusMeta.shortLabel}] Strengths: ${feedback.strengthsNote} | Constructive Guidance: ${feedback.constructiveFeedback} | Next Step: ${feedback.nextMilestoneAction}`;
}

export interface MentorDashboardFeedbackProps {
  sprintId: string;
  sprintTitle: string;
  mentor: PodMentorProfile;
  menteeName?: string;
  feedbackEntries: MentorMilestoneFeedback[];
  onSubmitFeedback: (
    draft: Omit<MentorMilestoneFeedback, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>,
    shareToThread: boolean
  ) => void;
  onDeleteFeedback?: (feedbackId: string) => void;
}

export const MentorDashboardFeedback: React.FC<MentorDashboardFeedbackProps> = ({
  sprintId,
  sprintTitle,
  mentor,
  menteeName = 'Practitioner',
  feedbackEntries,
  onSubmitFeedback,
  onDeleteFeedback,
}) => {
  const sprintFeedbackList = useMemo(
    () =>
      feedbackEntries
        .filter((f) => f.sprintId === sprintId)
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
    [feedbackEntries, sprintId]
  );

  const summary = useMemo(
    () => computeMilestoneFeedbackLoopSummary(feedbackEntries, sprintId),
    [feedbackEntries, sprintId]
  );

  const [selectedMilestone, setSelectedMilestone] =
    useState<SprintMilestoneKey>('analysis-complete');
  const [rating, setRating] = useState<MentorRatingScore>(5);
  const [readinessStatus, setReadinessStatus] =
    useState<MilestoneFeedbackReadiness>('approved');
  const [strengthsNote, setStrengthsNote] = useState<string>(
    PROJECT_MILESTONE_CATALOG['analysis-complete'].defaultStrengths
  );
  const [constructiveFeedback, setConstructiveFeedback] = useState<string>(
    PROJECT_MILESTONE_CATALOG['analysis-complete'].defaultConstructive
  );
  const [nextMilestoneAction, setNextMilestoneAction] = useState<string>(
    PROJECT_MILESTONE_CATALOG['analysis-complete'].defaultNextAction
  );
  const [shareToThread, setShareToThread] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedBannerText, setSavedBannerText] = useState<string | null>(null);

  const handleSelectMilestone = (key: SprintMilestoneKey) => {
    setSelectedMilestone(key);
    const existingForMilestone = sprintFeedbackList.find((f) => f.milestoneKey === key);
    const meta = PROJECT_MILESTONE_CATALOG[key];
    if (existingForMilestone) {
      setRating(existingForMilestone.rating);
      setReadinessStatus(existingForMilestone.readinessStatus);
      setStrengthsNote(existingForMilestone.strengthsNote);
      setConstructiveFeedback(existingForMilestone.constructiveFeedback);
      setNextMilestoneAction(existingForMilestone.nextMilestoneAction);
    } else {
      setRating(5);
      setReadinessStatus('approved');
      setStrengthsNote(meta.defaultStrengths);
      setConstructiveFeedback(meta.defaultConstructive);
      setNextMilestoneAction(meta.defaultNextAction);
    }
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAndFormatMilestoneFeedback({
      sprintId,
      sprintTitle,
      milestoneKey: selectedMilestone,
      mentorId: mentor.id,
      mentorName: mentor.name,
      rating,
      readinessStatus,
      strengthsNote,
      constructiveFeedback,
      nextMilestoneAction,
    });

    if (!validation.valid || !validation.formatted) {
      setErrorMsg(validation.error ?? 'Please complete all milestone feedback fields.');
      return;
    }

    onSubmitFeedback(validation.formatted, shareToThread);
    setErrorMsg(null);
    const gateLabel = PROJECT_MILESTONE_CATALOG[selectedMilestone].gateLabel;
    setSavedBannerText(
      `${gateLabel} feedback (${validation.formatted.rating}/5 ★) logged${
        shareToThread ? ' and shared to Direct Thread' : ''
      }.`
    );
    setTimeout(() => {
      setSavedBannerText(null);
    }, 4500);
  };

  const activeMilestoneMeta = PROJECT_MILESTONE_CATALOG[selectedMilestone];

  return (
    <div
      data-testid="mentor-dashboard-feedback"
      className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
    >
      {/* Feedback Loop Summary Header */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Mentor Milestone Feedback Loop
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              Structured ratings & constructive milestone reviews from{' '}
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {mentor.name}
              </span>{' '}
              for <span className="font-semibold text-stone-900 dark:text-stone-100">{menteeName}</span>.
            </p>
          </div>
          <div
            data-testid="milestone-feedback-loop-pct"
            className="text-right font-mono tabular-nums"
          >
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {summary.loopClosedPct}% Loop Closed
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              {summary.coveredMilestonesCount}/3 gates ·{' '}
              {summary.averageRating > 0 ? `${summary.averageRating}/5.0 ★` : 'No ratings yet'}
            </div>
          </div>
        </div>

        {/* 3-Gate Progress Bar */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(['analysis-complete', 'draft-ready', 'final-submission'] as SprintMilestoneKey[]).map(
            (mKey) => {
              const meta = PROJECT_MILESTONE_CATALOG[mKey];
              const matching = sprintFeedbackList.find((f) => f.milestoneKey === mKey);
              const isSelected = selectedMilestone === mKey;

              return (
                <button
                  key={mKey}
                  type="button"
                  data-testid={`select-milestone-gate-${mKey}`}
                  onClick={() => handleSelectMilestone(mKey)}
                  className={`text-left rounded-lg border p-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-700/10 text-stone-900 dark:text-stone-100'
                      : matching
                        ? 'border-emerald-700/30 bg-emerald-950/[0.03] dark:bg-emerald-950/20 text-stone-800 dark:text-stone-200'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                      Gate {meta.stepNumber}
                    </span>
                    {matching ? (
                      <span className="text-[10px] font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        {matching.rating}/5 ★
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-stone-400">Pending</span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold truncate mt-0.5">
                    {meta.gateLabel.replace(/^Gate \d · /, '')}
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Confirmation Banner */}
      {savedBannerText && (
        <div
          data-testid="milestone-feedback-saved-banner"
          className="flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-700/10 px-3.5 py-2.5 text-xs text-emerald-900 dark:text-emerald-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>{savedBannerText}</span>
        </div>
      )}

      {/* Structured Milestone Feedback Form */}
      <form
        data-testid="milestone-feedback-form"
        onSubmit={handleSubmit}
        className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3.5"
      >
        <div className="border-b border-stone-200/80 dark:border-stone-800 pb-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
            {activeMilestoneMeta.title}
          </span>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Evaluation Focus: {activeMilestoneMeta.focusCriteria}
          </p>
        </div>

        {/* 1-5 Star Rating & Gate Readiness Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
              Milestone Quality Rating (1–5)
            </span>
            <div className="flex items-center gap-1.5">
              {([1, 2, 3, 4, 5] as MentorRatingScore[]).map((score) => {
                const active = score <= rating;
                return (
                  <button
                    key={score}
                    type="button"
                    data-testid={`milestone-rating-star-${score}`}
                    onClick={() => setRating(score)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-400'
                    }`}
                    aria-label={`Rate milestone ${score} out of 5`}
                  >
                    <Star className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
                  </button>
                );
              })}
              <span
                data-testid="milestone-selected-rating-value"
                className="ml-1.5 text-xs font-mono tabular-nums font-bold text-stone-800 dark:text-stone-200"
              >
                {rating}.0 / 5.0
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="milestone-readiness-select"
              className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5"
            >
              Gate Readiness Decision
            </label>
            <select
              id="milestone-readiness-select"
              data-testid="milestone-readiness-select"
              value={readinessStatus}
              onChange={(e) =>
                setReadinessStatus(e.target.value as MilestoneFeedbackReadiness)
              }
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
            >
              {(Object.keys(MILESTONE_READINESS_META) as MilestoneFeedbackReadiness[]).map(
                (statusKey) => (
                  <option key={statusKey} value={statusKey}>
                    {MILESTONE_READINESS_META[statusKey].label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Observed Strengths */}
        <div>
          <label
            htmlFor="milestone-strengths-input"
            className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1"
          >
            Observed Technical & Execution Strengths
          </label>
          <textarea
            id="milestone-strengths-input"
            data-testid="milestone-strengths-input"
            rows={2}
            maxLength={500}
            value={strengthsNote}
            onChange={(e) => setStrengthsNote(e.target.value)}
            placeholder="Highlight what the mentee executed well on this milestone..."
            className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Constructive Feedback */}
        <div>
          <label
            htmlFor="milestone-constructive-input"
            className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1"
          >
            Constructive Feedback & Refinement Guidance
          </label>
          <textarea
            id="milestone-constructive-input"
            data-testid="milestone-constructive-input"
            rows={2}
            maxLength={1000}
            value={constructiveFeedback}
            onChange={(e) => setConstructiveFeedback(e.target.value)}
            placeholder="Provide specific, actionable guidance to strengthen the deliverable..."
            className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Next Milestone Action Item */}
        <div>
          <label
            htmlFor="milestone-next-action-input"
            className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1"
          >
            Next Milestone Action to Close Loop
          </label>
          <input
            id="milestone-next-action-input"
            data-testid="milestone-next-action-input"
            type="text"
            maxLength={500}
            value={nextMilestoneAction}
            onChange={(e) => setNextMilestoneAction(e.target.value)}
            placeholder="Concrete next step for the mentee..."
            className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Close the loop toggle: Post summary to Direct Thread */}
        <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer select-none">
          <input
            type="checkbox"
            data-testid="milestone-share-to-thread-checkbox"
            checked={shareToThread}
            onChange={(e) => setShareToThread(e.target.checked)}
            className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
          />
          <MessageSquareShare className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>
            Also post structured milestone feedback summary to Direct Thread to close the feedback loop
          </span>
        </label>

        {errorMsg && (
          <p
            data-testid="milestone-feedback-error"
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            {errorMsg}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            data-testid="submit-milestone-feedback-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Record Milestone Feedback</span>
          </button>
        </div>
      </form>

      {/* Recorded Milestone Feedback History for Active Sprint */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Recorded Milestone Reviews ({sprintFeedbackList.length})
          </h5>
          <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
            {sprintTitle}
          </span>
        </div>

        {sprintFeedbackList.length === 0 ? (
          <div
            data-testid="empty-milestone-feedback"
            className="rounded-xl border border-dashed border-stone-300 dark:border-stone-800 p-4 text-center text-xs text-stone-500 dark:text-stone-400"
          >
            No milestone reviews recorded for this sprint yet. Select a milestone gate above to log structured mentor feedback.
          </div>
        ) : (
          <div
            data-testid="milestone-feedback-history-list"
            className="space-y-2.5"
          >
            {sprintFeedbackList.map((item) => {
              const mMeta =
                PROJECT_MILESTONE_CATALOG[item.milestoneKey] ??
                PROJECT_MILESTONE_CATALOG['analysis-complete'];
              const sMeta =
                MILESTONE_READINESS_META[item.readinessStatus] ??
                MILESTONE_READINESS_META.approved;

              return (
                <div
                  key={item.id}
                  data-testid={`milestone-feedback-card-${item.id}`}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                        {mMeta.gateLabel} ·{' '}
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {item.rating}.0/5.0 ★
                        </span>{' '}
                        ·{' '}
                        <span
                          className={
                            item.readinessStatus === 'needs-revision'
                              ? 'font-semibold text-amber-700 dark:text-amber-300'
                              : 'font-semibold text-emerald-700 dark:text-emerald-400'
                          }
                        >
                          {sMeta.shortLabel}
                        </span>
                      </div>
                      <h6 className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                        {mMeta.title}
                      </h6>
                    </div>

                    {onDeleteFeedback && !item.id.startsWith('mmfb-seed-') && (
                      <button
                        type="button"
                        data-testid={`delete-milestone-feedback-${item.id}`}
                        onClick={() => onDeleteFeedback(item.id)}
                        title="Remove milestone feedback"
                        className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1">
                    <p>
                      <strong className="text-stone-900 dark:text-stone-100">Strengths:</strong>{' '}
                      {item.strengthsNote}
                    </p>
                    <p>
                      <strong className="text-stone-900 dark:text-stone-100">
                        Constructive Guidance:
                      </strong>{' '}
                      {item.constructiveFeedback}
                    </p>
                    {item.nextMilestoneAction && (
                      <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                        <strong>Next Gate Action:</strong> {item.nextMilestoneAction}
                      </p>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
                    <span>Reviewed by {item.mentorName}</span>
                    <span className="tabular-nums">{item.updatedAtIso.slice(0, 10)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboardFeedback;
