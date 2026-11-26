import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  MessageSquare,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  BriefSubmission,
  CompetencyPassport,
  MentorPairingCadence,
  MentorPairingRequest,
  MentorRating,
  MentorRatingScore,
  MentorshipSession,
  MentorshipTrackProgressRecord,
  MentorshipTrackSpec,
  StudioDomain,
} from '../types/kora';
import {
  MENTORSHIP_TRACKS,
  MENTOR_PAIRING_CADENCE_LABELS,
  POD_MENTORS,
  getMentorshipTrackForDomain,
} from '../utils/talentEngine';
import {
  MentorshipSuccessStories,
  type MentorshipSuccessStory,
} from './MentorshipSuccessStories';
import {
  MentorshipProgressBar,
  computeMentorshipTrackProgress,
} from './MentorshipProgressBar';
import {
  MentorshipMilestoneTracker,
  getLearningObjectivesForTrack,
  toggleObjectiveCompletion,
} from './MentorshipMilestoneTracker';
import { MentorshipGrowthRoadmap } from './MentorshipGrowthRoadmap';
import { MentorRatingSystem } from './MentorRatingSystem';

interface MentorshipPathsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubmission: BriefSubmission | null;
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
  mentorPairings: MentorPairingRequest[];
  mentorshipSessions?: MentorshipSession[];
  mentorRatings?: MentorRating[];
  mentorshipTrackProgress?: MentorshipTrackProgressRecord[];
  onRequestMentorPairing: (input: {
    track: MentorshipTrackSpec;
    mentorName: string;
    sprintId?: string;
    sprintTitle?: string;
    preferredCadence: MentorPairingCadence;
    sprintGoals: string;
  }) => MentorPairingRequest;
  onDeleteMentorPairing?: (pairingId: string) => void;
  onSubmitMentorRating?: (input: {
    track: MentorshipTrackSpec;
    mentorId: string;
    mentorName: string;
    rating: MentorRatingScore;
    comment: string;
  }) => MentorRating;
  onDeleteMentorRating?: (ratingId: string) => void;
  onToggleTrackObjective?: (
    trackId: string,
    objectiveId: string
  ) => MentorshipTrackProgressRecord;
  onOpenMentorThread?: (
    sprintId: string,
    sprintTitle: string,
    domain: string,
    options?: { contextNote?: string; initialPanel?: 'chat' | 'session' }
  ) => void;
  onBookSessionClick?: () => void;
}

const CADENCE_OPTIONS: MentorPairingCadence[] = [
  'milestone-gates',
  'weekly-check-in',
  'async-review',
];

