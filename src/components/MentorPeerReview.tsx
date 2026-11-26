import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
} from 'lucide-react';
import type {
  MentorPeerReviewRecord,
  PodMentorProfile,
  SprintCollaborationNote,
  SprintRatingScore,
} from '../types/kora';

export type MentorPeerReviewDraft = Omit<
  MentorPeerReviewRecord,
  'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'
>;

interface MentorPeerReviewProps {
  sprintId: string;
  sprintTitle: string;
  assignedMentor?: PodMentorProfile;
  collaborationNote?: SprintCollaborationNote | null;
  reviews?: MentorPeerReviewRecord[];
  onAddReview?: (draft: MentorPeerReviewDraft) => void;
  onDeleteReview?: (reviewId: string) => void;
}

export const MentorPeerReview: React.FC<MentorPeerReviewProps> = ({
  sprintId,
  sprintTitle,
  assignedMentor,
  collaborationNote,
  reviews = [],
  onAddReview,
  onDeleteReview,
}) => {
  const defaultMentorId = assignedMentor?.id ?? 'mentor-green-01';
  const defaultMentorName = assignedMentor?.name ?? 'Eng. Samuel Mutua';
  const defaultMentorRole = assignedMentor?.roleTitle ?? 'Lead Pod Mentor';

  const [localFallbackReviews, setLocalFallbackReviews] = useState<
    MentorPeerReviewRecord[]
  >([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cohesion, setCohesion] = useState<SprintRatingScore>(5);
  const [framing, setFraming] = useState<SprintRatingScore>(5);
  const [communication, setCommunication] = useState<SprintRatingScore>(5);
  const [feedback, setFeedback] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [mentorName, setMentorName] = useState(defaultMentorName);
  const [formError, setFormError] = useState<string | null>(null);

  const persistedSprintReviews = useMemo(() => {
    const source = onAddReview ? reviews : localFallbackReviews;
    return source
      .filter((r) => r.sprintId === sprintId)
      .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
  }, [reviews, localFallbackReviews, onAddReview, sprintId]);

  const displayedReviews = useMemo(() => {
    if (persistedSprintReviews.length > 0) {
      return persistedSprintReviews.map((rev) => ({ ...rev, isExemplar: false }));
    }
    const todayIso = new Date().toISOString();
    return [
      {
        id: `exemplar-${sprintId}`,
        ownerUid: 'exemplar',
        sprintId,
        sprintTitle,
        mentorId: defaultMentorId,
        mentorName: defaultMentorName,
        mentorRole: defaultMentorRole,
        reviewedDate: todayIso.slice(0, 10),
        cohesionScore: 5 as SprintRatingScore,
        framingScore: 4 as SprintRatingScore,
        communicationScore: 5 as SprintRatingScore,
        feedbackText: `Strong cross-age pod alignment on "${sprintTitle}". Collaboration notes show clear division of responsibilities, transparent handoff logs, and timely escalation of blockers.`,
        recommendedAction:
          'Carry this structured handoff checklist into your next Pod Sprint Review and archive key technical decisions.',
        createdAtIso: todayIso,
        updatedAtIso: todayIso,
        isExemplar: true,
      },
    ];
  }, [
    persistedSprintReviews,
    sprintId,
    sprintTitle,
    defaultMentorId,
    defaultMentorName,
    defaultMentorRole,
  ]);

  const toScore = (value: number): SprintRatingScore => {
    if (value <= 1) return 1;
    if (value >= 5) return 5;
    return Math.round(value) as SprintRatingScore;
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length < 5) {
      setFormError('Please enter at least 5 characters of formative teamwork feedback.');
      return;
    }

    const draft: MentorPeerReviewDraft = {
      sprintId,
      sprintTitle,
      mentorId: defaultMentorId,
      mentorName: mentorName.trim() || defaultMentorName,
      mentorRole: defaultMentorRole,
      reviewedDate: new Date().toISOString().split('T')[0],
      cohesionScore: cohesion,
      framingScore: framing,
      communicationScore: communication,
      feedbackText: trimmedFeedback,
      recommendedAction:
        recommendation.trim() ||
        'Continue documenting sprint handoffs and milestone evidence logs.',
    };

    if (onAddReview) {
      onAddReview(draft);
    } else {
      const now = new Date().toISOString();
      setLocalFallbackReviews((prev) => [
        {
          id: `rev-${Date.now()}`,
          ownerUid: 'local',
          ...draft,
          createdAtIso: now,
          updatedAtIso: now,
        },
        ...prev,
      ]);
    }

    setFeedback('');
    setRecommendation('');
    setFormError(null);
    setShowAddForm(false);
  };

  const handleRemove = (reviewId: string) => {
    if (onDeleteReview) {
      onDeleteReview(reviewId);
    } else {
      setLocalFallbackReviews((prev) => prev.filter((item) => item.id !== reviewId));
    }
  };

  return (
    <section
      aria-labelledby="mentor-peer-review-heading"
      data-testid="mentor-peer-review-section"
      className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Mentor-Led Team Review</span>
            </span>
            <span className="text-[#8A847A]" aria-hidden="true">·</span>
            <span className="text-[#575B62] dark:text-[#A3A7AE]">
              {persistedSprintReviews.length > 0
                ? `${persistedSprintReviews.length} saved review${persistedSprintReviews.length === 1 ? '' : 's'} synced`
                : collaborationNote
                  ? 'Synced with sprint collaboration notes'
                  : 'Ready to review collaboration notes'}
            </span>
          </div>
          <h3
            id="mentor-peer-review-heading"
            className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            Formative Feedback on Teamwork &amp; Collaboration Dynamics
          </h3>
          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Mentors review collaboration reflections and pod handoffs to log persistent formative teamwork feedback for this sprint.
          </p>
        </div>

        <button
          type="button"
          data-testid="toggle-mentor-peer-review-form-btn"
          onClick={() => {
            setShowAddForm((prev) => !prev);
            setFormError(null);
          }}
          className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/35 bg-[#E7F3EE]/60 dark:bg-[#142B24] hover:bg-[#E7F3EE] dark:hover:bg-[#19382E] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors self-start shrink-0 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{showAddForm ? 'Cancel Review' : 'Add Mentor Review'}</span>
        </button>
      </div>

      {/* Linked Collaboration Note Context Preview */}
      {collaborationNote && (
        <div className="rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#575B62] dark:text-[#A3A7AE] flex items-start gap-2">
          <FileText
            className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#146C53] dark:text-[#2EB88B]"
            aria-hidden="true"
          />
          <p className="line-clamp-2">
            <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Reviewed Collaboration Note Excerpt:
            </strong>{' '}
            {collaborationNote.markdownBody.replace(/[#>*_`]/g, '').slice(0, 180)}
          </p>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleSubmitReview}
          data-testid="mentor-peer-review-form"
          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3.5"
        >
          <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            Log Formative Mentor Review for {sprintTitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="peer-review-cohesion"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums"
              >
                Team Cohesion ({cohesion}/5)
              </label>
              <input
                id="peer-review-cohesion"
                type="range"
                min="1"
                max="5"
                value={cohesion}
                onChange={(e) => setCohesion(toScore(Number(e.target.value)))}
                className="w-full accent-[#146C53] dark:accent-[#2EB88B]"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="peer-review-framing"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums"
              >
                Problem Framing ({framing}/5)
              </label>
              <input
                id="peer-review-framing"
                type="range"
                min="1"
                max="5"
                value={framing}
                onChange={(e) => setFraming(toScore(Number(e.target.value)))}
                className="w-full accent-[#146C53] dark:accent-[#2EB88B]"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="peer-review-comms"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums"
              >
                Communication ({communication}/5)
              </label>
              <input
                id="peer-review-comms"
                type="range"
                min="1"
                max="5"
                value={communication}
                onChange={(e) => setCommunication(toScore(Number(e.target.value)))}
                className="w-full accent-[#146C53] dark:accent-[#2EB88B]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="peer-review-mentor-name"
              className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Reviewer Name
            </label>
            <input
              id="peer-review-mentor-name"
              type="text"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="peer-review-feedback"
              className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Formative Feedback on Team Dynamics
            </label>
            <textarea
              id="peer-review-feedback"
              data-testid="mentor-peer-review-feedback-input"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Provide constructive feedback on collaboration notes, pod handoffs, and teamwork clarity..."
              rows={3}
              className="w-full rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-2.5 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="peer-review-recommendation"
              className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Recommended Next Action
            </label>
            <input
              id="peer-review-recommendation"
              data-testid="mentor-peer-review-action-input"
              type="text"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="e.g. Document edge-case handoff steps before final QA sign-off"
              className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            />
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-[#C4622D] dark:text-[#E07B46]">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              data-testid="submit-mentor-peer-review-btn"
              className="min-h-[36px] px-4 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors cursor-pointer"
            >
              Save Mentor Review
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3" data-testid="mentor-peer-review-list">
        {displayedReviews.map((rev) => (
          <div
            key={rev.id}
            data-testid={`mentor-peer-review-card-${rev.id}`}
            className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {rev.mentorName}
                </span>
                <span className="text-[#8A847A]" aria-hidden="true">·</span>
                <span className="text-[#575B62] dark:text-[#A3A7AE]">
                  {rev.mentorRole}
                </span>
                {rev.isExemplar && (
                  <>
                    <span className="text-[#8A847A]" aria-hidden="true">·</span>
                    <span className="text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                      Baseline Rubric Sample
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                  {rev.reviewedDate}
                </span>
                {!rev.isExemplar && (
                  <button
                    type="button"
                    onClick={() => handleRemove(rev.id)}
                    aria-label={`Remove mentor review by ${rev.mentorName}`}
                    className="p-1 rounded-md text-[#575B62] dark:text-[#A3A7AE] hover:text-[#C4622D] dark:hover:text-[#E07B46] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-mono-tabular tabular-nums">
              <div className="flex items-center gap-1.5 text-[#575B62] dark:text-[#A3A7AE]">
                <Star
                  className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46] fill-current shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Cohesion{' '}
                  <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                    {rev.cohesionScore}/5
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#575B62] dark:text-[#A3A7AE]">
                <Star
                  className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] fill-current shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Framing{' '}
                  <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                    {rev.framingScore}/5
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#575B62] dark:text-[#A3A7AE]">
                <Star
                  className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] fill-current shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Comms{' '}
                  <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                    {rev.communicationScore}/5
                  </strong>
                </span>
              </div>
            </div>

            <p className="text-xs text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
              “{rev.feedbackText}”
            </p>

            {rev.recommendedAction && (
              <div className="flex items-start gap-2 pt-2 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    Next Action:
                  </strong>{' '}
                  {rev.recommendedAction}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
