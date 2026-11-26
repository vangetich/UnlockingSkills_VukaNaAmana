import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Edit3,
  Lock,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import type {
  MenteeReadinessRecommendation,
  MenteeRubricEvaluation,
  MentorRatingScore,
  MentorshipJournalEntry,
  MentorshipSession,
  MentorshipSessionFocus,
  PodMentorProfile,
} from '../types/kora';
import { MENTORSHIP_FOCUS_LABELS } from '../utils/talentEngine';

export interface ValidateJournalEntryInput {
  sessionDateIso: string;
  focusTopic: MentorshipSessionFocus;
  reflectionTitle: string;
  reflectionBody: string;
  nextActionStep?: string;
}

export function validateAndFormatJournalEntry(
  input: ValidateJournalEntryInput
): {
  valid: boolean;
  error?: string;
  sessionDateIso: string;
  focusTopic: MentorshipSessionFocus;
  reflectionTitle: string;
  reflectionBody: string;
  nextActionStep: string;
} {
  const rawDate = (input.sessionDateIso || '').trim();
  const safeDate =
    /^\d{4}-\d{2}-\d{2}/.test(rawDate)
      ? rawDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const allowedFocus: MentorshipSessionFocus[] = [
    'qa-architecture',
    'technical-unblocker',
    'handover-rubric',
    'career-rpl',
  ];
  const safeFocus: MentorshipSessionFocus = allowedFocus.includes(input.focusTopic)
    ? input.focusTopic
    : 'qa-architecture';

  const cleanTitle = (input.reflectionTitle || '').trim().replace(/\s+/g, ' ');
  const cleanBody = (input.reflectionBody || '').trim();
  const cleanNextStep = (input.nextActionStep || '').trim().replace(/\s+/g, ' ');

  if (cleanTitle.length < 2) {
    return {
      valid: false,
      error: 'Enter a short reflection title (at least 2 characters).',
      sessionDateIso: safeDate,
      focusTopic: safeFocus,
      reflectionTitle: cleanTitle,
      reflectionBody: cleanBody,
      nextActionStep: cleanNextStep,
    };
  }

  if (cleanTitle.length > 140) {
    return {
      valid: false,
      error: 'Keep the reflection title under 140 characters.',
      sessionDateIso: safeDate,
      focusTopic: safeFocus,
      reflectionTitle: cleanTitle.slice(0, 140),
      reflectionBody: cleanBody,
      nextActionStep: cleanNextStep,
    };
  }

  if (cleanBody.length < 5) {
    return {
      valid: false,
      error: 'Document a reflection of at least 5 characters.',
      sessionDateIso: safeDate,
      focusTopic: safeFocus,
      reflectionTitle: cleanTitle,
      reflectionBody: cleanBody,
      nextActionStep: cleanNextStep,
    };
  }

  if (cleanBody.length > 3000) {
    return {
      valid: false,
      error: 'Keep your journal reflection within 3,000 characters.',
      sessionDateIso: safeDate,
      focusTopic: safeFocus,
      reflectionTitle: cleanTitle,
      reflectionBody: cleanBody.slice(0, 3000),
      nextActionStep: cleanNextStep.slice(0, 500),
    };
  }

  return {
    valid: true,
    sessionDateIso: safeDate,
    focusTopic: safeFocus,
    reflectionTitle: cleanTitle,
    reflectionBody: cleanBody,
    nextActionStep: cleanNextStep.slice(0, 500),
  };
}

export function filterAndSortJournalEntries(
  entries: MentorshipJournalEntry[],
  filter?: { briefId?: string; contributionId?: string }
): MentorshipJournalEntry[] {
  return entries
    .filter((entry) => {
      if (filter?.briefId && filter?.contributionId) {
        return (
          entry.briefId === filter.briefId ||
          entry.contributionId === filter.contributionId
        );
      }
      if (filter?.briefId) return entry.briefId === filter.briefId;
      if (filter?.contributionId) return entry.contributionId === filter.contributionId;
      return true;
    })
    .sort((a, b) => {
      const dateDiff =
        (Date.parse(b.sessionDateIso) || 0) - (Date.parse(a.sessionDateIso) || 0);
      if (dateDiff !== 0) return dateDiff;
      return (Date.parse(b.updatedAtIso) || 0) - (Date.parse(a.updatedAtIso) || 0);
    });
}

