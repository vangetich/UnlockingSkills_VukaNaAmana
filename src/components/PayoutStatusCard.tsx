import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, Lock, ShieldCheck } from 'lucide-react';
import type { ContractPayout, PayoutLifecycleStatus } from '../types/kora';
import { getPayoutRailLabel } from '../utils/talentEngine';

interface PayoutStatusCardProps {
  payouts: ContractPayout[];
  onAdvancePayout?: (payoutId: string) => void;
  readOnlyPreview?: boolean;
}

const LIFECYCLE_STEPS: Array<{
  id: PayoutLifecycleStatus;
  label: string;
  helper: string;
}> = [
  { id: 'escrow-held', label: 'Escrow Held', helper: 'Funds secured upfront' },
  { id: 'processing', label: 'Processing', helper: 'Deliverable accepted' },
  { id: 'released', label: 'Released', helper: 'Settled to practitioner' },
];

function getStepIndex(status: PayoutLifecycleStatus): number {
  if (status === 'escrow-held') return 0;
  if (status === 'processing') return 1;
  return 2;
}

function getStatusPillStyles(status: PayoutLifecycleStatus): string {
  if (status === 'released') {
    return 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/35 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]';
  }
  if (status === 'processing') {
    return 'bg-[#F9ECE5] dark:bg-[#2D1E17] border-[#C4622D]/35 dark:border-[#E07B46]/40 text-[#B04A1A] dark:text-[#F09A6A]';
  }
  return 'bg-[#FEF3C7] dark:bg-[#2F2411] border-[#D97706]/35 dark:border-[#F59E0B]/40 text-[#92400E] dark:text-[#FBBF24]';
}

