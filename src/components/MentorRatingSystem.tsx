import React, { useMemo, useState } from 'react';
import { CheckCircle2, Star, Trash2 } from 'lucide-react';
import type {
  MentorRating,
  MentorRatingScore,
  MentorshipTrackSpec,
  PodMentorProfile,
} from '../types/kora';

export const MENTOR_RATING_LABELS: Record<MentorRatingScore, string> = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Solid Guidance',
  4: 'High-Impact QA',
  5: 'Exceptional Mentorship',
};

export interface MentorRatingSummary {
  totalRatings: number;
  averageRating: number;
  fiveStarCount: number;
  trackRatings: MentorRating[];
}

export function validateAndFormatMentorRating(input: {
  rating: number;
  comment: string;
}): {
  valid: boolean;
  error?: string;
  rating: MentorRatingScore;
  comment: string;
} {
  const rounded = Math.round(Number(input.rating));
  if (!Number.isFinite(rounded) || rounded < 1 || rounded > 5) {
    return {
      valid: false,
      error: 'Select a rating between 1 and 5 on the 5-point scale.',
      rating: 5,
      comment: input.comment.trim(),
    };
  }
  const safeRating = rounded as MentorRatingScore;
  const cleanedComment = input.comment.trim().replace(/\s+/g, ' ');
  if (cleanedComment.length < 5) {
    return {
      valid: false,
      error: 'Leave a short comment of at least 5 characters for mentor accountability.',
      rating: safeRating,
      comment: cleanedComment,
    };
  }
  if (cleanedComment.length > 500) {
    return {
      valid: false,
      error: 'Keep your mentorship comment within 500 characters.',
      rating: safeRating,
      comment: cleanedComment.slice(0, 500),
    };
  }
  return {
    valid: true,
    rating: safeRating,
    comment: cleanedComment,
  };
}

export function computeMentorRatingSummary(
  ratings: MentorRating[],
  filter?: { trackId?: string; mentorId?: string }
): MentorRatingSummary {
  const trackRatings = ratings.filter((item) => {
    if (filter?.trackId && item.trackId !== filter.trackId) return false;
    if (filter?.mentorId && item.mentorId !== filter.mentorId) return false;
    return true;
  });

  if (trackRatings.length === 0) {
    return {
      totalRatings: 0,
      averageRating: 0,
      fiveStarCount: 0,
      trackRatings: [],
    };
  }

  const sum = trackRatings.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = Math.round((sum / trackRatings.length) * 10) / 10;
  const fiveStarCount = trackRatings.filter((r) => r.rating === 5).length;

  return {
    totalRatings: trackRatings.length,
    averageRating,
    fiveStarCount,
    trackRatings,
  };
}

interface MentorRatingSystemProps {
  selectedTrack: MentorshipTrackSpec;
  selectedMentor: PodMentorProfile;
  ratings: MentorRating[];
  onSubmitRating: (input: {
    track: MentorshipTrackSpec;
    mentorId: string;
    mentorName: string;
    rating: MentorRatingScore;
    comment: string;
  }) => MentorRating;
  onDeleteRating?: (ratingId: string) => void;
}

const RATING_SCALE: MentorRatingScore[] = [1, 2, 3, 4, 5];

