import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Compass,
  HelpCircle,
  Link2,
  Lock,
  Users,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type {
  BriefSubmission,
  MentorshipSession,
  ProblemBrief,
  SolutionSprint,
  SprintMilestoneKey,
} from '../types/kora';
import {
  SPRINT_MILESTONE_STEPS,
  getSprintDurationDays,
  normalizeSprintMilestones,
} from '../utils/talentEngine';

export type SprintMilestoneTaskStatus =
  | 'completed'
  | 'in-progress'
  | 'delayed'
  | 'upcoming'
  | 'mentorship-required';

export type SprintMilestoneFilter = 'all' | 'active' | 'completed';

export interface SprintMilestoneStatusExplanation {
  title: string;
  description: string;
}

export const SPRINT_MILESTONE_STATUS_EXPLANATIONS: Record<
  SprintMilestoneTaskStatus,
  SprintMilestoneStatusExplanation
> = {
  'in-progress': {
    title: 'In Progress · Active Verification Phase',
    description:
      'Current priority milestone. Complete this deliverable and document your work so your pod mentor can verify readiness before the next gate.',
  },
  completed: {
    title: 'Completed · Deliverable Checked',
    description:
      'Marked complete toward your pod sprint submission. All completed milestones are included in final mentor QA and escrow verification.',
  },
  delayed: {
    title: 'Delayed · Deadline Attention Needed',
    description:
      'Past due or within 24 hours of the sprint deadline. Complete and log this milestone now or message your mentor to keep escrow release on schedule.',
  },
  upcoming: {
    title: 'Up Next · Queued Verification Step',
    description:
      'Scheduled for the next verification stage once earlier active sprint milestones are checked off.',
  },
  'mentorship-required': {
    title: 'Mentorship Required · QA Session Prerequisite',
    description:
      'Requires at least one attended mentor QA session for this sprint before this milestone can be marked complete and submitted for escrow verification.',
  },
};

export function getMilestoneStatusExplanation(
  status: SprintMilestoneTaskStatus
): SprintMilestoneStatusExplanation {
  return SPRINT_MILESTONE_STATUS_EXPLANATIONS[status];
}

export function filterSprintMilestoneTasks(
  tasks: SprintMilestoneTask[],
  filter: SprintMilestoneFilter
): SprintMilestoneTask[] {
  if (filter === 'completed') {
    return tasks.filter((task) => task.completed || task.status === 'completed');
  }
  if (filter === 'active') {
    return tasks.filter((task) => !task.completed && task.status !== 'completed');
  }
  return tasks;
}

export function getSprintMilestoneFilterCounts(tasks: SprintMilestoneTask[]): {
  all: number;
  active: number;
  completed: number;
} {
  const completed = tasks.filter(
    (task) => task.completed || task.status === 'completed'
  ).length;
  const all = tasks.length;
  return {
    all,
    active: all - completed,
    completed,
  };
}

export type SprintMilestoneDependencyState = 'root' | 'unlocked' | 'locked';

export interface SprintMilestoneTask {
  id: string;
  order: number;
  title: string;
  phaseKey: SprintMilestoneKey;
  phaseLabel: string;
  guidance: string;
  ownerRoleLabel: string;
  completed: boolean;
  status: SprintMilestoneTaskStatus;
  statusLabel: string;
  dependsOnOrder: number | null;
  dependsOnTitle: string | null;
  dependencyState: SprintMilestoneDependencyState;
  dependencyLabel: string;
  isLocked: boolean;
  requiresMentorship: boolean;
  mentorshipMet: boolean;
  isMentorshipLocked: boolean;
  mentorshipPrerequisiteLabel: string | null;
  isMentorshipAccelerated: boolean;
  estimatedTimeSavingsHours: number;
  estimatedTimeSavingsLabel: string | null;
  recommendedMentorFocus: string | null;
  mentorshipAccelerationNote: string | null;
}

export interface MentorshipPathSummary {
  acceleratedCount: number;
  remainingAcceleratedCount: number;
  totalEstimatedHoursSaved: number;
  remainingEstimatedHoursSaved: number;
}

export function getMentorshipPathSummary(
  tasks: SprintMilestoneTask[]
): MentorshipPathSummary {
  const accelerated = tasks.filter((t) => t.isMentorshipAccelerated);
  const remaining = accelerated.filter((t) => !t.completed);
  const sumHours = (list: SprintMilestoneTask[]) =>
    Math.round(list.reduce((acc, t) => acc + t.estimatedTimeSavingsHours, 0) * 10) / 10;

  return {
    acceleratedCount: accelerated.length,
    remainingAcceleratedCount: remaining.length,
    totalEstimatedHoursSaved: sumHours(accelerated),
    remainingEstimatedHoursSaved: sumHours(remaining),
  };
}