export const MENTEE_RECOMMENDATION_LABELS: Record<
  MenteeReadinessRecommendation,
  { label: string; badgeText: string; description: string }
> = {
  'lead-ready': {
    label: 'Ready for Pod Lead Seat',
    badgeText: 'Pod Lead Cleared (4.5+ / 5.0)',
    description:
      'Demonstrates autonomous diagnostic framing, QA rigor, and ability to guide peer builders.',
  },
  'independent-cleared': {
    label: 'Cleared for Independent Sprint',
    badgeText: 'Independent Delivery (3.8–4.4 / 5.0)',
    description:
      'Reliably executes scoped deliverables and meets partner handover criteria with minimal rework.',
  },
  'guided-contributor': {
    label: 'Guided Pod Contributor',
    badgeText: 'Pod Delivery Seat (2.8–3.7 / 5.0)',
    description:
      'Strong foundational execution; benefits from milestone gate QA check-ins on edge cases.',
  },
  'foundational-coaching': {
    label: 'Foundational Coaching Recommended',
    badgeText: 'Micro-Bridge Focus (<2.8 / 5.0)',
    description:
      'Recommend pairing with a Job-to-Fit Micro-Bridge before taking solo partner deliverables.',
  },
};

export function computeMenteeRubricEvaluation(input: {
  id?: string;
  sprintId: string;
  sprintTitle: string;
  mentorId: string;
  mentorName: string;
  menteeName: string;
  problemFramingScore: MentorRatingScore;
  technicalExecutionScore: MentorRatingScore;
  podCollaborationScore: MentorRatingScore;
  handoverRigorScore: MentorRatingScore;
  endorsementNote: string;
  evaluatedAtIso?: string;
}): MenteeRubricEvaluation {
  const clampScore = (val: number): MentorRatingScore =>
    Math.max(1, Math.min(5, Math.round(Number(val) || 4))) as MentorRatingScore;

  const pScore = clampScore(input.problemFramingScore);
  const tScore = clampScore(input.technicalExecutionScore);
  const cScore = clampScore(input.podCollaborationScore);
  const hScore = clampScore(input.handoverRigorScore);

  const compositeScore =
    Math.round(((pScore + tScore + cScore + hScore) / 4) * 100) / 100;

  let recommendation: MenteeReadinessRecommendation = 'guided-contributor';
  if (compositeScore >= 4.5) {
    recommendation = 'lead-ready';
  } else if (compositeScore >= 3.8) {
    recommendation = 'independent-cleared';
  } else if (compositeScore >= 2.8) {
    recommendation = 'guided-contributor';
  } else {
    recommendation = 'foundational-coaching';
  }

  return {
    id: input.id || `mentee-eval-${Date.now()}`,
    sprintId: input.sprintId,
    sprintTitle: input.sprintTitle,
    mentorId: input.mentorId,
    mentorName: input.mentorName,
    menteeName: input.menteeName.trim() || 'Skilled Practitioner',
    problemFramingScore: pScore,
    technicalExecutionScore: tScore,
    podCollaborationScore: cScore,
    handoverRigorScore: hScore,
    compositeScore,
    recommendation,
    endorsementNote:
      input.endorsementNote.trim() ||
      'Verified technical progression and structured handover readiness during pod mentorship.',
    evaluatedAtIso: input.evaluatedAtIso || new Date().toISOString(),
  };
}

