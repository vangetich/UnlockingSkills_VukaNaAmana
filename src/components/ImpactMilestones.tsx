import React, { useMemo } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  PeerEndorsement,
  SkillCapability,
  SprintMilestoneKey,
  WorkReadyVault,
} from '../types/kora';
import {
  SPRINT_MILESTONE_STEPS,
  normalizeSprintMilestones,
} from '../utils/talentEngine';

export type ImpactMilestoneId =
  | 'first-verification'
  | 'first-sprint-completion'
  | 'first-payout';

export type ImpactMilestoneStatus = 'completed' | 'in-progress' | 'upcoming';

export interface ImpactMilestoneItem {
  id: ImpactMilestoneId;
  stepNumber: string;
  stageTag: string;
  title: string;
  status: ImpactMilestoneStatus;
  statusLabel: string;
  progressPct: number;
  evidenceSummary: string;
  nextStepHint: string;
  actionLabel: string;
  actionTarget: 'verify' | 'unlock' | 'solve';
  completedAtIso?: string;
}

export interface ImpactMilestonesInput {
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
  vault: WorkReadyVault;
  endorsements: PeerEndorsement[];
  payouts: ContractPayout[];
  sprintMilestonesByBrief?: Record<string, SprintMilestoneKey[]>;
}

export interface ImpactMilestonesSummary {
  milestones: ImpactMilestoneItem[];
  completedCount: number;
  totalCount: number;
  overallProgressPct: number;
  nextMilestoneId: ImpactMilestoneId | null;
}

