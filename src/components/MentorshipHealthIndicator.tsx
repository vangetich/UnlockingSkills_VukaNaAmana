import React, { useMemo } from 'react';
import { Activity, ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { SprintSuccessTipPhase } from './MentorMessagingDrawer';

export interface MentorshipHealthAction {
  id: string;
  label: string;
  prompt: string;
}

export interface MentorshipHealthAssessment {
  status: 'strong' | 'active' | 'needs-checkin';
  statusLabel: string;
  summary: string;
  scorePercent: number;
  suggestedActions: MentorshipHealthAction[];
}

export interface MentorshipHealthIndicatorProps {
  sprintPhase: SprintSuccessTipPhase;
  messagesCount: number;
  attendedSessionsCount: number;
  agendasCount: number;
  milestoneReviewsCount: number;
  onSelectSuggestedAction: (prompt: string) => void;
}

const PHASE_SUGGESTED_ACTIONS: Record<SprintSuccessTipPhase, MentorshipHealthAction[]> = {
  kickoff: [
    {
      id: 'health-goal-clarification',
      label: 'Ask for clarification on goal',
      prompt:
        'Could we clarify the primary success metric and must-have deliverables for this sprint before I begin assembling my draft?',
    },
    {
      id: 'health-kickoff-screenshare',
      label: 'Request screen share',
      prompt:
        'Could we do a brief 10-minute screen share so I can walk through my initial plan and confirm I am aligned with the brief?',
    },
  ],
  building: [
    {
      id: 'health-build-screenshare',
      label: 'Request screen share',
      prompt:
        'Could we jump on a quick screen share? I want to walk through my current build progress and get your eyes on a key decision.',
    },
    {
      id: 'health-build-blockers',
      label: 'Ask about project blockers',
      prompt:
        'I ran into a specific blocker on my current milestone—could you suggest the fastest diagnostic step to unblock it?',
    },
    {
      id: 'health-build-goal',
      label: 'Ask for clarification on goal',
      prompt:
        'I want to make sure my current approach still matches the partner brief goal—could you review this trade-off quickly?',
    },
  ],
  'qa-review': [
    {
      id: 'health-qa-screenshare',
      label: 'Request screen share',
      prompt:
        'My draft is ready for verification—could we do a quick screen share to walk through edge cases against the QA rubric?',
    },
    {
      id: 'health-qa-clarify',
      label: 'Ask for clarification on goal',
      prompt:
        'Before final submission, could you clarify if any rubric requirement or evidence note still needs tightening?',
    },
  ],
  'wrap-up': [
    {
      id: 'health-wrap-endorse',
      label: 'Request competency endorsement',
      prompt:
        'Thank you for guiding this sprint—would you be willing to endorse the core skill I demonstrated for my Living Competency Passport?',
    },
    {
      id: 'health-wrap-next-goal',
      label: 'Ask for clarification on next track',
      prompt:
        'Based on our completed sprint, which formal mentorship track or next brief goal would strengthen my portfolio most?',
    },
  ],
};

export function evaluateMentorshipHealth(params: {
  sprintPhase: SprintSuccessTipPhase;
  messagesCount: number;
  attendedSessionsCount: number;
  agendasCount: number;
  milestoneReviewsCount: number;
}): MentorshipHealthAssessment {
  const {
    sprintPhase,
    messagesCount,
    attendedSessionsCount,
    agendasCount,
    milestoneReviewsCount,
  } = params;

  let score = 25;
  if (messagesCount >= 1) score += 20;
  if (messagesCount >= 3) score += 10;
  if (attendedSessionsCount >= 1) score += 20;
  if (agendasCount >= 1) score += 15;
  if (milestoneReviewsCount >= 1) score += 10;
  const scorePercent = Math.min(100, score);

  const suggestedActions = PHASE_SUGGESTED_ACTIONS[sprintPhase];

  if (scorePercent >= 75) {
    return {
      status: 'strong',
      statusLabel: 'Strong Rhythm',
      summary: 'Active mentor loop with clear alignment—keep momentum with a focused next step.',
      scorePercent,
      suggestedActions,
    };
  }

  if (scorePercent >= 45) {
    return {
      status: 'active',
      statusLabel: 'Building Momentum',
      summary: 'Good thread engagement—add a live walkthrough or goal check to speed up progress.',
      scorePercent,
      suggestedActions,
    };
  }

  return {
    status: 'needs-checkin',
    statusLabel: 'Ready for First Check-In',
    summary: 'Kick off early with a short goal check or screen-share request to prevent blockers.',
    scorePercent,
    suggestedActions,
  };
}

export const MentorshipHealthIndicator: React.FC<MentorshipHealthIndicatorProps> = ({
  sprintPhase,
  messagesCount,
  attendedSessionsCount,
  agendasCount,
  milestoneReviewsCount,
  onSelectSuggestedAction,
}) => {
  const health = useMemo(
    () =>
      evaluateMentorshipHealth({
        sprintPhase,
        messagesCount,
        attendedSessionsCount,
        agendasCount,
        milestoneReviewsCount,
      }),
    [sprintPhase, messagesCount, attendedSessionsCount, agendasCount, milestoneReviewsCount]
  );

  const toneClasses =
    health.status === 'strong'
      ? {
          badge:
            'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]',
          bar: 'bg-[#146C53] dark:bg-[#2EB88B]',
          icon: 'text-[#146C53] dark:text-[#2EB88B]',
        }
      : health.status === 'active'
        ? {
            badge:
              'bg-[#FAF8F5] dark:bg-[#121315] border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[#146C53] dark:text-[#2EB88B]',
            bar: 'bg-[#146C53] dark:bg-[#2EB88B]',
            icon: 'text-[#146C53] dark:text-[#2EB88B]',
          }
        : {
            badge:
              'bg-[#F9ECE5] dark:bg-[#2D1E17] border-[#C4622D]/30 dark:border-[#E07B46]/35 text-[#C4622D] dark:text-[#E07B46]',
            bar: 'bg-[#C4622D] dark:bg-[#E07B46]',
            icon: 'text-[#C4622D] dark:text-[#E07B46]',
          };

  return (
    <section
      aria-label="Mentorship Health Indicator"
      data-testid="mentorship-health-indicator"
      data-health-status={health.status}
      className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {health.status === 'strong' ? (
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${toneClasses.icon}`} aria-hidden="true" />
          ) : (
            <Activity className={`w-3.5 h-3.5 shrink-0 ${toneClasses.icon}`} aria-hidden="true" />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#17191C] dark:text-[#F4F2EE] truncate">
            Mentorship Health
          </span>
        </div>

        <span
          data-testid="mentorship-health-status-pill"
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap shrink-0 ${toneClasses.badge}`}
        >
          <span>{health.statusLabel}</span>
          <span className="font-mono-tabular tabular-nums opacity-85">{health.scorePercent}%</span>
        </span>
      </div>

      {/* Compact Cadence Bar */}
      <div
        className="w-full h-1.5 rounded-full bg-[#E8E3DB]/80 dark:bg-[#22252A] overflow-hidden"
        role="progressbar"
        aria-label="Mentorship cadence health score"
        aria-valuenow={health.scorePercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${toneClasses.bar}`}
          style={{ width: `${health.scorePercent}%` }}
        />
      </div>

      <p className="text-[11px] leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
        {health.summary}
      </p>

      {/* Context-Aware Suggested Mentee Actions */}
      <div className="space-y-1.5 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C4622D] dark:text-[#E07B46]" aria-hidden="true" />
          <span>Suggested Next Actions</span>
        </p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested mentorship actions">
          {health.suggestedActions.map((action) => (
            <button
              key={action.id}
              type="button"
              data-testid={`health-action-${action.id}`}
              onClick={() => onSelectSuggestedAction(action.prompt)}
              className="min-h-[28px] px-2.5 py-1 rounded-lg border border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{action.label}</span>
              <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