export type ChecklistSprintInput = SolutionSprint & {
  userPodSeat?: 'lead' | 'delivery';
};

export interface BuildSprintMilestoneTasksInput {
  briefId: string;
  sprint: ChecklistSprintInput | null;
  legacyBrief?: ProblemBrief | null;
  milestonesDone?: SprintMilestoneKey[];
  isCompleted: boolean;
  checkedMap?: Record<string, boolean>;
  deadlineIso?: string;
  createdAtIso?: string;
  nowMs?: number;
  mentorshipSessions?: MentorshipSession[];
}

const DEFAULT_FALLBACK_TASKS: string[] = [
  'Analyze partner operational constraints and log baseline measurements',
  'Draft scoped technical or operational deliverable with pod mentor review',
  'Finalize handover documentation and verify readiness for partner sign-off',
];

function buildTaskGuidance(
  index: number,
  phaseKey: SprintMilestoneKey,
  sprint: ChecklistSprintInput | null
): { guidance: string; ownerRoleLabel: string } {
  const isLead = sprint?.userPodSeat === 'lead';
  const roleLabel = sprint
    ? isLead
      ? `Lead (${sprint.podLeadRole})`
      : `Delivery (${sprint.podDeliveryRole})`
    : 'Pod Contributor';

  if (phaseKey === 'analysis-complete' || index === 0) {
    return {
      guidance: sprint
        ? `Audit the ${sprint.partnerOrg} brief requirements and attach baseline notes or readings before advancing.`
        : 'Confirm baseline measurements, context constraints, and acceptance criteria.',
      ownerRoleLabel: roleLabel,
    };
  }
  if (phaseKey === 'draft-ready') {
    return {
      guidance:
        'Assemble your working draft or schematic and request a quick QA check from your pod mentor.',
      ownerRoleLabel: roleLabel,
    };
  }
  return {
    guidance:
      'Package final handover steps clearly so local teams or partner leads can execute immediately.',
    ownerRoleLabel: roleLabel,
  };
}

/**
 * Pure builder generating dynamic task-based completion milestones
 * for an active pod sprint from its specific deliverable checklist.
 */