export const MentorshipPathsModal: React.FC<MentorshipPathsModalProps> = ({
  isOpen,
  onClose,
  activeSubmission,
  contributions,
  passport,
  mentorPairings,
  mentorshipSessions = [],
  mentorRatings = [],
  mentorshipTrackProgress = [],
  onRequestMentorPairing,
  onDeleteMentorPairing,
  onSubmitMentorRating,
  onDeleteMentorRating,
  onToggleTrackObjective,
  onOpenMentorThread,
  onBookSessionClick,
}) => {
  const inProgressSprints = useMemo(
    () => contributions.filter((c) => c.status === 'in-progress'),
    [contributions]
  );

  const defaultTrack = useMemo(() => {
    const preferredDomain = activeSubmission?.domain ?? passport?.studioDomain;
    return getMentorshipTrackForDomain(preferredDomain);
  }, [activeSubmission?.domain, passport?.studioDomain]);

  const [selectedTrackId, setSelectedTrackId] = useState<string>(defaultTrack.id);
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    activeSubmission?.briefId ?? inProgressSprints[0]?.briefId ?? ''
  );
  const [preferredCadence, setPreferredCadence] = useState<MentorPairingCadence>(
    defaultTrack.recommendedCadence
  );
  const [sprintGoals, setSprintGoals] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);
  const [localObjectivesByTrack, setLocalObjectivesByTrack] = useState<
    Record<string, string[]>
  >({});
  const [localRatings, setLocalRatings] = useState<MentorRating[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const nextTrack = getMentorshipTrackForDomain(
      activeSubmission?.domain ?? passport?.studioDomain
    );
    setSelectedTrackId(nextTrack.id);
    setPreferredCadence(nextTrack.recommendedCadence);
    setSelectedSprintId(activeSubmission?.briefId ?? inProgressSprints[0]?.briefId ?? '');
    setError(null);
    setJustSubmittedId(null);
  }, [isOpen, activeSubmission?.briefId, activeSubmission?.domain, passport?.studioDomain, inProgressSprints]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const selectedTrack = useMemo(
    () => MENTORSHIP_TRACKS.find((t) => t.id === selectedTrackId) ?? MENTORSHIP_TRACKS[0],
    [selectedTrackId]
  );

  const selectedMentor = useMemo(
    () =>
      POD_MENTORS.find((m) => m.id === selectedTrack.mentorId) ??
      POD_MENTORS.find((m) => m.domain === selectedTrack.domain) ??
      POD_MENTORS[0],
    [selectedTrack]
  );

  const linkedSprint = useMemo(
    () => contributions.find((c) => c.briefId === selectedSprintId) ?? null,
    [contributions, selectedSprintId]
  );

  const activeTrackCompletedObjectives = useMemo(() => {
    const record = mentorshipTrackProgress.find(
      (item) => item.trackId === selectedTrack.id
    );
    if (record) {
      return record.completedObjectiveIds;
    }
    return localObjectivesByTrack[selectedTrack.id] ?? [];
  }, [mentorshipTrackProgress, localObjectivesByTrack, selectedTrack.id]);

  const syncedTrackProgress = useMemo(
    () =>
      computeMentorshipTrackProgress({
        track: selectedTrack,
        mentorshipSessions,
        mentorPairings,
        contributions,
        completedObjectiveIds: activeTrackCompletedObjectives,
      }),
    [
      selectedTrack,
      mentorshipSessions,
      mentorPairings,
      contributions,
      activeTrackCompletedObjectives,
    ]
  );

  const effectiveRatings = useMemo(
    () => (mentorRatings.length > 0 ? mentorRatings : localRatings),
    [mentorRatings, localRatings]
  );

  if (!isOpen) return null;

  const handleSelectTrack = (track: MentorshipTrackSpec) => {
    setSelectedTrackId(track.id);
    setPreferredCadence(track.recommendedCadence);
    setError(null);
    setJustSubmittedId(null);
    const matchingSprint = inProgressSprints.find(
      (s) => s.domain.toLowerCase() === track.domain.toLowerCase()
    );
    if (matchingSprint) {
      setSelectedSprintId(matchingSprint.briefId);
    }
  };

  const handlePrefillGoalFromSprint = () => {
    const target = linkedSprint ?? activeSubmission;
    if (target) {
      setSprintGoals(
        `Complete "${target.briefTitle}" with QA sign-off on deliverables, validate handover acceptance criteria, and strengthen ${selectedTrack.domain} Living Proof.`
      );
    } else {
      setSprintGoals(
        `Advance through ${selectedTrack.title} milestones and pair on verified ${selectedTrack.domain} sprint deliverables.`
      );
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sprintGoals.trim();
    if (cleaned.length < 10) {
      setError('Describe your active sprint goals in at least 10 characters so your mentor can prepare.');
      return;
    }

    const created = onRequestMentorPairing({
      track: selectedTrack,
      mentorName: selectedMentor.name,
      sprintId: linkedSprint?.briefId,
      sprintTitle: linkedSprint?.briefTitle,
      preferredCadence,
      sprintGoals: cleaned.slice(0, 800),
    });

    setSprintGoals('');
    setError(null);
    setJustSubmittedId(created.id);
  };

  const domainRecommendations = new Set<StudioDomain>();
  if (activeSubmission?.domain) {
    domainRecommendations.add(getMentorshipTrackForDomain(activeSubmission.domain).domain);
  }
  if (passport?.studioDomain) {
    domainRecommendations.add(passport.studioDomain);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentorship-paths-modal-title"
      data-testid="mentorship-paths-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
              Cross-Age Pod Mentorship Tracks
            </p>
            <h2
              id="mentorship-paths-modal-title"
              className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Mentorship Paths &amp; Formal Pairing
            </h2>
            <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
              Compare specialist mentorship tracks across sprint domains and request a formal pairing tied to your active sprint goals.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Mentorship Paths modal"
            data-testid="close-mentorship-paths-modal"
            className="min-h-[40px] min-w-[40px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] flex items-center justify-center text-[#575B62] dark:text-[#A3A7AE] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Domain Mentorship Track Selector Grid */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
                1. Choose a Domain Mentorship Track
              </h3>
              <span className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                {MENTORSHIP_TRACKS.length} domain tracks · 1:1 pod mentorship
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MENTORSHIP_TRACKS.map((track) => {
                const isSelected = track.id === selectedTrack.id;
                const isRecommended = domainRecommendations.has(track.domain);
                const trackMentor =
                  POD_MENTORS.find((m) => m.id === track.mentorId) ?? POD_MENTORS[0];

                return (
                  <button
                    key={track.id}
                    type="button"
                    data-testid={`mentorship-track-option-${track.id}`}
                    aria-pressed={isSelected}
                    onClick={() => handleSelectTrack(track)}
                    className={`text-left rounded-xl border p-4 space-y-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#E7F3EE]/65 dark:bg-[#142B24]/70 border-[#146C53] dark:border-[#2EB88B]'
                        : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53]/60 dark:hover:border-[#2EB88B]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {track.domain}
                      </span>
                      <span className="font-mono-tabular tabular-nums text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        {isRecommended ? 'Matches Active Focus' : trackMentor.responseWindow}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {track.title}
                    </p>

                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      {track.subtitle}
                    </p>

                    <p className="pt-1 border-t border-[#E8E3DB] dark:border-[#2C3037] text-[11px] text-[#17191C] dark:text-[#F4F2EE]">
                      Lead Mentor: <strong>{trackMentor.name}</strong> ·{' '}
                      <span className="text-[#575B62] dark:text-[#A3A7AE]">
                        {track.cadenceLabel}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Track Progress Bar, Sequence Milestones & Session Rewards */}
          <MentorshipProgressBar
            track={selectedTrack}
            mentorshipSessions={mentorshipSessions}
            mentorPairings={mentorPairings}
            contributions={contributions}
            completedObjectiveIds={activeTrackCompletedObjectives}
            onBookSessionClick={onBookSessionClick}
          />

          {/* D3-Based Mentorship Growth Roadmap Visualization */}
          <MentorshipGrowthRoadmap
            track={selectedTrack}
            linkedSprint={linkedSprint ?? activeSubmission}
            syncedCompletionPct={syncedTrackProgress.completionPct}
            completedObjectivesCount={activeTrackCompletedObjectives.length}
            totalObjectivesCount={getLearningObjectivesForTrack(selectedTrack).length}
          />

          {/* Learning Objectives Tracker (Synced with Mentorship Progress Bar + Audio Feedback) */}
          <MentorshipMilestoneTracker
            track={selectedTrack}
            completedObjectiveIds={activeTrackCompletedObjectives}
            syncedCompletionPct={syncedTrackProgress.completionPct}
            mentorName={selectedMentor.name}
            onToggleObjective={(trackId, objectiveId) => {
              if (onToggleTrackObjective) {
                onToggleTrackObjective(trackId, objectiveId);
                return;
              }
              setLocalObjectivesByTrack((prev) => ({
                ...prev,
                [trackId]: toggleObjectiveCompletion(
                  prev[trackId] ?? [],
                  objectiveId
                ),
              }));
            }}
          />

          {/* Selected Track Curriculum & Outcomes + Pairing Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
            {/* Track Breakdown */}
            <div className="lg:col-span-5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
                  Track Blueprint · {selectedTrack.domain}
                </p>
                <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {selectedMentor.name}
                </p>
                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  {selectedMentor.roleTitle} ({selectedMentor.ageStageBadge}) · {selectedMentor.hubLocation}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#575B62] dark:text-[#A3A7AE]">
                  Key Track Checkpoints
                </p>
                <ul className="space-y-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]">
                  {selectedTrack.keyMilestones.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#146C53] dark:text-[#2EB88B]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#575B62] dark:text-[#A3A7AE]">
                  Expected Outcomes
                </p>
                <ul className="space-y-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  {selectedTrack.expectedOutcomes.map((out) => (
                    <li key={out}>• {out}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Formal Pairing Request Form */}
            <form
              onSubmit={handleSubmit}
              data-testid="mentorship-pairing-form"
              className="lg:col-span-7 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
                  2. Request Formal Mentor Pairing
                </h3>
                <button
                  type="button"
                  onClick={handlePrefillGoalFromSprint}
                  className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
                >
                  Use active sprint goal template
                </button>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="pairing-sprint-select"
                  className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  Linked Active Sprint
                </label>
                <select
                  id="pairing-sprint-select"
                  data-testid="pairing-sprint-select"
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                >
                  <option value="">General Domain Track Goal (No Specific Sprint Linked)</option>
                  {contributions.map((c) => (
                    <option key={c.briefId} value={c.briefId}>
                      {c.briefTitle} ({c.domain} · {c.status === 'completed' ? 'Completed' : 'In Progress'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  Preferred Mentoring Cadence
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CADENCE_OPTIONS.map((cadence) => {
                    const active = preferredCadence === cadence;
                    return (
                      <button
                        key={cadence}
                        type="button"
                        data-testid={`pairing-cadence-${cadence}`}
                        aria-pressed={active}
                        onClick={() => setPreferredCadence(cadence)}
                        className={`px-3 py-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                            : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                        }`}
                      >
                        {MENTOR_PAIRING_CADENCE_LABELS[cadence]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="pairing-sprint-goals"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Active Sprint Goals &amp; Support Needed
                  </label>
                  <span className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                    {sprintGoals.length}/800
                  </span>
                </div>
                <textarea
                  id="pairing-sprint-goals"
                  data-testid="pairing-sprint-goals-input"
                  rows={3}
                  maxLength={800}
                  value={sprintGoals}
                  onChange={(e) => {
                    setSprintGoals(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Outline the exact deliverables, technical blockers, or handover standards you want mentor QA feedback on..."
                  className="w-full rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
                  {error}
                </p>
              )}

              {justSubmittedId && (
                <p
                  role="status"
                  data-testid="pairing-request-confirmation"
                  className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]"
                >
                  Formal mentor pairing request submitted to {selectedMentor.name} for the {selectedTrack.domain} track.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] transition-colors cursor-pointer"
                >
                  Done
                </button>
                <button
                  type="submit"
                  data-testid="submit-mentor-pairing-btn"
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Request Formal Mentor Pairing</span>
                </button>
              </div>
            </form>
          </div>

          {/* 5-Point Mentor Accountability & Rating System */}
          <MentorRatingSystem
            selectedTrack={selectedTrack}
            selectedMentor={selectedMentor}
            ratings={effectiveRatings}
            onSubmitRating={(input) => {
              if (onSubmitMentorRating) {
                return onSubmitMentorRating(input);
              }
              const now = new Date().toISOString();
              const fallback: MentorRating = {
                id: `rating-${Date.now()}`,
                ownerUid: 'local-practitioner',
                trackId: input.track.id,
                trackTitle: input.track.title,
                domain: input.track.domain,
                mentorId: input.mentorId,
                mentorName: input.mentorName,
                rating: input.rating,
                comment: input.comment,
                createdAtIso: now,
                updatedAtIso: now,
              };
              setLocalRatings((prev) => [fallback, ...prev]);
              return fallback;
            }}
            onDeleteRating={(ratingId) => {
              if (onDeleteMentorRating) {
                onDeleteMentorRating(ratingId);
                return;
              }
              setLocalRatings((prev) => prev.filter((r) => r.id !== ratingId));
            }}
          />

          {/* Community Track Outcomes & Success Stories */}
          <MentorshipSuccessStories
            selectedTrack={selectedTrack}
            onApplyGuidance={(story: MentorshipSuccessStory) => {
              const targetTrack =
                MENTORSHIP_TRACKS.find((t) => t.id === story.trackId) ?? selectedTrack;
              if (targetTrack.id !== selectedTrack.id) {
                handleSelectTrack(targetTrack);
              }
              setSprintGoals(story.guidanceTip);
              setError(null);
            }}
          />

          {/* Saved Formal Pairing Requests */}
          {mentorPairings.length > 0 && (
            <div
              data-testid="mentor-pairings-history"
              className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
                  Your Formal Pairing Requests
                </h3>
                <span className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                  {mentorPairings.length} active record{mentorPairings.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315]">
                {mentorPairings.map((req) => (
                  <div
                    key={req.id}
                    data-testid={`mentor-pairing-row-${req.id}`}
                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold text-[#146C53] dark:text-[#2EB88B] capitalize">
                          {req.status}
                        </span>
                        <span className="text-[#8A847A]" aria-hidden="true">·</span>
                        <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                          {req.trackTitle}
                        </span>
                        <span className="text-[#8A847A]" aria-hidden="true">·</span>
                        <span className="text-[#575B62] dark:text-[#A3A7AE]">
                          {req.mentorName}
                        </span>
                      </div>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        {MENTOR_PAIRING_CADENCE_LABELS[req.preferredCadence]}
                        {req.sprintTitle ? ` · Sprint: ${req.sprintTitle}` : ''}
                      </p>
                      <p className="text-xs text-[#17191C] dark:text-[#F4F2EE]">
                        {req.sprintGoals}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onOpenMentorThread && req.sprintId && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenMentorThread(
                              req.sprintId!,
                              req.sprintTitle || req.trackTitle,
                              req.domain,
                              {
                                initialPanel: 'chat',
                                contextNote: `Pairing track: ${req.trackTitle} — Goal: ${req.sprintGoals.slice(0, 120)}`,
                              }
                            );
                          }}
                          className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                          <span>Message Mentor</span>
                        </button>
                      )}
                      {onDeleteMentorPairing && (
                        <button
                          type="button"
                          data-testid={`delete-mentor-pairing-${req.id}`}
                          onClick={() => onDeleteMentorPairing(req.id)}
                          aria-label={`Withdraw pairing request for ${req.trackTitle}`}
                          className="min-h-[34px] min-w-[34px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#B42318] dark:hover:border-[#F97066] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#B42318] dark:hover:text-[#F97066] inline-flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mentorPairings.length === 0 && (
            <div className="pt-2 flex items-center gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
              <Compass className="w-3.5 h-3.5 shrink-0 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
              <span>
                No formal pairing requested yet. Select a domain track above and submit your active sprint goals to pair with a Senior Specialist.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