export interface SaveMentorshipJournalInput {
  id?: string;
  contributionId: string;
  briefId: string;
  briefTitle: string;
  mentorId: string;
  mentorName: string;
  sessionDateIso: string;
  focusTopic: MentorshipSessionFocus;
  reflectionTitle: string;
  reflectionBody: string;
  nextActionStep: string;
}

interface MentorshipJournalProps {
  contributionId: string;
  briefId: string;
  briefTitle: string;
  assignedMentor: PodMentorProfile;
  practitionerName?: string;
  journalEntries: MentorshipJournalEntry[];
  mentorshipSessions?: MentorshipSession[];
  onSaveJournalEntry?: (input: SaveMentorshipJournalInput) => void;
  onDeleteJournalEntry?: (entryId: string) => void;
}

const FOCUS_TOPIC_OPTIONS: MentorshipSessionFocus[] = [
  'qa-architecture',
  'technical-unblocker',
  'handover-rubric',
  'career-rpl',
];

const SCORE_CHOICES: MentorRatingScore[] = [1, 2, 3, 4, 5];

export const MentorshipJournal: React.FC<MentorshipJournalProps> = ({
  contributionId,
  briefId,
  briefTitle,
  assignedMentor,
  practitionerName = 'Skilled Practitioner',
  journalEntries,
  mentorshipSessions = [],
  onSaveJournalEntry,
  onDeleteJournalEntry,
}) => {
  const [activeMode, setActiveMode] = useState<'journal' | 'mentee-rubric'>('journal');
  const [localEntries, setLocalEntries] = useState<MentorshipJournalEntry[]>([]);

  const combinedEntries = useMemo(() => {
    const map = new Map<string, MentorshipJournalEntry>();
    for (const item of journalEntries) map.set(item.id, item);
    for (const item of localEntries) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    return filterAndSortJournalEntries(Array.from(map.values()), {
      briefId,
      contributionId,
    });
  }, [journalEntries, localEntries, briefId, contributionId]);

  const sprintSessions = useMemo(
    () =>
      mentorshipSessions.filter(
        (s) => s.sprintId === briefId && s.status === 'attended'
      ),
    [mentorshipSessions, briefId]
  );

  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(
    () => combinedEntries.length === 0
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [sessionDateIso, setSessionDateIso] = useState<string>(todayDateStr);
  const [focusTopic, setFocusTopic] =
    useState<MentorshipSessionFocus>('qa-architecture');
  const [reflectionTitle, setReflectionTitle] = useState<string>('');
  const [reflectionBody, setReflectionBody] = useState<string>('');
  const [nextActionStep, setNextActionStep] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  // Mentor-to-Mentee 4-Dimension Rubric state
  const [problemFramingScore, setProblemFramingScore] =
    useState<MentorRatingScore>(5);
  const [technicalExecutionScore, setTechnicalExecutionScore] =
    useState<MentorRatingScore>(5);
  const [podCollaborationScore, setPodCollaborationScore] =
    useState<MentorRatingScore>(4);
  const [handoverRigorScore, setHandoverRigorScore] =
    useState<MentorRatingScore>(5);
  const [endorsementNote, setEndorsementNote] = useState<string>(
    `Isolated root-cause constraints cleanly during ${briefTitle} and documented reproducible verification steps ready for partner sign-off.`
  );
  const [savedEvaluations, setSavedEvaluations] = useState<
    MenteeRubricEvaluation[]
  >([]);

  const liveEvaluationPreview = useMemo(
    () =>
      computeMenteeRubricEvaluation({
        sprintId: briefId,
        sprintTitle: briefTitle,
        mentorId: assignedMentor.id,
        mentorName: assignedMentor.name,
        menteeName: practitionerName,
        problemFramingScore,
        technicalExecutionScore,
        podCollaborationScore,
        handoverRigorScore,
        endorsementNote,
      }),
    [
      briefId,
      briefTitle,
      assignedMentor.id,
      assignedMentor.name,
      practitionerName,
      problemFramingScore,
      technicalExecutionScore,
      podCollaborationScore,
      handoverRigorScore,
      endorsementNote,
    ]
  );

  const handlePrefillFromSession = (session: MentorshipSession) => {
    setSessionDateIso(session.attendedAtIso.slice(0, 10));
    setFocusTopic(session.focusTopic);
    setReflectionTitle(
      `${MENTORSHIP_FOCUS_LABELS[session.focusTopic]} with ${session.mentorName}`
    );
    setReflectionBody(
      `Session takeaway: ${session.takeawayNote}\n\nPersonal growth reflection: Clarified technical edge cases and verification thresholds for ${briefTitle}.`
    );
    setNextActionStep(
      'Apply mentor QA checklist to final deliverable before partner handover.'
    );
    setFormError(null);
    setIsComposerOpen(true);
  };

  const handleSubmitJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAndFormatJournalEntry({
      sessionDateIso,
      focusTopic,
      reflectionTitle,
      reflectionBody,
      nextActionStep,
    });

    if (!validation.valid) {
      setFormError(validation.error || 'Please check your journal reflection.');
      return;
    }

    const payload: SaveMentorshipJournalInput = {
      id: editingEntryId ?? undefined,
      contributionId,
      briefId,
      briefTitle,
      mentorId: assignedMentor.id,
      mentorName: assignedMentor.name,
      sessionDateIso: validation.sessionDateIso,
      focusTopic: validation.focusTopic,
      reflectionTitle: validation.reflectionTitle,
      reflectionBody: validation.reflectionBody,
      nextActionStep: validation.nextActionStep,
    };

    if (onSaveJournalEntry) {
      onSaveJournalEntry(payload);
    } else {
      const now = new Date().toISOString();
      const entryRecord: MentorshipJournalEntry = {
        id: editingEntryId || `mjournal-${Date.now()}`,
        ownerUid: 'local-practitioner',
        ...payload,
        createdAtIso: now,
        updatedAtIso: now,
      };
      setLocalEntries((prev) => [
        entryRecord,
        ...prev.filter((item) => item.id !== entryRecord.id),
      ]);
    }

    setReflectionTitle('');
    setReflectionBody('');
    setNextActionStep('');
    setEditingEntryId(null);
    setFormError(null);
    setIsComposerOpen(false);
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 3200);
  };

  const handleEditEntry = (entry: MentorshipJournalEntry) => {
    setEditingEntryId(entry.id);
    setSessionDateIso(entry.sessionDateIso.slice(0, 10));
    setFocusTopic(entry.focusTopic);
    setReflectionTitle(entry.reflectionTitle);
    setReflectionBody(entry.reflectionBody);
    setNextActionStep(entry.nextActionStep);
    setFormError(null);
    setIsComposerOpen(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (onDeleteJournalEntry) {
      onDeleteJournalEntry(entryId);
    }
    setLocalEntries((prev) => prev.filter((item) => item.id !== entryId));
    if (editingEntryId === entryId) {
      setEditingEntryId(null);
      setReflectionTitle('');
      setReflectionBody('');
      setNextActionStep('');
    }
  };

  const handleRecordMenteeEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const record = computeMenteeRubricEvaluation({
      sprintId: briefId,
      sprintTitle: briefTitle,
      mentorId: assignedMentor.id,
      mentorName: assignedMentor.name,
      menteeName: practitionerName,
      problemFramingScore,
      technicalExecutionScore,
      podCollaborationScore,
      handoverRigorScore,
      endorsementNote,
    });
    setSavedEvaluations((prev) => [record, ...prev]);
  };

  return (
    <section
      data-testid="mentorship-journal-section"
      aria-label="Private Mentorship Journal and Mentee Evaluation Rubric"
      className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
    >
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] flex items-center gap-2">
              <BookOpen
                className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]"
                aria-hidden="true"
              />
              <span>Mentorship Growth Journal &amp; Mentee Assessment</span>
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E7F3EE]/80 dark:bg-[#142B24] border border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
              <Lock className="w-2.5 h-2.5" aria-hidden="true" />
              <span>Private · Dated Growth Record</span>
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Document private, dated reflections on mentorship sessions with{' '}
            <strong className="text-[#17191C] dark:text-[#F4F2EE]">
              {assignedMentor.name}
            </strong>{' '}
            or review mentor-to-mentee competency ratings.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Mentorship journal and mentee rubric tabs"
          className="inline-flex rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-0.5 gap-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'journal'}
            data-testid="mentorship-journal-tab-reflections"
            onClick={() => setActiveMode('journal')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeMode === 'journal'
                ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
            }`}
          >
            Private Reflections ({combinedEntries.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'mentee-rubric'}
            data-testid="mentorship-journal-tab-mentee-rubric"
            onClick={() => setActiveMode('mentee-rubric')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeMode === 'mentee-rubric'
                ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
            }`}
          >
            Mentor-to-Mentee Rating Rubric
          </button>
        </div>
      </div>

      {activeMode === 'journal' ? (
        <div className="space-y-4">
          {/* Top Action Bar & Session Prefill Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {sprintSessions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[#575B62] dark:text-[#A3A7AE] font-medium">
                  Prefill from attended session:
                </span>
                {sprintSessions.slice(0, 2).map((sess) => (
                  <button
                    key={sess.id}
                    type="button"
                    data-testid={`journal-prefill-session-${sess.id}`}
                    onClick={() => handlePrefillFromSession(sess)}
                    className="px-2 py-1 rounded-md border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    <span>
                      {sess.attendedAtIso.slice(0, 10)} ·{' '}
                      {MENTORSHIP_FOCUS_LABELS[sess.focusTopic]}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                Dated entries stay private to your workspace and never appear on public share cards.
              </span>
            )}

            {!isComposerOpen && (
              <button
                type="button"
                data-testid="open-journal-composer-btn"
                onClick={() => {
                  setEditingEntryId(null);
                  setSessionDateIso(todayDateStr);
                  setReflectionTitle('');
                  setReflectionBody('');
                  setNextActionStep('');
                  setIsComposerOpen(true);
                }}
                className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>New Dated Reflection</span>
              </button>
            )}
          </div>

          {savedBanner && (
            <p
              role="status"
              data-testid="mentorship-journal-saved-notice"
              className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Private mentorship reflection saved to your growth record.</span>
            </p>
          )}

          {/* Reflection Composer Form */}
          {isComposerOpen && (
            <form
              onSubmit={handleSubmitJournal}
              data-testid="mentorship-journal-form"
              className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="journal-session-date"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Session Date
                  </label>
                  <input
                    id="journal-session-date"
                    type="date"
                    data-testid="journal-session-date-input"
                    value={sessionDateIso}
                    onChange={(e) => setSessionDateIso(e.target.value)}
                    className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 text-xs font-mono-tabular text-[#17191C] dark:text-[#F4F2EE]"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="journal-focus-topic"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Mentorship Focus Area
                  </label>
                  <select
                    id="journal-focus-topic"
                    data-testid="journal-focus-topic-select"
                    value={focusTopic}
                    onChange={(e) =>
                      setFocusTopic(e.target.value as MentorshipSessionFocus)
                    }
                    className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    {FOCUS_TOPIC_OPTIONS.map((topic) => (
                      <option key={topic} value={topic}>
                        {MENTORSHIP_FOCUS_LABELS[topic]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="journal-reflection-title"
                  className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  Reflection Headline
                </label>
                <input
                  id="journal-reflection-title"
                  type="text"
                  maxLength={140}
                  data-testid="journal-reflection-title-input"
                  value={reflectionTitle}
                  onChange={(e) => {
                    setReflectionTitle(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder={`e.g., Busbar load-balancing walkthrough with ${assignedMentor.name}`}
                  className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="journal-reflection-body"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Private Reflection &amp; Key Insights
                  </label>
                  <span className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                    {reflectionBody.trim().length}/3000
                  </span>
                </div>
                <textarea
                  id="journal-reflection-body"
                  rows={3}
                  maxLength={3000}
                  data-testid="journal-reflection-body-input"
                  value={reflectionBody}
                  onChange={(e) => {
                    setReflectionBody(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="What mental model shifted during this session? Which diagnostic assumption or edge case did your mentor help refine?"
                  className="w-full rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="journal-next-action"
                  className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  Next Actionable Step for This Sprint (Optional)
                </label>
                <input
                  id="journal-next-action"
                  type="text"
                  maxLength={500}
                  data-testid="journal-next-action-input"
                  value={nextActionStep}
                  onChange={(e) => setNextActionStep(e.target.value)}
                  placeholder="e.g., Re-run 24-hour thermal excursion log before requesting final rubric sign-off"
                  className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A]"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-[#B42318] dark:text-[#F97066]"
                >
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                {combinedEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsComposerOpen(false);
                      setEditingEntryId(null);
                      setFormError(null);
                    }}
                    className="min-h-[34px] px-3 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  data-testid="save-mentorship-journal-btn"
                  className="min-h-[34px] px-4 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {editingEntryId
                      ? 'Update Dated Reflection'
                      : 'Save Dated Reflection'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Chronological Journal Entries List */}
          {combinedEntries.length > 0 ? (
            <div
              data-testid="mentorship-journal-entries-list"
              className="space-y-2.5"
            >
              {combinedEntries.map((entry) => (
                <article
                  key={entry.id}
                  data-testid={`mentorship-journal-entry-${entry.id}`}
                  className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        <span>{entry.sessionDateIso.slice(0, 10)}</span>
                      </span>
                      <span className="text-[#8A847A]" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-medium text-[#575B62] dark:text-[#A3A7AE]">
                        {MENTORSHIP_FOCUS_LABELS[entry.focusTopic]}
                      </span>
                      <span className="text-[#8A847A]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[#575B62] dark:text-[#A3A7AE]">
                        Mentor: {entry.mentorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        data-testid={`edit-journal-entry-${entry.id}`}
                        onClick={() => handleEditEntry(entry)}
                        className="px-2 py-1 rounded border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] text-[11px] font-medium text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-journal-entry-${entry.id}`}
                        onClick={() => handleDeleteEntry(entry.id)}
                        aria-label={`Delete reflection ${entry.reflectionTitle}`}
                        className="px-2 py-1 rounded border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#C4622D] text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#C4622D] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    {entry.reflectionTitle}
                  </h4>

                  <p className="text-xs text-[#43484E] dark:text-[#C4C9D0] whitespace-pre-wrap leading-relaxed">
                    {entry.reflectionBody}
                  </p>

                  {entry.nextActionStep && (
                    <div className="pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] text-[11px] text-[#17191C] dark:text-[#F4F2EE]">
                      <strong className="text-[#146C53] dark:text-[#2EB88B]">
                        Next Action:
                      </strong>{' '}
                      {entry.nextActionStep}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            !isComposerOpen && (
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                No private mentorship reflections documented for this sprint yet.
              </p>
            )
          )}
        </div>
      ) : (
        /* Ways Mentors Rate Mentees: 4-Dimension Competency & Readiness Rubric */
        <div
          data-testid="mentor-to-mentee-rubric-panel"
          className="space-y-4"
        >
          <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
                  4-Dimension Mentor-to-Mentee Evaluation Framework
                </p>
                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                  How Senior Specialists ({assignedMentor.name}) rate mentees to unlock Lead Pod Seats, RPL micro-credentials, and faster escrow sign-off.
                </p>
              </div>
              <div className="text-right font-mono-tabular tabular-nums">
                <span
                  data-testid="mentee-composite-score"
                  className="text-base font-semibold text-[#146C53] dark:text-[#2EB88B]"
                >
                  {liveEvaluationPreview.compositeScore.toFixed(2)} / 5.0
                </span>
                <p className="text-[11px] font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {
                    MENTEE_RECOMMENDATION_LABELS[
                      liveEvaluationPreview.recommendation
                    ].label
                  }
                </p>
              </div>
            </div>

            <form
              onSubmit={handleRecordMenteeEvaluation}
              className="space-y-3 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'problem-framing',
                    label: '1. Problem Framing & Diagnostic Clarity',
                    detail: 'Root-cause isolation & testable hypothesis scoping',
                    value: problemFramingScore,
                    setter: setProblemFramingScore,
                  },
                  {
                    id: 'technical-execution',
                    label: '2. Technical Execution & QA Readiness',
                    detail: 'Adherence to safety, domain, and field tolerances',
                    value: technicalExecutionScore,
                    setter: setTechnicalExecutionScore,
                  },
                  {
                    id: 'pod-collaboration',
                    label: '3. Pod Collaboration & Responsiveness',
                    detail: 'Async thread clarity, preparation, and peer handoffs',
                    value: podCollaborationScore,
                    setter: setPodCollaborationScore,
                  },
                  {
                    id: 'handover-rigor',
                    label: '4. Handover & Documentation Rigor',
                    detail: 'Reproducible runbooks & partner-ready evidence',
                    value: handoverRigorScore,
                    setter: setHandoverRigorScore,
                  },
                ].map((dim) => (
                  <div
                    key={dim.id}
                    className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {dim.label}
                      </span>
                      <span className="font-mono-tabular text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {dim.value}/5
                      </span>
                    </div>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                      {dim.detail}
                    </p>
                    <div className="flex items-center gap-1">
                      {SCORE_CHOICES.map((score) => (
                        <button
                          key={score}
                          type="button"
                          data-testid={`mentee-rubric-${dim.id}-${score}`}
                          onClick={() => dim.setter(score)}
                          className={`flex-1 py-1 rounded text-xs font-mono-tabular border transition-colors cursor-pointer ${
                            dim.value >= score
                              ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] border-transparent font-semibold'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                          }`}
                        >
                          {score}★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="mentee-endorsement-note"
                  className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  Mentor Assessment &amp; Competency Vouch Note
                </label>
                <textarea
                  id="mentee-endorsement-note"
                  rows={2}
                  maxLength={500}
                  value={endorsementNote}
                  onChange={(e) => setEndorsementNote(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
                  <Award className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {
                      MENTEE_RECOMMENDATION_LABELS[
                        liveEvaluationPreview.recommendation
                      ].badgeText
                    }
                  </span>
                </span>
                <button
                  type="submit"
                  data-testid="record-mentee-evaluation-btn"
                  className="min-h-[34px] px-3.5 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Record Mentor-to-Mentee Evaluation</span>
                </button>
              </div>
            </form>
          </div>

          {savedEvaluations.length > 0 && (
            <div className="space-y-2">
              {savedEvaluations.map((ev) => (
                <div
                  key={ev.id}
                  data-testid={`saved-mentee-evaluation-${ev.id}`}
                  className="rounded-xl bg-[#E7F3EE]/50 dark:bg-[#142B24]/50 border border-[#146C53]/30 dark:border-[#2EB88B]/30 p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {ev.mentorName} → {ev.menteeName} ·{' '}
                      <span className="text-[#146C53] dark:text-[#2EB88B]">
                        {
                          MENTEE_RECOMMENDATION_LABELS[ev.recommendation]
                            .label
                        }
                      </span>
                    </span>
                    <span className="font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      {ev.compositeScore.toFixed(2)} / 5.0
                    </span>
                  </div>
                  <p className="text-[#43484E] dark:text-[#C4C9D0]">
                    {ev.endorsementNote}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