export function buildSprintMilestoneTasks(
  input: BuildSprintMilestoneTasksInput
): SprintMilestoneTask[] {
  const {
    briefId,
    sprint,
    legacyBrief,
    milestonesDone,
    isCompleted,
    checkedMap = {},
    deadlineIso,
    createdAtIso,
    nowMs = Date.now(),
    mentorshipSessions,
  } = input;

  const hasSessionGateContext = mentorshipSessions !== undefined;
  const attendedSessionsCount = (mentorshipSessions ?? []).filter(
    (sess) => sess.status === 'attended'
  ).length;

  const rawChecklist =
    sprint?.deliverableChecklist && sprint.deliverableChecklist.length > 0
      ? sprint.deliverableChecklist
      : legacyBrief?.deliverableChecklist && legacyBrief.deliverableChecklist.length > 0
        ? legacyBrief.deliverableChecklist
        : DEFAULT_FALLBACK_TASKS;

  const normalizedDone = normalizeSprintMilestones(milestonesDone, isCompleted);

  let hoursRemaining: number | null = null;
  if (deadlineIso && !Number.isNaN(Date.parse(deadlineIso))) {
    hoursRemaining = Math.ceil((Date.parse(deadlineIso) - nowMs) / 3_600_000);
  } else if (createdAtIso && !Number.isNaN(Date.parse(createdAtIso))) {
    const inferredDeadlineMs =
      Date.parse(createdAtIso) + getSprintDurationDays(briefId) * 86_400_000;
    hoursRemaining = Math.ceil((inferredDeadlineMs - nowMs) / 3_600_000);
  }

  const baseItems = rawChecklist.map((line, index) => {
    const stepIndex = Math.min(
      SPRINT_MILESTONE_STEPS.length - 1,
      Math.floor((index * SPRINT_MILESTONE_STEPS.length) / rawChecklist.length)
    );
    const phase = SPRINT_MILESTONE_STEPS[stepIndex] ?? SPRINT_MILESTONE_STEPS[0];
    const key = `${briefId}::${line}`;
    const completed =
      isCompleted ||
      Boolean(checkedMap[key]) ||
      normalizedDone.includes(phase.key);
    const { guidance, ownerRoleLabel } = buildTaskGuidance(index, phase.key, sprint);

    return {
      key,
      order: index + 1,
      line,
      stepIndex,
      phase,
      completed,
      guidance,
      ownerRoleLabel,
    };
  });

  const firstIncompleteIndex = baseItems.findIndex((item) => !item.completed);
  const firstIncompletePhaseIndex =
    firstIncompleteIndex >= 0 ? baseItems[firstIncompleteIndex].stepIndex : -1;

  return baseItems.map((item, idx) => {
    const requiresMentorship = item.phase.key === 'final-submission';
    const mentorshipMet = !requiresMentorship || attendedSessionsCount > 0 || item.completed;
    const isMentorshipLocked = Boolean(
      hasSessionGateContext &&
        requiresMentorship &&
        !item.completed &&
        attendedSessionsCount === 0
    );

    let status: SprintMilestoneTaskStatus;
    let statusLabel: string;

    if (item.completed) {
      status = 'completed';
      statusLabel = 'Completed';
    } else if (isMentorshipLocked) {
      status = 'mentorship-required';
      statusLabel = 'Mentorship Required';
    } else {
      const isOverdue = hoursRemaining !== null && hoursRemaining <= 0;
      const isUrgentLag =
        hoursRemaining !== null &&
        hoursRemaining <= 24 &&
        (item.stepIndex === 0 ||
          (item.stepIndex === 1 && normalizedDone.length === 0));

      if (isOverdue || isUrgentLag) {
        status = 'delayed';
        statusLabel = 'Delayed';
      } else if (
        idx === firstIncompleteIndex ||
        item.stepIndex === firstIncompletePhaseIndex
      ) {
        status = 'in-progress';
        statusLabel = 'In Progress';
      } else {
        status = 'upcoming';
        statusLabel = 'Up Next';
      }
    }

    const prevItem = idx > 0 ? baseItems[idx - 1] : null;
    const dependsOnOrder = prevItem ? prevItem.order : null;
    const dependsOnTitle = prevItem ? prevItem.line : null;
    const isSequentialLocked = Boolean(prevItem && !prevItem.completed && !item.completed);
    const isLocked = isSequentialLocked || isMentorshipLocked;
    const dependencyState: SprintMilestoneDependencyState =
      prevItem === null ? 'root' : isSequentialLocked ? 'locked' : 'unlocked';
    const dependencyLabel =
      prevItem === null
        ? 'Starting Milestone · No prior dependency'
        : isSequentialLocked
          ? `Locked until Task 0${prevItem.order} is Completed`
          : `Unlocked · Task 0${prevItem.order} Completed`;

    const mentorshipPrerequisiteLabel = !requiresMentorship
      ? null
      : item.completed || attendedSessionsCount > 0
        ? 'Mentor QA Prerequisite Met · Session Attended'
        : 'Prerequisite: Log 1 attended mentor QA session to unlock';

    let isMentorshipAccelerated = false;
    let estimatedTimeSavingsHours = 0;
    let estimatedTimeSavingsLabel: string | null = null;
    let recommendedMentorFocus: string | null = null;
    let mentorshipAccelerationNote: string | null = null;

    if (item.phase.key === 'draft-ready') {
      isMentorshipAccelerated = true;
      estimatedTimeSavingsHours = 2.5;
      estimatedTimeSavingsLabel = 'Est. ~2.5h saved';
      recommendedMentorFocus = 'QA Architecture Review';
      mentorshipAccelerationNote =
        'A 15m QA architecture review catches edge cases early and eliminates draft rework cycles.';
    } else if (item.phase.key === 'final-submission') {
      isMentorshipAccelerated = true;
      estimatedTimeSavingsHours = 1.5;
      estimatedTimeSavingsLabel = 'Est. ~1.5h saved';
      recommendedMentorFocus = 'Handover & Rubric Check';
      mentorshipAccelerationNote =
        'Direct mentor rubric sign-off streamlines partner acceptance criteria and accelerates escrow release.';
    }

    return {
      id: item.key,
      order: item.order,
      title: item.line,
      phaseKey: item.phase.key,
      phaseLabel: item.phase.label,
      guidance: item.guidance,
      ownerRoleLabel: item.ownerRoleLabel,
      completed: item.completed,
      status,
      statusLabel,
      dependsOnOrder,
      dependsOnTitle,
      dependencyState,
      dependencyLabel,
      isLocked,
      requiresMentorship,
      mentorshipMet,
      isMentorshipLocked,
      mentorshipPrerequisiteLabel,
      isMentorshipAccelerated,
      estimatedTimeSavingsHours,
      estimatedTimeSavingsLabel,
      recommendedMentorFocus,
      mentorshipAccelerationNote,
    };
  });
}

