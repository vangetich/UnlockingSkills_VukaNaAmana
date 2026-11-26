import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import type { BriefSubmission, SprintMilestoneKey } from '../types/kora';
import {
  SPRINT_MILESTONE_STEPS,
  getSprintDurationDays,
  normalizeSprintMilestones,
} from '../utils/talentEngine';

export type SprintReminderUrgency = 'overdue' | 'urgent' | 'approaching';

export interface SprintReminderItem {
  contributionId: string;
  briefId: string;
  briefTitle: string;
  domain: string;
  deadlineIso: string;
  hoursRemaining: number;
  remainingLabel: string;
  urgency: SprintReminderUrgency;
  completedPhaseCount: number;
  totalPhaseCount: number;
  completedMilestones: SprintMilestoneKey[];
  phaseStatusLabel: string;
  nextPhaseAction: string;
  guidanceNote: string;
}

export interface ComputeSprintRemindersInput {
  contributions: BriefSubmission[];
  sprintMilestonesByBrief?: Record<string, SprintMilestoneKey[]>;
  nowMs?: number;
  warningThresholdHours?: number;
}

function formatTimeRemaining(hoursRemaining: number): string {
  if (hoursRemaining <= 0) return 'Due today';
  if (hoursRemaining === 1) return '1h left';
  if (hoursRemaining < 24) return `${hoursRemaining}h left`;
  const days = Math.floor(hoursRemaining / 24);
  const remHours = hoursRemaining % 24;
  return remHours > 0 ? `${days}d ${remHours}h left` : `${days}d left`;
}

/**
 * Pure reminder calculator that inspects active sprints nearing their deadline
 * and reads `sprintMilestonesByBrief` to derive exact project phase status.
 */
export function computeSprintReminders(
  input: ComputeSprintRemindersInput
): SprintReminderItem[] {
  const {
    contributions = [],
    sprintMilestonesByBrief = {},
    nowMs = Date.now(),
    warningThresholdHours = 72,
  } = input;

  const totalPhaseCount = SPRINT_MILESTONE_STEPS.length;
  const reminders: SprintReminderItem[] = [];

  for (const item of contributions) {
    if (item.status !== 'in-progress') continue;

    let deadlineMs: number;
    if (item.deadlineIso && !Number.isNaN(Date.parse(item.deadlineIso))) {
      deadlineMs = Date.parse(item.deadlineIso);
    } else {
      const startMs = Date.parse(item.createdAtIso);
      if (Number.isNaN(startMs)) continue;
      deadlineMs = startMs + getSprintDurationDays(item.briefId) * 86_400_000;
    }

    const diffMs = deadlineMs - nowMs;
    const hoursRemaining = Math.ceil(diffMs / 3_600_000);
    if (hoursRemaining > warningThresholdHours) continue;

    const rawMilestones =
      sprintMilestonesByBrief[item.briefId] ?? item.milestonesDone;
    const completedMilestones = normalizeSprintMilestones(rawMilestones, false);
    const completedPhaseCount = completedMilestones.length;

    const nextStep = SPRINT_MILESTONE_STEPS.find(
      (s) => !completedMilestones.includes(s.key)
    );

    const lastCompletedStep = [...SPRINT_MILESTONE_STEPS]
      .reverse()
      .find((s) => completedMilestones.includes(s.key));

    const phaseStatusLabel =
      completedPhaseCount === 0
        ? `Phase 0/${totalPhaseCount} · Not Started`
        : completedPhaseCount >= totalPhaseCount
          ? `Phase ${totalPhaseCount}/${totalPhaseCount} · Ready to Submit`
          : `Phase ${completedPhaseCount}/${totalPhaseCount} · ${lastCompletedStep?.label ?? 'In Progress'}`;

    const nextPhaseAction = nextStep
      ? `Next phase: ${nextStep.label}`
      : 'All phases checked — submit your final deliverable';

    const urgency: SprintReminderUrgency =
      hoursRemaining <= 0
        ? 'overdue'
        : hoursRemaining <= 24
          ? 'urgent'
          : 'approaching';

    const guidanceNote =
      completedPhaseCount === 0
        ? 'Start by confirming baseline analysis checkpoints in the workbench.'
        : completedPhaseCount < totalPhaseCount
          ? `Complete "${nextStep?.label ?? 'remaining steps'}" before deadline sign-off.`
          : 'All milestones checked — review notes and submit to release escrow.';

    reminders.push({
      contributionId: item.id,
      briefId: item.briefId,
      briefTitle: item.briefTitle || 'Active Solution Sprint',
      domain: item.domain || 'Field Ops',
      deadlineIso: new Date(deadlineMs).toISOString(),
      hoursRemaining,
      remainingLabel: formatTimeRemaining(hoursRemaining),
      urgency,
      completedPhaseCount,
      totalPhaseCount,
      completedMilestones,
      phaseStatusLabel,
      nextPhaseAction,
      guidanceNote,
    });
  }

  return reminders.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
}

