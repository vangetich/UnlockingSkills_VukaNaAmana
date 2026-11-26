import React from 'react';
import { Award, CalendarClock, CheckCircle2, Lock } from 'lucide-react';
import type {
  BriefSubmission,
  MentorPairingRequest,
  MentorshipSession,
  MentorshipTrackSpec,
} from '../types/kora';

export interface MentorshipTrackMilestoneStep {
  id: string;
  order: number;
  title: string;
  requirementLabel: string;
  rewardLabel: string;
  rewardDetail: string;
  isCompleted: boolean;
  isCurrentTarget: boolean;
}

export interface MentorshipTrackProgress {
  trackId: string;
  domain: string;
  completionPct: number;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  masteredObjectivesCount: number;
  totalObjectivesCount: number;
  attendedSessionsCount: number;
  scheduledSessionsCount: number;
  targetSessionsCount: number;
  hasFormalPairing: boolean;
  completedDomainSprintsCount: number;
  milestones: MentorshipTrackMilestoneStep[];
  unlockedRewards: string[];
  nextMilestone: MentorshipTrackMilestoneStep | null;
  statusHeadline: string;
}

/**
 * Computes completion percentage, milestone step status, and unlocked session-sequence
 * rewards for a practitioner's chosen Mentorship Track. When `completedObjectiveIds` is
 * provided by `MentorshipMilestoneTracker`, completionPct synchronizes across both session
 * milestones and mastered learning objectives.
 */