interface SprintMilestoneChecklistProps {
  submission: BriefSubmission;
  sprint: ChecklistSprintInput | null;
  legacyBrief?: ProblemBrief | null;
  milestonesDone?: SprintMilestoneKey[];
  isCompleted: boolean;
  checkedDeliverables: Record<string, boolean>;
  mentorshipSessions?: MentorshipSession[];
  headingLabel?: string;
  onToggleDeliverable: (briefId: string, itemTitle: string) => void;
  onTogglePhaseMilestone?: (briefId: string, phase: SprintMilestoneKey) => void;
  onOpenMentorSessionDrawer?: () => void;
}

export const SprintMilestoneChecklist: React.FC<SprintMilestoneChecklistProps> = ({
  submission,
  sprint,
  legacyBrief = null,
  milestonesDone,
  isCompleted,
  checkedDeliverables,
  mentorshipSessions,
  headingLabel = 'Active Pod Sprint Completion Milestones',
  onToggleDeliverable,
  onTogglePhaseMilestone,
  onOpenMentorSessionDrawer,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement | null>(null);
  const [statusFilter, setStatusFilter] = useState<SprintMilestoneFilter>('all');
  const [mentorshipPathEnabled, setMentorshipPathEnabled] = useState<boolean>(false);
  const [pinnedTooltipTaskId, setPinnedTooltipTaskId] = useState<string | null>(null);
  const [hoveredTooltipTaskId, setHoveredTooltipTaskId] = useState<string | null>(null);

  const tasks = useMemo(
    () =>
      buildSprintMilestoneTasks({
        briefId: submission.briefId,
        sprint,
        legacyBrief,
        milestonesDone,
        isCompleted,
        checkedMap: checkedDeliverables,
        deadlineIso: submission.deadlineIso,
        createdAtIso: submission.createdAtIso,
        mentorshipSessions,
      }),
    [
      submission.briefId,
      submission.deadlineIso,
      submission.createdAtIso,
      sprint,
      legacyBrief,
      milestonesDone,
      isCompleted,
      checkedDeliverables,
      mentorshipSessions,
    ]
  );

  const filterCounts = useMemo(
    () => getSprintMilestoneFilterCounts(tasks),
    [tasks]
  );

  const mentorshipPathSummary = useMemo(
    () => getMentorshipPathSummary(tasks),
    [tasks]
  );

  const visibleTasks = useMemo(
    () => filterSprintMilestoneTasks(tasks, statusFilter),
    [tasks, statusFilter]
  );

  const completedCount = filterCounts.completed;
  const totalCount = filterCounts.all;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextTask = tasks.find((t) => !t.completed) ?? null;

  const normalizedPhases = normalizeSprintMilestones(milestonesDone, isCompleted);

  useEffect(() => {
    setStatusFilter('all');
    setPinnedTooltipTaskId(null);
    setHoveredTooltipTaskId(null);
  }, [submission.briefId]);

  useEffect(() => {
    if (!pinnedTooltipTaskId && !hoveredTooltipTaskId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinnedTooltipTaskId(null);
        setHoveredTooltipTaskId(null);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setPinnedTooltipTaskId(null);
        setHoveredTooltipTaskId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [pinnedTooltipTaskId, hoveredTooltipTaskId]);

  const handleTaskToggle = (task: SprintMilestoneTask) => {
    if (isCompleted || task.isLocked) return;
    onToggleDeliverable(submission.briefId, task.title);

    // Sync the corresponding high-level sprint phase milestone when the task toggles
    if (onTogglePhaseMilestone) {
      const willBeCompleted = !task.completed;
      const phaseAlreadyChecked = normalizedPhases.includes(task.phaseKey);
      if (willBeCompleted && !phaseAlreadyChecked) {
        const otherPhaseTasksDone = tasks
          .filter((t) => t.phaseKey === task.phaseKey && t.id !== task.id)
          .every((t) => t.completed);
        if (otherPhaseTasksDone) {
          onTogglePhaseMilestone(submission.briefId, task.phaseKey);
        }
      }
    }
  };

  return (
    <section
      ref={containerRef}
      aria-label="Pod sprint milestone checklist"
      data-testid="sprint-milestone-checklist"
      className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
    >
      {/* Header + Progress Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
            Task-Based Pod Guidance
          </p>
          <h4 className="mt-0.5 text-sm sm:text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            {headingLabel}
          </h4>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            data-testid="sprint-checklist-progress-count"
            className="text-xs font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]"
          >
            {completedCount}/{totalCount} complete ({progressPct}%)
          </span>
        </div>
      </div>

      {/* Filter Chips: All / Active (In Progress & Delayed) / Completed */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Filter sprint milestones"
          data-testid="sprint-milestone-filter-chips"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037]"
        >
          {(
            [
              {
                id: 'all',
                label: 'All',
                count: filterCounts.all,
                ariaLabel: `Show all milestones (${filterCounts.all})`,
              },
              {
                id: 'active',
                label: 'Active',
                count: filterCounts.active,
                ariaLabel: `Show active pending milestones including In Progress and Delayed (${filterCounts.active})`,
              },
              {
                id: 'completed',
                label: 'Completed',
                count: filterCounts.completed,
                ariaLabel: `Show completed milestones (${filterCounts.completed})`,
              },
            ] as Array<{
              id: SprintMilestoneFilter;
              label: string;
              count: number;
              ariaLabel: string;
            }>
          ).map((chip) => {
            const selected = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={selected}
                aria-label={chip.ariaLabel}
                data-testid={`milestone-filter-${chip.id}`}
                onClick={() => setStatusFilter(chip.id)}
                className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  selected
                    ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] hover:bg-[#FAF8F5] dark:hover:bg-[#121315]'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`font-mono-tabular tabular-nums text-[11px] ${
                    selected ? 'opacity-90' : 'opacity-75'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {statusFilter !== 'all' && (
            <span
              data-testid="sprint-milestone-filter-summary"
              className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums"
            >
              Showing {visibleTasks.length} of {totalCount} milestones
            </span>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={mentorshipPathEnabled}
            data-testid="mentorship-path-toggle"
            onClick={() => setMentorshipPathEnabled((prev) => !prev)}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              mentorshipPathEnabled
                ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Mentorship Path</span>
            <span
              className={`font-mono-tabular tabular-nums text-[11px] ${
                mentorshipPathEnabled
                  ? 'opacity-90'
                  : 'text-[#146C53] dark:text-[#2EB88B]'
              }`}
            >
              ~{mentorshipPathSummary.totalEstimatedHoursSaved}h saved
            </span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        role="progressbar"
        aria-label="Pod sprint task completion"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-1.5 rounded-full bg-[#ECE7DF] dark:bg-[#262A30] overflow-hidden"
      >
        <div
          className="h-full w-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] origin-left transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${progressPct / 100})` }}
        />
      </div>

      {/* Mentorship Path Active Summary Banner */}
      {mentorshipPathEnabled && (
        <div
          data-testid="mentorship-path-summary-banner"
          className="rounded-lg bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 border border-[#146C53]/35 dark:border-[#2EB88B]/35 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
        >
          <div className="flex items-start gap-2 min-w-0">
            <Zap
              className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-0.5">
              <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Mentorship Path Active · {mentorshipPathSummary.acceleratedCount} accelerated milestone
                {mentorshipPathSummary.acceleratedCount === 1 ? '' : 's'}
              </p>
              <p className="text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums">
                Estimated time savings: ~{mentorshipPathSummary.totalEstimatedHoursSaved}h total
                {mentorshipPathSummary.remainingEstimatedHoursSaved > 0
                  ? ` (~${mentorshipPathSummary.remainingEstimatedHoursSaved}h remaining on pending gates)`
                  : ' (all accelerated milestones completed)'}
              </p>
            </div>
          </div>
          {onOpenMentorSessionDrawer && (
            <button
              type="button"
              onClick={onOpenMentorSessionDrawer}
              className="font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline whitespace-nowrap self-start sm:self-center cursor-pointer"
            >
              Book QA Session →
            </button>
          )}
        </div>
      )}

      {/* Active Task Guidance Banner */}
      {!isCompleted && nextTask && statusFilter !== 'completed' && (
        <div
          data-testid="sprint-checklist-next-guidance"
          className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#146C53]/25 dark:border-[#2EB88B]/30 px-3.5 py-2.5 flex items-start gap-2.5 text-xs"
        >
          <Compass
            className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Next focus · Task 0{nextTask.order} ({nextTask.phaseLabel})
            </p>
            <p className="text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
              {nextTask.guidance}
            </p>
          </div>
        </div>
      )}

      {/* Specific Completion Milestone Tasks */}
      {visibleTasks.length === 0 ? (
        <div
          data-testid="sprint-milestone-filter-empty"
          className="rounded-lg border border-dashed border-[#E8E3DB] dark:border-[#2C3037] bg-white/70 dark:bg-[#1A1C20]/70 p-4 text-center space-y-2"
        >
          <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
            {statusFilter === 'active'
              ? 'All sprint milestones are completed — no pending tasks remain.'
              : 'No milestones completed yet. Check off an active task to track verification progress.'}
          </p>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
          >
            Show all milestones
          </button>
        </div>
      ) : (
        <ol className="space-y-0" data-testid="sprint-checklist-task-list">
          {visibleTasks.map((task, visibleIdx) => {
            const isNext = !isCompleted && nextTask?.id === task.id;
            const isTooltipOpen =
              pinnedTooltipTaskId === task.id || hoveredTooltipTaskId === task.id;
            const statusInfo = getMilestoneStatusExplanation(task.status);
            const tooltipId = `milestone-status-tooltip-${submission.briefId}-${task.order}`;
            const nextVisibleTask =
              visibleIdx < visibleTasks.length - 1
                ? visibleTasks[visibleIdx + 1]
                : null;
            const showConnectorToNext =
              Boolean(nextVisibleTask && nextVisibleTask.dependsOnOrder === task.order);
            const isCheckboxDisabled = isCompleted || task.isLocked;

            const isHighlightedAccelerated =
              mentorshipPathEnabled && task.isMentorshipAccelerated;
            const isDimmedNonAccelerated =
              mentorshipPathEnabled && !task.isMentorshipAccelerated && !task.completed;

            return (
              <li
                key={task.id}
                data-testid={`sprint-checklist-task-${task.order}`}
                data-dependency-state={task.dependencyState}
                data-mentorship-accelerated={
                  task.isMentorshipAccelerated ? 'true' : 'false'
                }
                className="relative"
              >
                <div
                  className={`rounded-lg border p-3.5 transition-colors ${
                    task.completed
                      ? isHighlightedAccelerated
                        ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 border-[#146C53] dark:border-[#2EB88B]'
                        : 'bg-[#E7F3EE]/55 dark:bg-[#142B24]/55 border-[#146C53]/30 dark:border-[#2EB88B]/30'
                      : isHighlightedAccelerated
                        ? 'bg-[#E7F3EE]/40 dark:bg-[#142B24]/45 border-[#146C53]/65 dark:border-[#2EB88B]/65'
                        : task.isLocked
                          ? `bg-[#FAF8F5]/80 dark:bg-[#16181C] border-dashed border-[#D8D1C6] dark:border-[#343942] ${
                              isDimmedNonAccelerated ? 'opacity-65' : 'opacity-85'
                            }`
                          : isNext
                            ? `bg-white dark:bg-[#1A1C20] border-[#146C53]/45 dark:border-[#2EB88B]/45 ${
                                isDimmedNonAccelerated ? 'opacity-75' : ''
                              }`
                            : `bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] ${
                                isDimmedNonAccelerated ? 'opacity-75' : ''
                              }`
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <motion.button
                      type="button"
                      disabled={isCheckboxDisabled}
                      aria-disabled={isCheckboxDisabled}
                      aria-checked={task.completed}
                      role="checkbox"
                      aria-label={
                        task.isMentorshipLocked
                          ? `Milestone deliverable ${task.title} requires an attended mentor QA session before completion`
                          : task.isLocked
                            ? `Milestone deliverable ${task.title} locked until Task 0${task.dependsOnOrder} is completed`
                            : task.completed
                              ? `Milestone deliverable ${task.title} completed`
                              : `Mark milestone deliverable ${task.title} as completed`
                      }
                      data-milestone-checkbox="true"
                      data-testid={`deliverable-checkbox-${task.title}`}
                      onClick={() => handleTaskToggle(task)}
                      whileHover={
                        shouldReduceMotion || isCheckboxDisabled
                          ? undefined
                          : { scale: 1.08 }
                      }
                      whileTap={
                        shouldReduceMotion || isCheckboxDisabled
                          ? undefined
                          : { scale: 0.92 }
                      }
                      className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315] cursor-pointer'
                          : task.isLocked
                            ? 'border-[#C7C1B7] dark:border-[#3D434D] bg-[#F1EDE6] dark:bg-[#1E2127] text-[#787C83] dark:text-[#8E95A0] cursor-not-allowed'
                            : 'border-[#8A847A] dark:border-[#6C717A] bg-white dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] cursor-pointer'
                      } disabled:cursor-not-allowed`}
                    >
                      {task.completed ? (
                        <motion.span
                          data-testid="milestone-checkbox-checked"
                          initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </motion.span>
                      ) : task.isLocked ? (
                        <Lock
                          data-testid={`milestone-locked-icon-${task.order}`}
                          className="w-3 h-3"
                          aria-hidden="true"
                        />
                      ) : null}
                    </motion.button>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          <span className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
                            Task 0{task.order}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{task.phaseLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>{task.ownerRoleLabel}</span>
                          </span>
                        </div>

                        <div className="relative ml-auto inline-flex items-center gap-1 shrink-0">
                          <span
                            data-testid={`milestone-status-tag-${task.order}`}
                            data-status={task.status}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${
                              task.status === 'completed'
                                ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
                                : task.status === 'delayed'
                                  ? 'bg-[#FEE4E2]/80 dark:bg-[#3A1614]/80 border-[#B42318]/35 dark:border-[#F97066]/40 text-[#B42318] dark:text-[#F97066]'
                                  : task.status === 'mentorship-required'
                                    ? 'bg-[#FEF3C7]/85 dark:bg-[#2F2410]/85 border-[#D97706]/40 dark:border-[#E3B341]/40 text-[#9A5B04] dark:text-[#F5C451]'
                                    : task.status === 'in-progress'
                                      ? 'bg-[#F9ECE5] dark:bg-[#2D1E17] border-[#C4622D]/35 dark:border-[#E07B46]/40 text-[#C4622D] dark:text-[#E07B46]'
                                      : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                            }`}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                            ) : task.status === 'delayed' ? (
                              <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                            ) : task.status === 'mentorship-required' ? (
                              <Users className="w-3 h-3 shrink-0" aria-hidden="true" />
                            ) : (
                              <Clock3 className="w-3 h-3 shrink-0" aria-hidden="true" />
                            )}
                            <span>{task.statusLabel}</span>
                          </span>

                          <button
                            type="button"
                            data-testid={`milestone-status-help-${task.order}`}
                            aria-label={`Explain ${task.statusLabel} verification workflow status`}
                            aria-expanded={isTooltipOpen}
                            aria-describedby={isTooltipOpen ? tooltipId : undefined}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPinnedTooltipTaskId((prev) =>
                                prev === task.id ? null : task.id
                              );
                              setHoveredTooltipTaskId((prev) =>
                                prev === task.id ? null : prev
                              );
                            }}
                            onMouseEnter={() => setHoveredTooltipTaskId(task.id)}
                            onMouseLeave={() =>
                              setHoveredTooltipTaskId((prev) =>
                                prev === task.id ? null : prev
                              )
                            }
                            onFocus={() => setHoveredTooltipTaskId(task.id)}
                            onBlur={() =>
                              setHoveredTooltipTaskId((prev) =>
                                prev === task.id ? null : prev
                              )
                            }
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md border transition-colors cursor-pointer ${
                              isTooltipOpen
                                ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                                : 'bg-white dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] hover:border-[#8A847A] dark:hover:border-[#6C717A]'
                            }`}
                          >
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>

                          <AnimatePresence>
                            {isTooltipOpen && (
                              <motion.div
                                id={tooltipId}
                                role="tooltip"
                                data-testid={`milestone-status-tooltip-${task.order}`}
                                initial={
                                  shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: 4, scale: 0.98 }
                                }
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={
                                  shouldReduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, y: 2, scale: 0.98 }
                                }
                                transition={{ duration: 0.15 }}
                                onClick={(event) => event.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 z-30 w-64 sm:w-72 max-w-[calc(100vw-4.5rem)] rounded-lg bg-[#17191C] dark:bg-[#22262C] text-[#FAF8F5] dark:text-[#F4F2EE] border border-[#2C3037] dark:border-[#3A404A] shadow-lg p-3 text-left pointer-events-auto"
                              >
                                <p className="text-[11px] font-semibold text-[#2EB88B]">
                                  {statusInfo.title}
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed text-[#E8E3DB] dark:text-[#D0D3D8]">
                                  {statusInfo.description}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <p
                        onClick={() => handleTaskToggle(task)}
                        className={`text-sm font-medium leading-snug ${
                          !isCheckboxDisabled ? 'cursor-pointer' : 'cursor-default'
                        } ${
                          task.completed
                            ? 'line-through text-[#6D7178] dark:text-[#8E95A0]'
                            : task.isLocked
                              ? 'text-[#575B62] dark:text-[#A3A7AE]'
                              : 'text-[#17191C] dark:text-[#F4F2EE]'
                        }`}
                      >
                        {task.title}
                      </p>

                      {/* Dependency & Mentorship Prerequisite Indicator Labels */}
                      {(task.dependsOnOrder !== null ||
                        (task.requiresMentorship &&
                          !task.completed &&
                          task.mentorshipPrerequisiteLabel)) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {task.dependsOnOrder !== null && (
                            <span
                              data-testid={`milestone-dependency-label-${task.order}`}
                              data-dependency-state={task.dependencyState}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                                task.dependencyState === 'locked'
                                  ? 'bg-[#F9ECE5]/70 dark:bg-[#2A201B] border-[#C4622D]/30 dark:border-[#E07B46]/35 text-[#9B491E] dark:text-[#E5976E]'
                                  : 'bg-[#E7F3EE]/65 dark:bg-[#142B24]/70 border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[#146C53] dark:text-[#2EB88B]'
                              }`}
                            >
                              {task.dependencyState === 'locked' ? (
                                <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                              ) : (
                                <Link2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                              )}
                              <span>{task.dependencyLabel}</span>
                            </span>
                          )}

                          {task.requiresMentorship &&
                            !task.completed &&
                            task.mentorshipPrerequisiteLabel && (
                              <span
                                data-testid={`milestone-mentorship-gate-${task.order}`}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                                  task.isMentorshipLocked
                                    ? 'bg-[#FEF3C7]/75 dark:bg-[#2F2410]/75 border-[#D97706]/35 dark:border-[#E3B341]/35 text-[#9A5B04] dark:text-[#F5C451]'
                                    : 'bg-[#E7F3EE]/65 dark:bg-[#142B24]/70 border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[#146C53] dark:text-[#2EB88B]'
                                }`}
                              >
                                <Users className="w-3 h-3 shrink-0" aria-hidden="true" />
                                <span>{task.mentorshipPrerequisiteLabel}</span>
                              </span>
                            )}

                          {task.isMentorshipLocked && onOpenMentorSessionDrawer && (
                            <button
                              type="button"
                              data-testid={`milestone-open-mentor-session-${task.order}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenMentorSessionDrawer();
                              }}
                              className="text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
                            >
                              Schedule / Log Mentor Session →
                            </button>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                        {task.guidance}
                      </p>

                      {/* Mentorship Path Highlight Callout (Time Savings & QA Focus) */}
                      {isHighlightedAccelerated && task.estimatedTimeSavingsLabel && (
                        <div
                          data-testid={`milestone-time-savings-${task.order}`}
                          className="rounded-md bg-white/90 dark:bg-[#121315]/90 border border-[#146C53]/30 dark:border-[#2EB88B]/30 px-3 py-2 space-y-1 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#146C53] dark:text-[#2EB88B]">
                              <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                Mentorship-Accelerated · {task.recommendedMentorFocus}
                              </span>
                            </span>
                            <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                              {task.estimatedTimeSavingsLabel}
                            </span>
                          </div>
                          {task.mentorshipAccelerationNote && (
                            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                              {task.mentorshipAccelerationNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vertical Dependency Connector Line to Next Sequential Milestone */}
                {showConnectorToNext ? (
                  <div
                    aria-hidden="true"
                    data-testid={`milestone-dependency-connector-${task.order}`}
                    data-dependency-unlocked={task.completed ? 'true' : 'false'}
                    className="flex items-center gap-2 pl-[23px] py-0.5"
                  >
                    <div
                      className={`w-0.5 h-5 ${
                        task.completed
                          ? 'bg-[#146C53]/65 dark:bg-[#2EB88B]/65'
                          : 'border-l-2 border-dashed border-[#C7C1B7] dark:border-[#3D434D]'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-mono-tabular uppercase tracking-wider ${
                        task.completed
                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                          : 'text-[#8A847A] dark:text-[#787F8A]'
                      }`}
                    >
                      {task.completed
                        ? `Unlocks Task 0${nextVisibleTask!.order}`
                        : `Requires Task 0${task.order} Completed`}
                    </span>
                  </div>
                ) : visibleIdx < visibleTasks.length - 1 ? (
                  <div className="h-2.5" aria-hidden="true" />
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
