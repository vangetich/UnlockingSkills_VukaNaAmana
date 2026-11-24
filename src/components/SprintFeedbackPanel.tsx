import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, Star } from 'lucide-react';
import type { BriefSubmission, SprintFeedback, SprintRatingScore } from '../types/kora';
import { computeFeedbackSummary, SOLUTION_SPRINTS } from '../utils/talentEngine';

interface SprintFeedbackPanelProps {
  contributions: BriefSubmission[];
  feedbackList: SprintFeedback[];
  onAddSprintFeedback: (input: {
    contributionId: string;
    briefId: string;
    briefTitle: string;
    partnerOrg: string;
    reviewerName: string;
    reviewerRole: string;
    rating: SprintRatingScore;
    reviewText: string;
  }) => void;
}

const RATING_LABELS: Record<SprintRatingScore, string> = {
  1: 'Needs major rework',
  2: 'Partially met brief',
  3: 'Solid delivery',
  4: 'Strong partner impact',
  5: 'Exceptional delivery',
};

function resolvePartnerOrgForContribution(contribution: BriefSubmission): string {
  const matched = SOLUTION_SPRINTS.find((s) => s.id === contribution.briefId);
  if (matched) return matched.partnerOrg;
  if (contribution.briefId === 'brief-coldchain-03') return 'HarvestKeep Network';
  return `${contribution.domain} Hiring Partner`;
}