export function computeMentorshipTrackProgress(input: {
  track: MentorshipTrackSpec;
  mentorshipSessions?: MentorshipSession[];
  mentorPairings?: MentorPairingRequest[];
  contributions?: BriefSubmission[];
  completedObjectiveIds?: string[];
  totalObjectivesCount?: number;
}): MentorshipTrackProgress {
  const {
    track,
    mentorshipSessions = [],
    mentorPairings = [],
    contributions = [],
    completedObjectiveIds,
    totalObjectivesCount = 6,
  } = input;

  const domainBriefIds = new Set(
    contributions
      .filter((c) => c.domain.toLowerCase() === track.domain.toLowerCase())
      .map((c) => c.briefId)
  );

  const trackSessions = mentorshipSessions.filter(
    (s) =>
      s.mentorId === track.mentorId ||
      domainBriefIds.has(s.sprintId) ||
      s.sprintId === `track-${track.domain.toLowerCase().replace(/\s+/g, '-')}`
  );

  const attendedSessionsCount = trackSessions.filter(
    (s) => s.status === 'attended'
  ).length;
  const scheduledSessionsCount = trackSessions.filter(
    (s) => s.status === 'scheduled'
  ).length;

  const hasFormalPairing = mentorPairings.some(
    (p) =>
      p.trackId === track.id ||
      p.domain.toLowerCase() === track.domain.toLowerCase()
  );

  const completedDomainSprintsCount = contributions.filter(
    (c) =>
      c.domain.toLowerCase() === track.domain.toLowerCase() &&
      c.status === 'completed'
  ).length;

  const step1Done = hasFormalPairing || attendedSessionsCount >= 1;
  const step2Done = attendedSessionsCount >= 1;
  const step3Done = attendedSessionsCount >= 2;
  const step4Done =
    attendedSessionsCount >= 3 ||
    (attendedSessionsCount >= 2 && completedDomainSprintsCount >= 1);

  const rawSteps: Array<Omit<MentorshipTrackMilestoneStep, 'isCurrentTarget'>> = [
    {
      id: 'step-pairing-kickoff',
      order: 1,
      title: 'Track Pairing & Kickoff',
      requirementLabel: 'Request pairing or attend 1st session',
      rewardLabel: 'Priority Pod Match',
      rewardDetail: 'Mentor desk brief aligned to your sprint deliverables',
      isCompleted: step1Done,
    },
    {
      id: 'step-qa-gate',
      order: 2,
      title: track.keyMilestones[0] || 'Architecture & Draft QA Gate',
      requirementLabel: '1 attended mentor session',
      rewardLabel: 'QA Blueprint Review',
      rewardDetail: 'Unlocks ~2.5h QA cycle acceleration on active drafts',
      isCompleted: step2Done,
    },
    {
      id: 'step-handover-signoff',
      order: 3,
      title: track.keyMilestones[1] || 'Handover & Rubric Sign-Off',
      requirementLabel: '2 attended mentor sessions',
      rewardLabel: 'Handover Endorsement',
      rewardDetail: 'Verified mentor sign-off added to Living Proof',
      isCompleted: step3Done,
    },
    {
      id: 'step-track-mastery',
      order: 4,
      title: track.keyMilestones[2] || 'Track Mastery Sequence',
      requirementLabel: '3 sessions or 2 sessions + completed sprint',
      rewardLabel: 'Senior Vouch & Priority Tag',
      rewardDetail: 'Featured track completion seal on Competency Passport',
      isCompleted: step4Done,
    },
  ];

  let assignedTarget = false;
  const milestones: MentorshipTrackMilestoneStep[] = rawSteps.map((step) => {
    if (!step.isCompleted && !assignedTarget) {
      assignedTarget = true;
      return { ...step, isCurrentTarget: true };
    }
    return { ...step, isCurrentTarget: false };
  });

  const completedMilestonesCount = milestones.filter((m) => m.isCompleted).length;
  const totalMilestonesCount = milestones.length;

  const hasSyncedObjectives = Array.isArray(completedObjectiveIds);
  const safeTotalObjectives = hasSyncedObjectives
    ? Math.max(1, totalObjectivesCount)
    : 0;
  const masteredObjectivesCount = hasSyncedObjectives
    ? Math.min(
        safeTotalObjectives,
        new Set(completedObjectiveIds.filter(Boolean)).size
      )
    : 0;

  const completionPct = hasSyncedObjectives
    ? Math.round(
        ((completedMilestonesCount + masteredObjectivesCount) /
          Math.max(1, totalMilestonesCount + safeTotalObjectives)) *
          100
      )
    : Math.round(
        (completedMilestonesCount / Math.max(1, totalMilestonesCount)) * 100
      );

  const unlockedRewards = milestones
    .filter((m) => m.isCompleted)
    .map((m) => m.rewardLabel);

  const nextMilestone = milestones.find((m) => m.isCurrentTarget) ?? null;

  const statusHeadline =
    completionPct === 100
      ? `Track mastered — all ${totalMilestonesCount} sequence rewards unlocked`
      : nextMilestone
        ? `Next unlock: ${nextMilestone.rewardLabel} (${nextMilestone.requirementLabel})`
        : hasSyncedObjectives && masteredObjectivesCount < safeTotalObjectives
          ? `Complete remaining learning objectives (${masteredObjectivesCount}/${safeTotalObjectives} mastered) to reach 100%`
          : 'Start your mentorship sequence';

  return {
    trackId: track.id,
    domain: track.domain,
    completionPct,
    completedMilestonesCount,
    totalMilestonesCount,
    masteredObjectivesCount,
    totalObjectivesCount: safeTotalObjectives,
    attendedSessionsCount,
    scheduledSessionsCount,
    targetSessionsCount: 3,
    hasFormalPairing,
    completedDomainSprintsCount,
    milestones,
    unlockedRewards,
    nextMilestone,
    statusHeadline,
  };
}

interface MentorshipProgressBarProps {
  track: MentorshipTrackSpec;
  mentorshipSessions?: MentorshipSession[];
  mentorPairings?: MentorPairingRequest[];
  contributions?: BriefSubmission[];
  completedObjectiveIds?: string[];
  onBookSessionClick?: () => void;
}

