import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, X } from 'lucide-react';

export interface ComplianceTourStep {
  id: string;
  targetTestId: string;
  eyebrow: string;
  title: string;
  description: string;
}

export const COMPLIANCE_TOUR_STEPS: ComplianceTourStep[] = [
  {
    id: 'selector',
    targetTestId: 'compliance-jurisdiction-bar',
    eyebrow: 'Step 1 of 4 · Jurisdiction & Document Tier',
    title: 'Select host country & identity tier',
    description:
      'Pick any host country preset or run a live AI lookup, then set your document tier and target work mode.',
  },
  {
    id: 'work-auth',
    targetTestId: 'work-auth-crossing-card',
    eyebrow: 'Step 2 of 4 · ILO Work-Authorization Route',
    title: 'See exact plain-language legal steps',
    description:
      'Review your regulatory access tier, 3 concrete steps under 15 words each, and the ILO Rights at Work Guarantee.',
  },
  {
    id: 'financial',
    targetTestId: 'financial-payout-readiness-module',
    eyebrow: 'Step 3 of 4 · FATF Tiered Payout Bridge',
    title: 'Clear financial & payout rail gates',
    description:
      'Auto-match your FATF KYC tier and verify Mobile Money, Digital Wallet, Fiscal-Host, or Local Bank rails.',
  },
  {
    id: 'partner',
    targetTestId: 'compliance-toggle-partner',
    eyebrow: 'Step 4 of 4 · Employer Liability Shield',
    title: 'Open Hiring Partner Compliance View',
    description:
      'Toggle Hiring Partner Compliance View to review the Onboarding Dossier, generate a 1-Page Agreement, and export PDF receipts.',
  },
];

interface ComplianceGuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToPartnerView?: () => void;
}

interface HighlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const ComplianceGuidedTour: React.FC<ComplianceGuidedTourProps> = ({
  isOpen,
  onClose,
  onSwitchToPartnerView,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightBox, setHighlightBox] = useState<HighlightBox | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  const currentStep = COMPLIANCE_TOUR_STEPS[stepIndex] ?? COMPLIANCE_TOUR_STEPS[0];

  const measureTarget = useCallback(() => {
    if (typeof window === 'undefined' || !isOpen) return;
    setViewportWidth(window.innerWidth);
    const el = document.querySelector<HTMLElement>(
      `[data-testid="${currentStep.targetTestId}"]`
    );
    if (!el) {
      setHighlightBox(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setHighlightBox({
      top: Math.max(8, rect.top - 6),
      left: Math.max(8, rect.left - 6),
      width: Math.min(window.innerWidth - 16, rect.width + 12),
      height: rect.height + 12,
    });
  }, [currentStep.targetTestId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      return;
    }

    const el = document.querySelector<HTMLElement>(
      `[data-testid="${currentStep.targetTestId}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const initialTimer = window.setTimeout(measureTarget, 220);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);

    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isOpen, currentStep.targetTestId, measureTarget]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        if (stepIndex < COMPLIANCE_TOUR_STEPS.length - 1) {
          setStepIndex((i) => i + 1);
        }
      } else if (event.key === 'ArrowLeft') {
        if (stepIndex > 0) {
          setStepIndex((i) => i - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, stepIndex, onClose]);

  if (!isOpen) return null;

  const isLast = stepIndex === COMPLIANCE_TOUR_STEPS.length - 1;
  const isFirst = stepIndex === 0;
  const isMobile = viewportWidth < 640;

  let desktopCardTop = 120;
  let desktopCardLeft = Math.max(24, viewportWidth - 420);
  if (!isMobile && highlightBox) {
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 860;
    const cardHeight = 250;
    const cardWidth = 384;
    const preferBelow = highlightBox.top + highlightBox.height + cardHeight + 28 < windowHeight;
    desktopCardTop = preferBelow
      ? Math.min(windowHeight - cardHeight - 20, highlightBox.top + highlightBox.height + 14)
      : Math.max(20, highlightBox.top - cardHeight - 14);
    desktopCardLeft = Math.min(
      Math.max(20, highlightBox.left),
      Math.max(20, viewportWidth - cardWidth - 20)
    );
  }

  const handleFinish = () => {
    onSwitchToPartnerView?.();
    onClose();
  };

  return (
    <div
      data-testid="compliance-guided-tour-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compliance-tour-title"
      className="fixed inset-0 z-50"
    >
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-[#17191C]/50 dark:bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Spotlight Ring around Active Section */}
      {highlightBox && (
        <div
          aria-hidden="true"
          className="fixed rounded-2xl border-2 border-[#146C53] dark:border-[#2EB88B] bg-transparent pointer-events-none transition-all duration-200"
          style={{
            top: highlightBox.top,
            left: highlightBox.left,
            width: highlightBox.width,
            height: highlightBox.height,
            boxShadow: '0 0 0 9999px rgba(18, 19, 21, 0.35)',
          }}
        />
      )}

      {/* Tooltip Card (Docked cleanly at bottom on mobile, positioned cleanly near spotlight on desktop) */}
      <div
        data-testid="compliance-guided-tour-card"
        style={
          isMobile
            ? undefined
            : {
                top: desktopCardTop,
                left: desktopCardLeft,
              }
        }
        className={
          isMobile
            ? 'fixed inset-x-3 bottom-3 z-50 rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/40 dark:border-[#2EB88B]/45 shadow-2xl p-5 space-y-4'
            : 'fixed z-50 w-96 rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/40 dark:border-[#2EB88B]/45 shadow-2xl p-5 space-y-4 transition-all duration-200'
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>{currentStep.eyebrow}</span>
            </p>
            <h3
              id="compliance-tour-title"
              className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              {currentStep.title}
            </h3>
          </div>

          <button
            type="button"
            data-testid="compliance-tour-close-btn"
            onClick={onClose}
            aria-label="Close Compliance Guided Tour"
            className="min-h-[34px] min-w-[34px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
          {currentStep.description}
        </p>

        {/* Step Indicator Dots */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {COMPLIANCE_TOUR_STEPS.map((step, idx) => (
            <span
              key={step.id}
              className={`h-1.5 rounded-full transition-all ${
                idx === stepIndex
                  ? 'w-6 bg-[#146C53] dark:bg-[#2EB88B]'
                  : idx < stepIndex
                    ? 'w-2 bg-[#146C53]/50 dark:bg-[#2EB88B]/50'
                    : 'w-2 bg-[#E8E3DB] dark:bg-[#2C3037]'
              }`}
            />
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E8E3DB] dark:border-[#2C3037]">
          <button
            type="button"
            data-testid="compliance-tour-skip-btn"
            onClick={onClose}
            className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] px-2 py-1.5"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                data-testid="compliance-tour-back-btn"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#121315] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                data-testid="compliance-tour-next-btn"
                onClick={() =>
                  setStepIndex((i) => Math.min(COMPLIANCE_TOUR_STEPS.length - 1, i + 1))
                }
                className="min-h-[36px] px-4 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                data-testid="compliance-tour-finish-btn"
                onClick={handleFinish}
                className="min-h-[36px] px-4 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Open Partner View</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
