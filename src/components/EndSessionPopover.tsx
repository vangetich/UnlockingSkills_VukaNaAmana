import React, { useEffect, useRef, useState } from 'react';
import { Info, LogOut, ShieldCheck, X } from 'lucide-react';
import type { PortalRealm } from '../types/kora';

export type EndSessionReasonId =
  | 'work-complete'
  | 'switching-device'
  | 'taking-break'
  | 'switching-portal'
  | 'other';

export interface EndSessionReasonOption {
  id: EndSessionReasonId;
  label: string;
}

export const END_SESSION_REASON_OPTIONS: EndSessionReasonOption[] = [
  { id: 'work-complete', label: 'Completed tasks or milestone review' },
  { id: 'switching-device', label: 'Switching devices or shared workspace' },
  { id: 'taking-break', label: 'Stepping away for a break' },
  { id: 'switching-portal', label: 'Switching between Practitioner & Partner views' },
  { id: 'other', label: 'Other reason' },
];

export interface EndSessionDetails {
  reasonId: EndSessionReasonId;
  reasonLabel: string;
  note: string;
  portal: PortalRealm;
}

export interface EndSessionAdviceCopy {
  kicker: string;
  title: string;
  closingAdvice: string;
  reEntryTip: string;
}

export function getEndSessionAdvice(portal: PortalRealm): EndSessionAdviceCopy {
  if (portal === 'partner') {
    return {
      kicker: 'Hiring Partner Desk',
      title: 'End Partner Session',
      closingAdvice:
        'Ending locks the Partner Console and clears your verified organization session token. Confirm any draft sprint posts or escrow approvals are saved first.',
      reEntryTip: 'You can re-enter anytime with your work email verification.',
    };
  }
  return {
    kicker: 'Practitioner Studio',
    title: 'End Practitioner Session',
    closingAdvice:
      'Ending locks your Competency Passport, Living Proof, and Work-Ready Vault before returning to the landing page. Sync any pending deliverables or mentor notes first.',
    reEntryTip: 'Saved progress remains preserved when you verify again.',
  };
}

interface EndSessionPopoverProps {
  portal: PortalRealm;
  onConfirmEndSession: (details: EndSessionDetails) => void;
  buttonTestId: string;
  ariaLabel: string;
  titleAttr: string;
}

export const EndSessionPopover: React.FC<EndSessionPopoverProps> = ({
  portal,
  onConfirmEndSession,
  buttonTestId,
  ariaLabel,
  titleAttr,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reasonId, setReasonId] = useState<EndSessionReasonId>('work-complete');
  const [note, setNote] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const advice = getEndSessionAdvice(portal);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isOpen]);

  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    const selectedReason =
      END_SESSION_REASON_OPTIONS.find((opt) => opt.id === reasonId) ??
      END_SESSION_REASON_OPTIONS[0];
    const details: EndSessionDetails = {
      reasonId: selectedReason.id,
      reasonLabel: selectedReason.label,
      note: note.trim().slice(0, 240),
      portal,
    };
    setIsOpen(false);
    setNote('');
    setReasonId('work-complete');
    onConfirmEndSession(details);
  };

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel}
        title={titleAttr}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        data-testid={buttonTestId}
        className="min-h-[36px] px-3 py-1 rounded-lg border border-[#C4622D]/35 dark:border-[#E07B46]/40 bg-[#FFF7F3] dark:bg-[#2A1B14] hover:bg-[#F9ECE5] dark:hover:bg-[#3A241B] text-xs font-semibold text-[#B44E1E] dark:text-[#F59E6C] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>End Session</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={advice.title}
          data-testid={`end-session-popover-${portal}`}
          className="absolute right-0 top-full mt-2 z-50 w-[336px] sm:w-[376px] max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-xl p-4 text-left"
        >
          <form onSubmit={handleConfirm} className="space-y-3.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C4622D] dark:text-[#E07B46]">
                  {advice.kicker}
                </p>
                <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {advice.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close End Session popover"
                className="w-7 h-7 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#23262B] text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Session Closure Advice */}
            <div className="rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-2.5 flex items-start gap-2 text-[11px] leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
              <Info
                className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#146C53] dark:text-[#2EB88B]"
                aria-hidden="true"
              />
              <span>{advice.closingAdvice}</span>
            </div>

            {/* Reason Selector */}
            <div className="space-y-1">
              <label
                htmlFor={`end-session-reason-${portal}`}
                className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
              >
                Reason for ending session
              </label>
              <select
                id={`end-session-reason-${portal}`}
                data-testid="end-session-reason-select"
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value as EndSessionReasonId)}
                className="w-full min-h-[36px] rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-2.5 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] cursor-pointer"
              >
                {END_SESSION_REASON_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Advice / Next-Session Note */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`end-session-note-${portal}`}
                  className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  Advice or reminder before locking (optional)
                </label>
                <span className="text-[10px] font-mono-tabular tabular-nums text-[#8A847A]">
                  {note.length}/240
                </span>
              </div>
              <textarea
                id={`end-session-note-${portal}`}
                data-testid="end-session-note-input"
                rows={2}
                maxLength={240}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  portal === 'partner'
                    ? 'e.g., Follow up on Nakuru cold-chain escrow draft tomorrow...'
                    : 'e.g., Resume Task 02 inverter telemetry review next session...'
                }
                className="w-full rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-2.5 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] resize-none"
              />
            </div>

            <p className="flex items-center gap-1.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              <ShieldCheck
                className="w-3.5 h-3.5 shrink-0 text-[#146C53] dark:text-[#2EB88B]"
                aria-hidden="true"
              />
              <span>{advice.reEntryTip}</span>
            </p>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
              <button
                type="button"
                data-testid="cancel-end-session-btn"
                onClick={() => setIsOpen(false)}
                className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#121315] hover:bg-[#FAF8F5] dark:hover:bg-[#23262B] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="confirm-end-session-btn"
                className="min-h-[34px] px-3.5 py-1.5 rounded-lg bg-[#B44E1E] hover:bg-[#993F15] dark:bg-[#E07B46] dark:hover:bg-[#C96835] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Confirm &amp; End</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