export const MentorshipProgressBar: React.FC<MentorshipProgressBarProps> = ({
  track,
  mentorshipSessions = [],
  mentorPairings = [],
  contributions = [],
  completedObjectiveIds,
  onBookSessionClick,
}) => {
  const progress = computeMentorshipTrackProgress({
    track,
    mentorshipSessions,
    mentorPairings,
    contributions,
    completedObjectiveIds,
  });

  return (
    <section
      aria-labelledby="mentorship-track-progress-heading"
      data-testid="mentorship-track-progress-bar"
      className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-4"
    >
      {/* Top Metric Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
              Mentorship Progress
            </span>
            <span className="text-[#8A847A]" aria-hidden="true">·</span>
            <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
              {progress.attendedSessionsCount}/{progress.targetSessionsCount} attended
              {progress.scheduledSessionsCount > 0
                ? ` · ${progress.scheduledSessionsCount} scheduled`
                : ''}
              {progress.totalObjectivesCount > 0
                ? ` · ${progress.masteredObjectivesCount}/${progress.totalObjectivesCount} objectives mastered`
                : ''}
            </span>
          </div>
          <h3
            id="mentorship-track-progress-heading"
            className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            {track.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            data-testid="mentorship-track-completion-pct"
            className="font-mono-tabular tabular-nums text-xl font-semibold text-[#146C53] dark:text-[#2EB88B]"
          >
            {progress.completionPct}%
          </span>
        </div>
      </div>

      {/* Linear Progress Track with Milestone Ticks */}
      <div className="space-y-1.5">
        <div
          role="progressbar"
          aria-label={`${track.title} completion`}
          aria-valuenow={progress.completionPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-2.5 w-full rounded-full bg-[#E8E3DB] dark:bg-[#2C3037] overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] transition-all duration-300"
            style={{ width: `${progress.completionPct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-[#575B62] dark:text-[#A3A7AE]">
            {progress.statusHeadline}
          </p>
          {onBookSessionClick && progress.completionPct < 100 && (
            <button
              type="button"
              data-testid="progress-bar-book-session-btn"
              onClick={onBookSessionClick}
              className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Book next session</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Milestone & Reward Sequence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {progress.milestones.map((step) => (
          <div
            key={step.id}
            data-testid={`track-milestone-${step.id}`}
            data-completed={step.isCompleted ? 'true' : 'false'}
            className={`rounded-lg border p-2.5 space-y-1.5 transition-colors ${
              step.isCompleted
                ? 'bg-[#E7F3EE]/65 dark:bg-[#142B24]/70 border-[#146C53]/35 dark:border-[#2EB88B]/40'
                : step.isCurrentTarget
                  ? 'bg-white dark:bg-[#1A1C20] border-[#C4622D]/45 dark:border-[#E07B46]/50'
                  : 'bg-white/60 dark:bg-[#16181C] border-[#E8E3DB] dark:border-[#2C3037]'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5 text-[11px]">
              <span className="font-mono-tabular tabular-nums font-semibold text-[#575B62] dark:text-[#A3A7AE]">
                0{step.order}
              </span>
              {step.isCompleted ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  <span>Unlocked</span>
                </span>
              ) : step.isCurrentTarget ? (
                <span className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                  Next Step
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#8A847A]">
                  <Lock className="w-3 h-3" aria-hidden="true" />
                  <span>Locked</span>
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
              {step.title}
            </p>

            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              {step.requirementLabel}
            </p>

            <div className="pt-1 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center gap-1.5 text-[11px]">
              <Award
                className={`w-3 h-3 shrink-0 ${
                  step.isCompleted
                    ? 'text-[#146C53] dark:text-[#2EB88B]'
                    : 'text-[#8A847A]'
                }`}
                aria-hidden="true"
              />
              <span
                className={
                  step.isCompleted
                    ? 'font-semibold text-[#146C53] dark:text-[#2EB88B]'
                    : 'font-medium text-[#575B62] dark:text-[#A3A7AE]'
                }
              >
                Reward: {step.rewardLabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