function getEarliestIso(timestamps: Array<string | undefined>): string | undefined {
  const valid = timestamps
    .filter((iso): iso is string => Boolean(iso) && !Number.isNaN(Date.parse(iso as string)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return valid[0];
}

export function computeImpactMilestones(
  input: ImpactMilestonesInput
): ImpactMilestonesSummary {
  const {
    capabilities = [],
    contributions = [],
    passport = null,
    vault,
    endorsements = [],
    payouts = [],
    sprintMilestonesByBrief = {},
  } = input;

  // 1. First Verification
  const verifiedCapabilities = capabilities.filter(
    (c) =>
      c.verificationStatus === 'field-verified' ||
      c.verificationStatus === 'master-endorsed'
  );
  const verifiedEndorsements = endorsements.filter((e) => e.status === 'verified');
  const firstVerificationAchieved =
    passport !== null || verifiedCapabilities.length > 0;

  let verificationProgressPct = 0;
  if (firstVerificationAchieved) {
    verificationProgressPct = 100;
  } else if (capabilities.length > 0 || verifiedEndorsements.length > 0) {
    verificationProgressPct = 50;
  }

  const verificationEvidence = firstVerificationAchieved
    ? passport
      ? `${passport.verifiableId ? `Passport ${passport.verifiableId}` : 'Living Passport issued'} · ${
          verifiedCapabilities.length > 0
            ? `${verifiedCapabilities.length} verified skill${verifiedCapabilities.length === 1 ? '' : 's'}`
            : passport.studioDomain
        }`
      : `${verifiedCapabilities.length} verified capability recorded in your portfolio`
    : capabilities.length > 0
      ? `${capabilities.length} capability logged — complete scenario check to issue passport`
      : 'No verified capability or Living Competency Passport recorded yet.';

  const verificationMilestone: ImpactMilestoneItem = {
    id: 'first-verification',
    stepNumber: '01',
    stageTag: '1. Verify',
    title: 'First Verification',
    status: firstVerificationAchieved
      ? 'completed'
      : verificationProgressPct > 0
        ? 'in-progress'
        : 'upcoming',
    statusLabel: firstVerificationAchieved
      ? 'Completed'
      : verificationProgressPct > 0
        ? 'In Progress'
        : 'Not Started',
    progressPct: verificationProgressPct,
    evidenceSummary: verificationEvidence,
    nextStepHint: firstVerificationAchieved
      ? 'Verifiable competency proof active across partner briefs.'
      : 'Complete one competency scenario or verify a logged capability.',
    actionLabel: firstVerificationAchieved ? 'Open Passport' : 'Start Verification',
    actionTarget: 'verify',
    completedAtIso: firstVerificationAchieved
      ? getEarliestIso([
          passport?.generatedAtIso,
          ...verifiedCapabilities.map((c) => c.updatedAtIso || c.createdAtIso),
        ])
      : undefined,
  };

  // 2. First Sprint Completion
  const completedSprints = contributions.filter((c) => c.status === 'completed');
  const activeSprints = contributions.filter((c) => c.status === 'in-progress');
  const firstSprintAchieved = completedSprints.length > 0;

  let bestActiveCheckpoints = 0;
  let primaryActiveSprint: BriefSubmission | undefined;
  for (const active of activeSprints) {
    const done = normalizeSprintMilestones(
      active.milestonesDone ?? sprintMilestonesByBrief[active.briefId],
      false
    ).length;
    if (!primaryActiveSprint || done > bestActiveCheckpoints) {
      bestActiveCheckpoints = done;
      primaryActiveSprint = active;
    }
  }

  let sprintProgressPct = 0;
  if (firstSprintAchieved) {
    sprintProgressPct = 100;
  } else if (activeSprints.length > 0) {
    const checkpointRatio =
      bestActiveCheckpoints / Math.max(1, SPRINT_MILESTONE_STEPS.length);
    sprintProgressPct =
      bestActiveCheckpoints === 0
        ? 25
        : Math.min(90, Math.round(25 + checkpointRatio * 65));
  }

  const totalCompletedHours = completedSprints.reduce(
    (sum, c) => sum + Number(c.hoursLogged || 0),
    0
  );

  const sprintEvidence = firstSprintAchieved
    ? `${completedSprints.length} solution sprint${completedSprints.length === 1 ? '' : 's'} completed · ${totalCompletedHours}h verified delivery`
    : primaryActiveSprint
      ? `${primaryActiveSprint.briefTitle} · ${bestActiveCheckpoints}/${SPRINT_MILESTONE_STEPS.length} delivery checkpoints checked`
      : 'No solution sprint submitted yet — pick a scoped brief in Solve.';

  const sprintMilestone: ImpactMilestoneItem = {
    id: 'first-sprint-completion',
    stepNumber: '02',
    stageTag: '3. Solve',
    title: 'First Sprint Completion',
    status: firstSprintAchieved
      ? 'completed'
      : sprintProgressPct > 0
        ? 'in-progress'
        : 'upcoming',
    statusLabel: firstSprintAchieved
      ? 'Completed'
      : sprintProgressPct > 0
        ? 'In Progress'
        : 'Not Started',
    progressPct: sprintProgressPct,
    evidenceSummary: sprintEvidence,
    nextStepHint: firstSprintAchieved
      ? 'Verified delivery record ready for employer & partner review.'
      : primaryActiveSprint
        ? 'Complete remaining checkpoints and submit your final brief.'
        : 'Join a paid solution sprint aligned with your verified skills.',
    actionLabel: firstSprintAchieved
      ? 'View Sprints'
      : primaryActiveSprint
        ? 'Continue Sprint'
        : 'Explore Sprints',
    actionTarget: 'solve',
    completedAtIso: firstSprintAchieved
      ? getEarliestIso(
          completedSprints.map((c) => c.updatedAtIso || c.createdAtIso)
        )
      : undefined,
  };

  // 3. First Payout
  const releasedPayouts = payouts.filter((p) => p.status === 'released');
  const pendingPayouts = payouts.filter((p) => p.status !== 'released');
  const paidCompletedSprints = completedSprints.filter(
    (c) => Number(c.payoutUsd || 0) > 0
  );
  const firstPayoutAchieved =
    releasedPayouts.length > 0 || paidCompletedSprints.length > 0;

  const releasedAmountUsd =
    releasedPayouts.length > 0
      ? releasedPayouts.reduce((sum, p) => sum + Number(p.amountUsd || 0), 0)
      : paidCompletedSprints.reduce((sum, c) => sum + Number(c.payoutUsd || 0), 0);

  const pendingAmountUsd = pendingPayouts.reduce(
    (sum, p) => sum + Number(p.amountUsd || 0),
    0
  );

  const payoutRailReady = Boolean(
    vault?.payoutCompleted || vault?.financialRailTested
  );
  const vaultStarted = Boolean(
    vault?.identityCompleted ||
      vault?.contractCompleted ||
      vault?.financialIdentityCleared
  );

  let payoutProgressPct = 0;
  if (firstPayoutAchieved) {
    payoutProgressPct = 100;
  } else if (pendingPayouts.length > 0) {
    payoutProgressPct = 70;
  } else if (payoutRailReady) {
    payoutProgressPct = 40;
  } else if (vaultStarted) {
    payoutProgressPct = 20;
  }

  const settledCount =
    releasedPayouts.length > 0
      ? releasedPayouts.length
      : paidCompletedSprints.length;

  const payoutEvidence = firstPayoutAchieved
    ? `$${releasedAmountUsd.toLocaleString()} USD disbursed across ${settledCount} settled stipend${settledCount === 1 ? '' : 's'}`
    : pendingPayouts.length > 0
      ? `$${pendingAmountUsd.toLocaleString()} USD held in escrow awaiting final release`
      : payoutRailReady
        ? `Payout rail cleared (${vault?.payoutRail || vault?.financialRail || 'Verified'}) — ready for stipend release`
        : vaultStarted
          ? 'Compliance clearance started — finish your payout rail setup in Unlock.'
          : 'No payout rail configured or stipend disbursed yet.';

  const payoutMilestone: ImpactMilestoneItem = {
    id: 'first-payout',
    stepNumber: '03',
    stageTag: '2. Unlock',
    title: 'First Payout',
    status: firstPayoutAchieved
      ? 'completed'
      : payoutProgressPct > 0
        ? 'in-progress'
        : 'upcoming',
    statusLabel: firstPayoutAchieved
      ? 'Completed'
      : payoutProgressPct > 0
        ? 'In Progress'
        : 'Not Started',
    progressPct: payoutProgressPct,
    evidenceSummary: payoutEvidence,
    nextStepHint: firstPayoutAchieved
      ? 'Download compliant payout receipts anytime from Unlock.'
      : payoutRailReady
        ? 'Complete an active sprint to trigger your first stipend release.'
        : 'Configure a compliant mobile money, bank, or fiscal-host rail.',
    actionLabel: firstPayoutAchieved ? 'View Receipts' : 'Set Up Payouts',
    actionTarget: 'unlock',
    completedAtIso: firstPayoutAchieved
      ? getEarliestIso([
          ...releasedPayouts.map((p) => p.updatedAtIso || p.createdAtIso),
          ...paidCompletedSprints.map((c) => c.updatedAtIso || c.createdAtIso),
        ])
      : undefined,
  };

  const milestones: ImpactMilestoneItem[] = [
    verificationMilestone,
    sprintMilestone,
    payoutMilestone,
  ];

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const overallProgressPct = Math.round(
    milestones.reduce((sum, m) => sum + m.progressPct, 0) / milestones.length
  );
  const nextMilestone = milestones.find((m) => m.status !== 'completed') ?? null;

  return {
    milestones,
    completedCount,
    totalCount: milestones.length,
    overallProgressPct,
    nextMilestoneId: nextMilestone ? nextMilestone.id : null,
  };
}

interface ImpactMilestonesProps extends ImpactMilestonesInput {
  onGoToVerify?: () => void;
  onGoToUnlock?: () => void;
  onGoToSolve?: () => void;
}

export const ImpactMilestones: React.FC<ImpactMilestonesProps> = ({
  capabilities,
  contributions,
  passport,
  vault,
  endorsements,
  payouts,
  sprintMilestonesByBrief,
  onGoToVerify,
  onGoToUnlock,
  onGoToSolve,
}) => {
  const summary = useMemo(
    () =>
      computeImpactMilestones({
        capabilities,
        contributions,
        passport,
        vault,
        endorsements,
        payouts,
        sprintMilestonesByBrief,
      }),
    [
      capabilities,
      contributions,
      passport,
      vault,
      endorsements,
      payouts,
      sprintMilestonesByBrief,
    ]
  );

  const handleAction = (target: 'verify' | 'unlock' | 'solve') => {
    if (target === 'verify') onGoToVerify?.();
    else if (target === 'unlock') onGoToUnlock?.();
    else if (target === 'solve') onGoToSolve?.();
  };

  const renderMilestoneIcon = (id: ImpactMilestoneId, completed: boolean) => {
    if (completed) {
      return <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />;
    }
    if (id === 'first-verification') {
      return <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />;
    }
    if (id === 'first-sprint-completion') {
      return <Award className="w-4 h-4 shrink-0" aria-hidden="true" />;
    }
    return <Wallet className="w-4 h-4 shrink-0" aria-hidden="true" />;
  };

  const formatShortDate = (iso?: string) => {
    if (!iso) return null;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section
      aria-labelledby="impact-milestones-heading"
      data-testid="impact-milestones"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 space-y-5"
    >
      {/* Header + Overall Progress Track */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div>
          <p className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
            Builder Progression · Key Platform Milestones
          </p>
          <h2
            id="impact-milestones-heading"
            className="mt-0.5 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Impact Milestones
          </h2>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#575B62] dark:text-[#A3A7AE]">
              <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {summary.completedCount} of {summary.totalCount}
              </span>{' '}
              milestones reached
            </span>
            <span
              data-testid="impact-milestones-overall-pct"
              className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]"
            >
              {summary.overallProgressPct}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Overall impact milestone completion"
            aria-valuenow={summary.overallProgressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full rounded-full bg-[#ECE7DF] dark:bg-[#262A30] overflow-hidden"
          >
            <div
              className="h-full w-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] origin-left transition-transform duration-500 ease-out"
              style={{ transform: `scaleX(${summary.overallProgressPct / 100})` }}
            />
          </div>
        </div>
      </div>

      {/* 3-Column Milestone Grid */}
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summary.milestones.map((milestone) => {
          const isCompleted = milestone.status === 'completed';
          const isInProgress = milestone.status === 'in-progress';
          const isNextFocus = summary.nextMilestoneId === milestone.id;
          const achievedDate = formatShortDate(milestone.completedAtIso);

          const iconContainerClass = isCompleted
            ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] border-[#146C53]/25 dark:border-[#2EB88B]/30'
            : isInProgress
              ? 'bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46] border-[#C4622D]/25 dark:border-[#E07B46]/30'
              : 'bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] border-[#E8E3DB] dark:border-[#2C3037]';

          const barFillClass = isCompleted
            ? 'bg-[#146C53] dark:bg-[#2EB88B]'
            : isInProgress
              ? 'bg-[#C4622D] dark:bg-[#E07B46]'
              : 'bg-[#D6D0C6] dark:bg-[#3A3F47]';

          const statusTextClass = isCompleted
            ? 'text-[#146C53] dark:text-[#2EB88B]'
            : isInProgress
              ? 'text-[#C4622D] dark:text-[#E07B46]'
              : 'text-[#575B62] dark:text-[#A3A7AE]';

          return (
            <li
              key={milestone.id}
              data-testid={`impact-milestone-${milestone.id}`}
              data-milestone-status={milestone.status}
              className={`rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors ${
                isNextFocus
                  ? 'border-[#146C53]/45 dark:border-[#2EB88B]/45'
                  : 'border-[#E8E3DB] dark:border-[#2C3037]'
              }`}
            >
              <div className="space-y-3">
                {/* Top row: Icon + inline metadata */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconContainerClass}`}
                    >
                      {renderMilestoneIcon(milestone.id, isCompleted)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        <span className="font-mono-tabular tabular-nums font-semibold">
                          Step {milestone.stepNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{milestone.stageTag}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${statusTextClass}`}>
                          {milestone.statusLabel}
                        </span>
                      </div>
                      <h3 className="mt-0.5 text-sm sm:text-[15px] font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                        {milestone.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#575B62] dark:text-[#A3A7AE]">
                      {achievedDate
                        ? `Reached ${achievedDate}`
                        : isNextFocus
                          ? 'Next milestone'
                          : 'Milestone progress'}
                    </span>
                    <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {milestone.progressPct}%
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${milestone.title} progress`}
                    aria-valuenow={milestone.progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-1.5 w-full rounded-full bg-[#ECE7DF] dark:bg-[#262A30] overflow-hidden"
                  >
                    <div
                      className={`h-full w-full rounded-full origin-left transition-transform duration-500 ease-out ${barFillClass}`}
                      style={{ transform: `scaleX(${milestone.progressPct / 100})` }}
                    />
                  </div>
                </div>

                {/* Live Evidence & Next-Step Guidance */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                    {milestone.evidenceSummary}
                  </p>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    {milestone.nextStepHint}
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80 flex items-center justify-between">
                <button
                  type="button"
                  data-testid={`impact-milestone-cta-${milestone.id}`}
                  onClick={() => handleAction(milestone.actionTarget)}
                  className={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    isNextFocus
                      ? 'bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315]'
                      : 'text-[#146C53] dark:text-[#2EB88B] hover:bg-[#E7F3EE]/70 dark:hover:bg-[#142B24]'
                  }`}
                >
                  <span>{milestone.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
