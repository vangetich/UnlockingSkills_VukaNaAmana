import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import type { WorkspaceTab } from '../types/kora';

export interface StageSequenceDisclaimerProps {
  activeTab: WorkspaceTab;
  hasVerifiedSkills: boolean;
  isVaultReady: boolean;
  hasActiveOrCompletedSprint: boolean;
  onNavigateTab: (tab: WorkspaceTab) => void;
}

const ORDERED_STAGES: Array<{
  id: WorkspaceTab;
  number: string;
  label: string;
  purpose: string;
}> = [
  { id: 'verify', number: '1', label: 'Verify', purpose: 'Assemble skills & passport' },
  { id: 'unlock', number: '2', label: 'Unlock', purpose: 'Prepare compliance & payout' },
  { id: 'solve', number: '3', label: 'Solve', purpose: 'Complete Pod Sprints' },
  { id: 'pulse', number: '4', label: 'Pulse', purpose: 'Track impact & reviews' },
  { id: 'cleared', number: '5', label: 'Cleared', purpose: 'Build future dossier' },
];

export const StageSequenceDisclaimer: React.FC<StageSequenceDisclaimerProps> = ({
  activeTab,
  hasVerifiedSkills,
  isVaultReady,
  hasActiveOrCompletedSprint,
  onNavigateTab,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem('vuka.stageDisclaimerCollapsed') !== '1';
  });

  const handleToggle = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('vuka.stageDisclaimerCollapsed', next ? '0' : '1');
      }
      return next;
    });
  };

  const currentIndex = ORDERED_STAGES.findIndex((s) => s.id === activeTab);

  // Contextual gentle nudge when jumping ahead of an uncompleted earlier foundation stage
  const earlierStageNudge: { message: string; targetTab: WorkspaceTab; ctaLabel: string } | null =
    activeTab !== 'verify' && !hasVerifiedSkills
      ? {
          message:
            'Stage 1 (Verify) has not been completed yet—finishing it first ensures your Living Competency Passport and verified skills carry accurately into later documents.',
          targetTab: 'verify',
          ctaLabel: 'Start at Stage 1 · Verify',
        }
      : (activeTab === 'solve' || activeTab === 'cleared') && !isVaultReady
        ? {
            message:
              'Your Stage 2 (Unlock) readiness checklist is still in progress—completing it before contracting or exporting dossiers avoids missing compliance or payout details.',
            targetTab: 'unlock',
            ctaLabel: 'Review Stage 2 · Unlock',
          }
        : activeTab === 'cleared' && !hasActiveOrCompletedSprint
          ? {
              message:
                'Completing at least one Stage 3 (Solve) Pod Sprint first gives your Stage 5 Cleared Future Dossier verified work outcomes.',
              targetTab: 'solve',
              ctaLabel: 'Open Stage 3 · Solve',
            }
          : null;

  return (
    <aside
      aria-label="Recommended Stage Order and Document Assembly Disclaimer"
      data-testid="stage-sequence-disclaimer"
      className="mb-6 rounded-2xl border border-[#C4622D]/28 dark:border-[#E07B46]/32 bg-[#FDF8F4] dark:bg-[#1D1916] px-4 sm:px-5 py-3.5 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/25 dark:border-[#E07B46]/30 text-[#C4622D] dark:text-[#E07B46] inline-flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Stage Order Disclaimer · Complete &amp; Accurate Document Assembly
            </p>
            {!isExpanded && (
              <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] truncate">
                Follow Stages 1 → 5 in order to avoid confusion, rushing, or incomplete documentation.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          data-testid="stage-disclaimer-toggle-btn"
          aria-expanded={isExpanded}
          onClick={handleToggle}
          className="min-h-[32px] px-2.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#342C27] bg-white/90 dark:bg-[#161412] text-[11px] font-semibold text-[#575B62] dark:text-[#C4C9D0] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
        >
          <span>{isExpanded ? 'Hide note' : 'Read guidance'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#E8E3DB]/80 dark:border-[#2F2823] space-y-3">
          <p className="text-xs sm:text-[13px] leading-relaxed text-[#43484E] dark:text-[#C8CDD4]">
            <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Important Guidance for Skilled Talent &amp; Job Seekers:
            </strong>{' '}
            Please follow all five stages in sequential order from{' '}
            <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Stage 1 (Verify)
            </strong>{' '}
            through{' '}
            <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Stage 5 (Cleared)
            </strong>
            . Taking each step in sequence prevents confusion, rushing, or fragmented document
            processing—giving every competency passport, compliance readiness record, sprint
            agreement, and mobility dossier time to assemble completely and accurately.
          </p>

          {/* Compact 5-Stage Sequential Path Strip */}
          <ol
            aria-label="Recommended 5-stage sequence"
            className="flex flex-wrap items-center gap-1.5 text-[11px]"
          >
            {ORDERED_STAGES.map((stage, idx) => {
              const isCurrent = stage.id === activeTab;
              const isCompletedFoundation =
                (stage.id === 'verify' && hasVerifiedSkills) ||
                (stage.id === 'unlock' && isVaultReady) ||
                (stage.id === 'solve' && hasActiveOrCompletedSprint);

              return (
                <li key={stage.id} className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onNavigateTab(stage.id)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`min-h-[28px] px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                        : isCompletedFoundation
                          ? 'bg-[#E7F3EE]/80 dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B] font-medium hover:bg-[#E7F3EE]'
                          : idx < currentIndex
                            ? 'bg-white dark:bg-[#1A1C20] border-[#C4622D]/35 dark:border-[#E07B46]/35 text-[#C4622D] dark:text-[#E07B46] font-medium hover:bg-[#F9ECE5]/70'
                            : 'bg-white/80 dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                    }`}
                  >
                    {isCompletedFoundation && !isCurrent && (
                      <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    )}
                    <span className="font-mono-tabular">
                      {stage.number}. {stage.label}
                    </span>
                  </button>
                  {idx < ORDERED_STAGES.length - 1 && (
                    <ArrowRight
                      className="w-3 h-3 text-[#8A847A] dark:text-[#6C717A] shrink-0 rtl:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {earlierStageNudge && (
            <div
              data-testid="stage-sequence-nudge"
              className="rounded-xl bg-white dark:bg-[#161412] border border-[#C4622D]/25 dark:border-[#E07B46]/30 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
            >
              <div className="flex items-start gap-2 text-[#43484E] dark:text-[#C8CDD4]">
                <AlertCircle
                  className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{earlierStageNudge.message}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab(earlierStageNudge.targetTab)}
                className="min-h-[32px] px-3 py-1 rounded-lg bg-[#C4622D] hover:bg-[#A95021] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap self-start sm:self-center shrink-0 transition-colors cursor-pointer"
              >
                <span>{earlierStageNudge.ctaLabel}</span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