interface SprintRemindersProps {
  contributions: BriefSubmission[];
  sprintMilestonesByBrief: Record<string, SprintMilestoneKey[]>;
  onSelectSprint: (briefId: string) => void;
}

export const SprintReminders: React.FC<SprintRemindersProps> = ({
  contributions,
  sprintMilestonesByBrief,
  onSelectSprint,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});

  const reminders = useMemo(
    () =>
      computeSprintReminders({
        contributions,
        sprintMilestonesByBrief,
      }),
    [contributions, sprintMilestonesByBrief]
  );

  const visibleReminders = useMemo(
    () => reminders.filter((r) => !dismissedIds[r.contributionId]),
    [reminders, dismissedIds]
  );

  if (visibleReminders.length === 0) return null;

  return (
    <section
      aria-labelledby="sprint-reminders-heading"
      data-testid="sprint-reminders-banner"
      className="rounded-2xl bg-[#F9ECE5]/75 dark:bg-[#2D1E17]/75 border border-[#C4622D]/35 dark:border-[#E07B46]/35 p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46] shrink-0"
            aria-hidden="true"
          />
          <h2
            id="sprint-reminders-heading"
            className="text-xs sm:text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            Sprint Deadline Reminders ({visibleReminders.length} active)
          </h2>
        </div>
        <span className="text-[11px] text-[#575B62] dark:text-[#C4C9D0]">
          Phase status synced from your milestone checkpoints
        </span>
      </div>

      <ul className="space-y-2.5">
        {visibleReminders.map((reminder) => {
          const isReadyToSubmit =
            reminder.completedPhaseCount >= reminder.totalPhaseCount;

          return (
            <li
              key={reminder.contributionId}
              data-testid={`sprint-reminder-item-${reminder.briefId}`}
              data-urgency={reminder.urgency}
              className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 font-mono-tabular tabular-nums font-semibold ${
                      reminder.urgency === 'overdue' || reminder.urgency === 'urgent'
                        ? 'text-[#B42318] dark:text-[#F97066]'
                        : 'text-[#C4622D] dark:text-[#E07B46]'
                    }`}
                  >
                    <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{reminder.remainingLabel}</span>
                  </span>
                  <span aria-hidden="true" className="text-[#8A847A]">
                    ·
                  </span>
                  <span
                    data-testid={`sprint-reminder-phase-${reminder.briefId}`}
                    className={`inline-flex items-center gap-1 font-mono-tabular tabular-nums font-semibold ${
                      isReadyToSubmit
                        ? 'text-[#146C53] dark:text-[#2EB88B]'
                        : 'text-[#17191C] dark:text-[#F4F2EE]'
                    }`}
                  >
                    {isReadyToSubmit && (
                      <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    )}
                    <span>{reminder.phaseStatusLabel}</span>
                  </span>
                  <span aria-hidden="true" className="text-[#8A847A]">
                    ·
                  </span>
                  <span className="text-[#575B62] dark:text-[#A3A7AE]">
                    {reminder.domain}
                  </span>
                </div>

                <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                  {reminder.briefTitle}
                </p>

                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    {reminder.nextPhaseAction}
                  </strong>{' '}
                  — {reminder.guidanceNote}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid={`sprint-reminder-open-${reminder.briefId}`}
                  onClick={() => onSelectSprint(reminder.briefId)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Open in Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDismissedIds((prev) => ({
                      ...prev,
                      [reminder.contributionId]: true,
                    }))
                  }
                  aria-label={`Dismiss deadline reminder for ${reminder.briefTitle}`}
                  className="min-h-[38px] min-w-[38px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
