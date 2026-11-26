import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, Star, UserCheck, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { PodMentorProfile, SprintRatingScore } from '../types/kora';

export interface SprintFeedbackDraftInput {
  contributionId: string;
  briefId: string;
  briefTitle: string;
  partnerOrg: string;
  reviewerName: string;
  reviewerRole: string;
  rating: SprintRatingScore;
  reviewText: string;
}

export interface SprintFeedbackValidationResult {
  valid: boolean;
  error: string | null;
  formattedReviewText: string;
}

export const MENTOR_SPRINT_ASPECTS = [
  'Mentor responsiveness',
  'Technical & QA guidance',
  'Brief & scope clarity',
  'Smooth handover & payout',
] as const;

const PRACTITIONER_RATING_LABELS: Record<SprintRatingScore, string> = {
  1: 'Needs major improvement',
  2: 'Below expectations',
  3: 'Helpful sprint process',
  4: 'Strong mentor support',
  5: 'Exceptional mentorship & flow',
};

/**
 * Pure validator and formatter for practitioner feedback on mentors and the sprint process.
 */
export function validateAndFormatPractitionerFeedback(params: {
  reviewerName: string;
  reviewText: string;
  selectedAspects: string[];
}): SprintFeedbackValidationResult {
  const cleanName = params.reviewerName.trim();
  const cleanText = params.reviewText.trim();

  if (cleanName.length < 2) {
    return {
      valid: false,
      error: 'Please enter your name (at least 2 characters).',
      formattedReviewText: cleanText,
    };
  }

  if (cleanText.length < 10) {
    return {
      valid: false,
      error: 'Please share at least 10 characters of qualitative feedback on your mentor or sprint experience.',
      formattedReviewText: cleanText,
    };
  }

  const formattedReviewText =
    params.selectedAspects.length > 0
      ? `[${params.selectedAspects.join(' · ')}] ${cleanText}`
      : cleanText;

  return {
    valid: true,
    error: null,
    formattedReviewText,
  };
}

interface SprintFeedbackModalProps {
  isOpen: boolean;
  contributionId: string;
  briefId: string;
  briefTitle: string;
  partnerOrg: string;
  assignedMentor: PodMentorProfile;
  practitionerName?: string;
  onClose: () => void;
  onSaveFeedback: (input: SprintFeedbackDraftInput) => void;
}