export const SprintFeedbackPanel: React.FC<SprintFeedbackPanelProps> = ({
  contributions,
  feedbackList,
  onAddSprintFeedback,
}) => {
  const completedContributions = useMemo(
    () => contributions.filter((c) => c.status === 'completed'),
    [contributions]
  );

  const summary = useMemo(() => computeFeedbackSummary(feedbackList), [feedbackList]);

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedContributionId, setSelectedContributionId] = useState<string>(
    completedContributions[0]?.id ?? ''
  );
  const [rating, setRating] = useState<SprintRatingScore>(5);
  const [hoveredRating, setHoveredRating] = useState<SprintRatingScore | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [partnerOrg, setPartnerOrg] = useState(
    completedContributions[0] ? resolvePartnerOrgForContribution(completedContributions[0]) : ''
  );
  const [reviewerRole, setReviewerRole] = useState('Hiring Partner Lead');
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (completedContributions.length > 0) {
      const stillExists = completedContributions.some((c) => c.id === selectedContributionId);
      if (!stillExists) {
        const first = completedContributions[0];
        setSelectedContributionId(first.id);
        setPartnerOrg(resolvePartnerOrgForContribution(first));
      }
    }
  }, [completedContributions, selectedContributionId]);

  const handleContributionChange = (nextId: string) => {
    setSelectedContributionId(nextId);
    const chosen = completedContributions.find((c) => c.id === nextId);
    if (chosen) {
      setPartnerOrg(resolvePartnerOrgForContribution(chosen));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedNotice(null);

    const selected = completedContributions.find((c) => c.id === selectedContributionId);
    if (!selected) {
      setError('Select a completed sprint contribution first.');
      return;
    }

    const cleanName = reviewerName.trim();
    const cleanOrg = partnerOrg.trim() || resolvePartnerOrgForContribution(selected);
    const cleanRole = reviewerRole.trim() || 'Hiring Partner';
    const cleanReview = reviewText.trim();

    if (cleanName.length < 2) {
      setError('Enter the reviewer name (at least 2 characters).');
      return;
    }
    if (cleanReview.length < 10) {
      setError('Write a brief qualitative review (at least 10 characters).');
      return;
    }

    onAddSprintFeedback({
      contributionId: selected.id,
      briefId: selected.briefId,
      briefTitle: selected.briefTitle,
      partnerOrg: cleanOrg,
      reviewerName: cleanName,
      reviewerRole: cleanRole,
      rating,
      reviewText: cleanReview,
    });

    setReviewerName('');
    setReviewText('');
    setRating(5);
    setIsComposerOpen(false);
    setSavedNotice(`Partner review recorded for "${selected.briefTitle}".`);
  };

  const displayRating = hoveredRating ?? rating;

  return (
    <section
      aria-labelledby="sprint-feedback-heading"
      data-testid="sprint-feedback-panel"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 flex flex-col justify-between gap-5"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C4622D] dark:text-[#E07B46]">
              Sprint Feedback Loop · Partner Reviews
            </p>
            <h2
              id="sprint-feedback-heading"
              className="mt-1 font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Qualitative Partner Ratings
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {summary.totalReviews > 0 && (
              <div className="text-end">
                <div className="flex items-center justify-end gap-1 font-mono-tabular tabular-nums text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  <Star className="w-4 h-4 fill-[#C4622D] text-[#C4622D] dark:fill-[#E07B46] dark:text-[#E07B46]" />
                  <span data-testid="feedback-average-rating">{summary.averageRating.toFixed(1)}</span>
                  <span className="text-xs font-normal text-[#575B62] dark:text-[#A3A7AE]">/ 5.0</span>
                </div>
                <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                  {summary.totalReviews} partner review{summary.totalReviews === 1 ? '' : 's'}
                </p>
              </div>
            )}

            {completedContributions.length > 0 && (
              <button
                type="button"
                data-testid="toggle-feedback-form-btn"
                onClick={() => {
                  setIsComposerOpen((prev) => !prev);
                  setError(null);
                }}
                className="min-h-[38px] px-3.5 py-2 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/70 dark:bg-[#142B24] hover:bg-[#D7ECE4] dark:hover:bg-[#1B3A30] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>{isComposerOpen ? 'Close Form' : 'Leave Review'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Saved notice */}
        {savedNotice && (
          <div
            role="status"
            data-testid="feedback-saved-notice"
            className="rounded-xl bg-[#E7F3EE]/80 dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 px-3.5 py-2.5 text-xs font-medium text-[#146C53] dark:text-[#2EB88B] flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Hiring Partner Review Form */}
        {isComposerOpen && completedContributions.length > 0 && (
          <form
            onSubmit={handleSubmit}
            data-testid="sprint-feedback-form"
            className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3.5"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="feedback-sprint-select"
                className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
              >
                Completed Sprint Contribution
              </label>
              <select
                id="feedback-sprint-select"
                data-testid="feedback-sprint-select"
                value={selectedContributionId}
                onChange={(e) => handleContributionChange(e.target.value)}
                className="w-full min-h-[40px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-2 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30"
              >
                {completedContributions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.briefTitle} (${item.payoutUsd})
                  </option>
                ))}
              </select>
            </div>

            {/* Interactive Star Rating Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  Partner Rating
                </span>
                <span className="text-xs font-mono-tabular text-[#C4622D] dark:text-[#E07B46] font-medium">
                  {displayRating}/5 · {RATING_LABELS[displayRating]}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label="Select star rating from 1 to 5"
                className="flex items-center gap-1.5"
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
                      data-testid={`feedback-star-${starValue}`}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onClick={() => setRating(starValue)}
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#C4622D] dark:hover:border-[#E07B46] inline-flex items-center justify-center transition-colors"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="feedback-reviewer-name"
                  className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
                >
                  Reviewer Name
                </label>
                <input
                  id="feedback-reviewer-name"
                  data-testid="feedback-reviewer-name"
                  type="text"
                  maxLength={80}
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g., David Kamau"
                  className="w-full min-h-[38px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-1.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="feedback-partner-org"
                  className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
                >
                  Partner Organization
                </label>
                <input
                  id="feedback-partner-org"
                  data-testid="feedback-partner-org"
                  type="text"
                  maxLength={120}
                  value={partnerOrg}
                  onChange={(e) => setPartnerOrg(e.target.value)}
                  placeholder="e.g., Rift Valley Co-op"
                  className="w-full min-h-[38px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-1.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="feedback-reviewer-role"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Role
              </label>
              <input
                id="feedback-reviewer-role"
                type="text"
                maxLength={100}
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                placeholder="e.g., Operations Director · Hiring Partner"
                className="w-full min-h-[38px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-1.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="feedback-review-text"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Brief Qualitative Review
              </label>
              <textarea
                id="feedback-review-text"
                data-testid="feedback-review-text"
                rows={3}
                maxLength={500}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share specific delivery quality, speed, or real-world impact observed by your team..."
                className="w-full resize-none rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-2 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="submit-feedback-btn"
                className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors"
              >
                Publish Partner Review
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {feedbackList.length === 0 ? (
          <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-dashed border-[#E8E3DB] dark:border-[#2C3037] p-5 text-center space-y-2">
            <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
              No partner reviews recorded yet
            </p>
            <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
              Complete a sprint in Solve so Hiring Partners can leave a star rating and brief written review.
            </p>
          </div>
        ) : (
          <div data-testid="sprint-feedback-list" className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {feedbackList.map((item) => (
              <article
                key={item.id}
                data-testid={`feedback-card-${item.id}`}
                className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-0.5"
                    aria-label={`${item.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-3.5 h-3.5 ${
                          n <= item.rating
                            ? 'fill-[#C4622D] text-[#C4622D] dark:fill-[#E07B46] dark:text-[#E07B46]'
                            : 'text-[#D6D0C5] dark:text-[#3A3E46]'
                        }`}
                      />
                    ))}
                    <span className="ms-1.5 text-xs font-mono-tabular font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {item.rating}.0
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B]">
                    {item.partnerOrg}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                  &ldquo;{item.reviewText}&rdquo;
                </p>

                <div className="pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                  <span>
                    <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {item.reviewerName}
                    </strong>{' '}
                    · {item.reviewerRole}
                  </span>
                  <span className="truncate max-w-[220px]" title={item.briefTitle}>
                    {item.briefTitle}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {completedContributions.length === 0 && (
        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          Partner reviews unlock automatically once a sprint transitions to completed.
        </p>
      )}
    </section>
  );
};