export const PayoutStatusCard: React.FC<PayoutStatusCardProps> = ({
  payouts,
  onAdvancePayout,
  readOnlyPreview = false,
}) => {
  const totalEscrowUsd = payouts
    .filter((p) => p.status !== 'released')
    .reduce((sum, p) => sum + p.amountUsd, 0);
  const totalReleasedUsd = payouts
    .filter((p) => p.status === 'released')
    .reduce((sum, p) => sum + p.amountUsd, 0);
  const escrowCount = payouts.filter((p) => p.status === 'escrow-held').length;
  const processingCount = payouts.filter((p) => p.status === 'processing').length;
  const releasedCount = payouts.filter((p) => p.status === 'released').length;

  return (
    <section
      aria-labelledby="payout-status-heading"
      data-testid="payout-status-card"
      className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-7 space-y-5"
    >
      {/* Header & Tabular Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
            Contract Payment Lifecycle · Contribution Payout Health
          </p>
          <h2
            id="payout-status-heading"
            className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Contribution Payout Health
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
            Maps every sprint contribution payment live from Escrow Held through Processing to Released.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-mono-tabular tabular-nums shrink-0">
          <div>
            <span className="block text-[#575B62] dark:text-[#A3A7AE]">In Escrow / Active</span>
            <span className="text-base font-semibold text-[#C4622D] dark:text-[#E07B46]">
              ${totalEscrowUsd.toLocaleString()}
            </span>
          </div>
          <div className="h-7 w-px bg-[#E8E3DB] dark:bg-[#2C3037]" aria-hidden="true" />
          <div>
            <span className="block text-[#575B62] dark:text-[#A3A7AE]">Released</span>
            <span className="text-base font-semibold text-[#146C53] dark:text-[#2EB88B]">
              ${totalReleasedUsd.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Contribution Payout Health Summary Indicator */}
      <div
        data-testid="contribution-payout-health"
        className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE] me-1">
            Contribution Payout Health:
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold font-mono-tabular tabular-nums ${getStatusPillStyles('escrow-held')}`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D97706] dark:bg-[#F59E0B]" aria-hidden="true" />
            <span>Escrow Held ({escrowCount})</span>
          </span>
          <span aria-hidden="true" className="text-[#8A847A]">→</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold font-mono-tabular tabular-nums ${getStatusPillStyles('processing')}`}
          >
            <span className="w-2 h-2 rounded-full bg-[#C4622D] dark:bg-[#E07B46]" aria-hidden="true" />
            <span>Processing ({processingCount})</span>
          </span>
          <span aria-hidden="true" className="text-[#8A847A]">→</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold font-mono-tabular tabular-nums ${getStatusPillStyles('released')}`}
          >
            <span className="w-2 h-2 rounded-full bg-[#146C53] dark:bg-[#2EB88B]" aria-hidden="true" />
            <span>Released ({releasedCount})</span>
          </span>
        </div>

        <span className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
          {payouts.length > 0
            ? `${Math.round(((releasedCount + processingCount * 0.5) / payouts.length) * 100)}% settlement velocity`
            : 'No entries queued'}
        </span>
      </div>

      {/* Payout Lifecycle Rows */}
      {payouts.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 text-center text-sm text-[#575B62] dark:text-[#A3A7AE]">
          No active contract payouts yet. Join a Solution Sprint or generate a Sprint Agreement to fund escrow.
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.map((payout) => {
            const currentIdx = getStepIndex(payout.status);
            const isReleased = payout.status === 'released';
            const nextActionLabel =
              payout.status === 'escrow-held'
                ? 'Move to Processing'
                : payout.status === 'processing'
                  ? 'Confirm Released'
                  : null;

            return (
              <article
                key={payout.id}
                data-testid={`payout-row-${payout.id}`}
                data-payout-status={payout.status}
                className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        {payout.partnerOrg}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{getPayoutRailLabel(payout.payoutRail)}</span>
                    </div>
                    <h3 className="mt-1 text-sm sm:text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {payout.sprintTitle}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-lg font-semibold font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE]">
                      ${payout.amountUsd.toLocaleString()}
                    </span>

                    <span
                      data-testid={`payout-health-pill-${payout.id}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusPillStyles(payout.status)}`}
                    >
                      {isReleased ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : payout.status === 'processing' ? (
                        <Clock3 className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{LIFECYCLE_STEPS[currentIdx].label}</span>
                    </span>
                  </div>
                </div>

                {/* 3-Step Minimalist Lifecycle Track */}
                <ol
                  aria-label={`Payment lifecycle for ${payout.sprintTitle}`}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                >
                  {LIFECYCLE_STEPS.map((step, idx) => {
                    const reached = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <li
                        key={step.id}
                        className={`rounded-lg border px-3 py-2.5 transition-colors ${
                          reached
                            ? isReleased || idx < currentIdx
                              ? 'bg-[#E7F3EE]/60 dark:bg-[#142B24]/70 border-[#146C53]/30 dark:border-[#2EB88B]/35'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#C4622D]/40 dark:border-[#E07B46]/45'
                            : 'bg-[#FAF8F5]/50 dark:bg-[#121315]/50 border-[#E8E3DB] dark:border-[#2C3037] opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              reached
                                ? isReleased || idx < currentIdx
                                  ? 'text-[#146C53] dark:text-[#2EB88B]'
                                  : 'text-[#C4622D] dark:text-[#E07B46]'
                                : 'text-[#575B62] dark:text-[#A3A7AE]'
                            }`}
                          >
                            {idx + 1}. {step.label}
                          </span>
                          {reached && (
                            <span className="text-[10px] font-mono-tabular uppercase tracking-wide text-[#575B62] dark:text-[#A3A7AE]">
                              {isCurrent ? 'Current' : 'Done'}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          {step.helper}
                        </p>
                      </li>
                    );
                  })}
                </ol>

                {/* Partner-Controlled Action or Read-Only Preview Safeguard */}
                {nextActionLabel && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      {payout.status === 'escrow-held'
                        ? 'Milestone funds are ring-fenced in escrow awaiting deliverable sign-off.'
                        : 'Settlement instruction dispatched to the verified payout rail.'}
                    </p>
                    {!readOnlyPreview && onAdvancePayout ? (
                      <button
                        type="button"
                        onClick={() => onAdvancePayout(payout.id)}
                        className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors whitespace-nowrap"
                      >
                        <span>{nextActionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    ) : (
                      <span
                        data-testid={`payout-partner-controlled-badge-${payout.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-semibold text-[#575B62] dark:text-[#A3A7AE] self-start sm:self-auto whitespace-nowrap"
                      >
                        <Lock className="w-3 h-3 text-[#C4622D] dark:text-[#E07B46]" aria-hidden="true" />
                        <span>Partner &amp; Escrow Controlled (Read-Only)</span>
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
