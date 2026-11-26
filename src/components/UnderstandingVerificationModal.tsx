import React, { useEffect } from 'react';
import { CheckCircle2, Lock, ShieldCheck, X } from 'lucide-react';
import {
  UNDERSTANDING_VERIFICATION_BOUNDARIES,
  UNDERSTANDING_VERIFICATION_ROLES,
} from '../utils/partnerVerification';

interface UnderstandingVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName?: string;
}

export const UnderstandingVerificationModal: React.FC<UnderstandingVerificationModalProps> = ({
  isOpen,
  onClose,
  orgName = 'Hiring Partner',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="understanding-verification-title"
      data-testid="understanding-verification-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 sm:p-6 pt-14 sm:pt-16 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 shadow-2xl space-y-6 my-4 sm:my-auto max-h-[88vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
              Zero-Trust Privacy Architecture · {orgName}
            </p>
            <h2
              id="understanding-verification-title"
              className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
            >
              Understanding Verification &amp; Privacy Boundaries
            </h2>
            <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
              Clear separation of duties protects displaced practitioners while giving hiring partners verifiable confidence across Identity, Financial, and Contracting milestones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Understanding Verification modal"
            data-testid="understanding-verification-close-btn"
            className="min-h-[40px] min-w-[40px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] flex items-center justify-center text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Two-Column Privacy Boundary Matrix: Partner Verifies vs. Practitioner Vault */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Data Visibility: What Partners Verify vs. What Stays Protected in the Vault
            </h3>
            <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
              Active only during an unrevoked Consent Grant (VNA-GRANT)
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E8E3DB] dark:border-[#2C3037]">
            <div className="hidden md:grid md:grid-cols-12 bg-[#FAF8F5] dark:bg-[#121315] border-b border-[#E8E3DB] dark:border-[#2C3037] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              <div className="col-span-2 px-4 py-3">Milestone Area</div>
              <div className="col-span-5 px-4 py-3 border-l border-[#E8E3DB] dark:border-[#2C3037] text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Verified by Hiring Partner</span>
              </div>
              <div className="col-span-5 px-4 py-3 border-l border-[#E8E3DB] dark:border-[#2C3037] text-[#A95021] dark:text-[#F59E6C] inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Protected in Practitioner&apos;s Vault</span>
              </div>
            </div>

            <div className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037]">
              {UNDERSTANDING_VERIFICATION_BOUNDARIES.map((row) => (
                <div
                  key={row.id}
                  data-testid={`uv-boundary-row-${row.id}`}
                  className="grid grid-cols-1 md:grid-cols-12 text-xs leading-relaxed"
                >
                  <div className="md:col-span-2 px-4 py-3.5 font-semibold text-[#17191C] dark:text-[#F4F2EE] bg-[#FAF8F5]/60 dark:bg-[#121315]/60">
                    {row.domain}
                  </div>
                  <div className="md:col-span-5 px-4 py-3.5 md:border-l border-[#E8E3DB] dark:border-[#2C3037] text-[#43484E] dark:text-[#C8CDD4]">
                    <span className="md:hidden block font-semibold text-[#146C53] dark:text-[#2EB88B] mb-1">
                      Verified by Hiring Partner
                    </span>
                    {row.partnerVerifies}
                  </div>
                  <div className="md:col-span-5 px-4 py-3.5 md:border-l border-[#E8E3DB] dark:border-[#2C3037] text-[#43484E] dark:text-[#C8CDD4] bg-[#FAF8F5]/30 dark:bg-[#121315]/30">
                    <span className="md:hidden block font-semibold text-[#A95021] dark:text-[#F59E6C] mb-1">
                      Protected in Practitioner&apos;s Vault
                    </span>
                    {row.protectedInVault}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Separation Breakdown */}
        <div className="space-y-3 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Who Verifies What Across the Platform
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {UNDERSTANDING_VERIFICATION_ROLES.map((item) => (
              <div
                key={item.role}
                className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-1.5 text-xs"
              >
                <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">{item.role}</p>
                <p className="text-[#43484E] dark:text-[#C8CDD4] leading-relaxed">
                  <strong className="font-medium text-[#146C53] dark:text-[#2EB88B]">
                    Handles:{' '}
                  </strong>
                  {item.verifies}
                </p>
                <p className="text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    Never accesses:{' '}
                  </strong>
                  {item.neverSees}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Practitioners may revoke a VNA-GRANT token at any moment, immediately ending partner visibility.
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="understanding-verification-done-btn"
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap self-end sm:self-auto"
          >
            Got It · Return to Review
          </button>
        </div>
      </div>
    </div>
  );
};