export const SprintFeedbackModal: React.FC<SprintFeedbackModalProps> = ({
  isOpen,
  contributionId,
  briefId,
  briefTitle,
  partnerOrg,
  assignedMentor,
  practitionerName,
  onClose,
  onSaveFeedback,
}) => {
  const [rating, setRating] = useState<SprintRatingScore>(5);
  const [hoveredRating, setHoveredRating] = useState<SprintRatingScore | null>(null);
  const [reviewerName, setReviewerName] = useState(
    practitionerName?.trim() || 'Pod Practitioner'
  );
  const [selectedAspects, setSelectedAspects] = useState<string[]>([
    'Mentor responsiveness',
  ]);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSavedSuccess(false);
    setReviewerName(practitionerName?.trim() || 'Pod Practitioner');
  }, [isOpen, contributionId, practitionerName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayRating = hoveredRating ?? rating;

  const toggleAspect = (aspect: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect)
        ? prev.filter((item) => item !== aspect)
        : [...prev, aspect]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateAndFormatPractitionerFeedback({
      reviewerName,
      reviewText,
      selectedAspects,
    });

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    onSaveFeedback({
      contributionId,
      briefId,
      briefTitle,
      partnerOrg,
      reviewerName: reviewerName.trim(),
      reviewerRole: `Practitioner Feedback · Mentor: ${assignedMentor.name}`,
      rating,
      reviewText: validation.formattedReviewText,
    });

    setSavedSuccess(true);
    setReviewText('');
    window.setTimeout(() => {
      onClose();
    }, 650);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sprint-feedback-modal-title"
      data-testid="sprint-feedback-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-scrollbar"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.985 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-xl rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B] flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Mentor &amp; Sprint Process Feedback</span>
            </p>
            <h2
              id="sprint-feedback-modal-title"
              className="font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE] leading-snug"
            >
              {briefTitle}
            </h2>
            <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46] shrink-0" aria-hidden="true" />
              <span>
                Pod Mentor: <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">{assignedMentor.name}</strong> ({assignedMentor.roleTitle}) · {partnerOrg}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sprint Feedback Modal"
            data-testid="close-sprint-feedback-modal-btn"
            className="min-h-[36px] min-w-[36px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {savedSuccess && (
            <div
              role="status"
              data-testid="sprint-feedback-modal-saved"
              className="rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 px-4 py-3 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Feedback saved to your sprint record.</span>
            </div>
          )}

          {/* Star Rating */}
          <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Mentor &amp; Sprint Experience Rating
              </span>
              <span className="text-xs font-mono-tabular font-medium text-[#C4622D] dark:text-[#E07B46]">
                {displayRating}/5 · {PRACTITIONER_RATING_LABELS[displayRating]}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-label="Rate mentor and sprint process from 1 to 5 stars"
              className="flex items-center gap-2"
              onMouseLeave={() => setHoveredRating(null)}
            >
              {([1, 2, 3, 4, 5] as SprintRatingScore[]).map((starValue) => {
                const active = starValue <= displayRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    role="radio"
                    aria-checked={rating === starValue}
                    aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
                    data-testid={`modal-feedback-star-${starValue}`}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onClick={() => setRating(starValue)}
                    className="min-h-[40px] min-w-[40px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#C4622D] dark:hover:border-[#E07B46] inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 transition-colors ${
                        active
                          ? 'fill-[#C4622D] text-[#C4622D] dark:fill-[#E07B46] dark:text-[#E07B46]'
                          : 'text-[#B5AEA3] dark:text-[#575B62]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus Aspects */}
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
              What worked well or stood out? (Optional tags)
            </span>
            <div className="flex flex-wrap gap-2">
              {MENTOR_SPRINT_ASPECTS.map((aspect) => {
                const selected = selectedAspects.includes(aspect);
                return (
                  <button
                    key={aspect}
                    type="button"
                    aria-pressed={selected}
                    data-testid={`feedback-aspect-${aspect.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    onClick={() => toggleAspect(aspect)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/40 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                    }`}
                  >
                    {aspect}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Practitioner Display Name */}
          <div className="space-y-1">
            <label
              htmlFor="modal-feedback-practitioner-name"
              className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
            >
              Your Name
            </label>
            <input
              id="modal-feedback-practitioner-name"
              data-testid="modal-feedback-practitioner-name"
              type="text"
              maxLength={80}
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g., Amina Hassan"
              className="w-full min-h-[40px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30"
            />
          </div>

          {/* Qualitative Feedback Textarea */}
          <div className="space-y-1">
            <label
              htmlFor="modal-feedback-notes"
              className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
            >
              Qualitative Feedback on Mentor &amp; Sprint Process
            </label>
            <textarea
              id="modal-feedback-notes"
              data-testid="modal-feedback-notes"
              rows={4}
              maxLength={600}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={`Share how ${assignedMentor.name}'s guidance, milestone pacing, or partner handover worked during this sprint...`}
              className="w-full resize-none rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30"
            />
            <div className="flex items-center justify-between text-[11px] text-[#8A847A]">
              <span>Saved to your sprint ledger and synced when online.</span>
              <span className="font-mono-tabular tabular-nums">
                {reviewText.length}/600
              </span>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              data-testid="sprint-feedback-modal-error"
              className="text-xs font-medium text-[#B42318] dark:text-[#F97066]"
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E8E3DB] dark:border-[#2C3037]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-4 py-1.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-sprint-feedback-modal-btn"
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Save Feedback</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