export const MentorRatingSystem: React.FC<MentorRatingSystemProps> = ({
  selectedTrack,
  selectedMentor,
  ratings,
  onSubmitRating,
  onDeleteRating,
}) => {
  const [selectedScore, setSelectedScore] = useState<MentorRatingScore>(5);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      computeMentorRatingSummary(ratings, {
        trackId: selectedTrack.id,
      }),
    [ratings, selectedTrack.id]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAndFormatMentorRating({
      rating: selectedScore,
      comment,
    });
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid rating submission.');
      setSubmittedNotice(null);
      return;
    }

    onSubmitRating({
      track: selectedTrack,
      mentorId: selectedMentor.id,
      mentorName: selectedMentor.name,
      rating: validation.rating,
      comment: validation.comment,
    });

    setComment('');
    setError(null);
    setSubmittedNotice(
      `Recorded ${validation.rating}/5 accountability rating for ${selectedMentor.name}.`
    );
  };

  return (
    <section
      aria-labelledby="mentor-rating-system-heading"
      data-testid="mentor-rating-system"
      className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-4"
    >
      {/* Header & Aggregate Accountability Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
              Mentor Accountability &amp; Rating
            </span>
            <span className="text-[#8A847A]" aria-hidden="true">·</span>
            <span className="text-[#575B62] dark:text-[#A3A7AE]">
              {selectedMentor.name} · {selectedTrack.domain}
            </span>
          </div>
          <h3
            id="mentor-rating-system-heading"
            className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            Rate Your Mentorship Experience (5-Point Scale)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE] shrink-0">
          {summary.totalRatings > 0 ? (
            <>
              <span
                data-testid="mentor-rating-average"
                className="text-sm font-semibold text-[#146C53] dark:text-[#2EB88B]"
              >
                {summary.averageRating.toFixed(1)} / 5.0
              </span>
              <span aria-hidden="true">·</span>
              <span data-testid="mentor-rating-count">
                {summary.totalRatings} review{summary.totalRatings === 1 ? '' : 's'}
              </span>
            </>
          ) : (
            <span data-testid="mentor-rating-empty-metric">
              No track ratings logged yet
            </span>
          )}
        </div>
      </div>

      {/* 5-Point Rating Form */}
      <form
        onSubmit={handleSubmit}
        data-testid="mentor-rating-form"
        className="space-y-3"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
              Select 5-Point Accountability Score
            </span>
            <span
              data-testid="mentor-rating-selected-label"
              className="font-mono-tabular tabular-nums text-[#146C53] dark:text-[#2EB88B] font-semibold"
            >
              {selectedScore}/5 · {MENTOR_RATING_LABELS[selectedScore]}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="5-point mentorship rating scale"
            className="grid grid-cols-5 gap-2"
          >
            {RATING_SCALE.map((score) => {
              const isSelected = score === selectedScore;
              const isFilled = score <= selectedScore;
              return (
                <button
                  key={score}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`mentor-rating-score-${score}`}
                  onClick={() => {
                    setSelectedScore(score);
                    if (error) setError(null);
                  }}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-mono-tabular tabular-nums inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                      : isFilled
                        ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 border-[#146C53]/40 dark:border-[#2EB88B]/40 text-[#17191C] dark:text-[#F4F2EE]'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:border-[#146C53]/50'
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected
                        ? 'fill-current'
                        : isFilled
                          ? 'text-[#146C53] dark:text-[#2EB88B] fill-current'
                          : 'text-[#8A847A]'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{score} / 5</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="mentor-rating-comment-input"
              className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Short Accountability Comment
            </label>
            <span className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
              {comment.length}/500
            </span>
          </div>
          <textarea
            id="mentor-rating-comment-input"
            data-testid="mentor-rating-comment-input"
            rows={2}
            maxLength={500}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError(null);
              if (submittedNotice) setSubmittedNotice(null);
            }}
            placeholder={`Share how ${selectedMentor.name}'s feedback impacted your ${selectedTrack.domain} deliverable quality or turnaround...`}
            className="w-full rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
          />
        </div>

        {error && (
          <p
            role="alert"
            data-testid="mentor-rating-error"
            className="text-xs font-medium text-[#B42318] dark:text-[#F97066]"
          >
            {error}
          </p>
        )}

        {submittedNotice && (
          <p
            role="status"
            data-testid="mentor-rating-confirmation"
            className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{submittedNotice}</span>
          </p>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            data-testid="submit-mentor-rating-btn"
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>Submit Mentor Rating</span>
          </button>
        </div>
      </form>

      {/* Logged Accountability Reviews for Selected Track */}
      {summary.trackRatings.length > 0 && (
        <div
          data-testid="mentor-rating-history-list"
          className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
            Logged Track Ratings ({summary.trackRatings.length})
          </p>
          <div className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20]">
            {summary.trackRatings.map((entry) => (
              <div
                key={entry.id}
                data-testid={`mentor-rating-item-${entry.id}`}
                className="px-3.5 py-2.5 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      {entry.rating}.0 / 5.0
                    </span>
                    <span className="text-[#8A847A]" aria-hidden="true">·</span>
                    <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      {MENTOR_RATING_LABELS[entry.rating]}
                    </span>
                    <span className="text-[#8A847A]" aria-hidden="true">·</span>
                    <span className="text-[#575B62] dark:text-[#A3A7AE]">
                      {entry.mentorName}
                    </span>
                  </div>
                  <p className="text-xs text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                    {entry.comment}
                  </p>
                </div>

                {onDeleteRating && (
                  <button
                    type="button"
                    data-testid={`delete-mentor-rating-${entry.id}`}
                    onClick={() => onDeleteRating(entry.id)}
                    aria-label={`Delete rating for ${entry.mentorName}`}
                    className="min-h-[34px] min-w-[34px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#B42318] dark:hover:border-[#F97066] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#B42318] dark:hover:text-[#F97066] inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
