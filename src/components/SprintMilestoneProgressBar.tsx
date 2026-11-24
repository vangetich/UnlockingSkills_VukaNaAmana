import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { SprintMilestoneKey } from '../types/kora';
import {
  SPRINT_MILESTONE_STEPS,
  getSprintMilestoneProgress,
} from '../utils/talentEngine';

interface SprintMilestoneProgressBarProps {
  sprintId: string;
  milestonesDone?: SprintMilestoneKey[];
  isCompleted: boolean;
  onToggleMilestone: (sprintId: string, milestone: SprintMilestoneKey) => void;
  compact?: boolean;
}

export const SprintMilestoneProgressBar: React.FC<SprintMilestoneProgressBarProps> = ({
  sprintId,
  milestonesDone,
  isCompleted,
  onToggleMilestone,
  compact = false,
}) => {
  const { completedKeys, completedCount, totalCount, percentage } =
    getSprintMilestoneProgress(milestonesDone, isCompleted);

  return (
    <div
      data-testid={`sprint-milestone-bar-${sprintId}`}
      className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
          Delivery Milestones
        </span>
        <span
          data-testid={`sprint-milestone-count-${sprintId}`}
          className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]"
        >
          {completedCount}/{totalCount} Milestones ({percentage}%)
        </span>
      </div>

      {/* Linear Progress Track */}
      <div
        role="progressbar"
        aria-label="Sprint delivery milestone progress"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-1.5 rounded-full bg-[#E8E3DB] dark:bg-[#2C3037] overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Interactive 3-Step Checkable Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {SPRINT_MILESTONE_STEPS.map((step, index) => {
          const checked = completedKeys.includes(step.key);
          return (
            <button
              key={step.key}
              type="button"
              disabled={isCompleted}
              aria-pressed={checked}
              data-testid={`milestone-step-${sprintId}-${step.key}`}
              onClick={() => onToggleMilestone(sprintId, step.key)}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-start inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                checked
                  ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/40 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]'
                  : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:border-[#146C53]/50 dark:hover:border-[#2EB88B]/50 hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              } disabled:cursor-default`}
            >
              {checked ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 shrink-0 opacity-60" />
              )}
              <span className="truncate">
                {compact ? `${index + 1}. ${step.label}` : step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
