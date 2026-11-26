import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ListChecks,
  Plus,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import type {
  MentorshipSession,
  MentorshipSessionAgendaRecord,
  MentorshipSessionFocus,
  PodMentorProfile,
} from '../types/kora';
import {
  MENTORSHIP_FOCUS_LABELS,
  makeSafeId,
  sanitizeText,
} from '../utils/talentEngine';

export interface ValidateSessionAgendaInput {
  ownerUid: string;
  sprintId: string;
  sprintTitle: string;
  mentorId: string;
  mentorName: string;
  sessionId?: string;
  sessionDateIso: string;
  focusTopic: MentorshipSessionFocus;
  agendaTitle: string;
  desiredOutcome: string;
  agendaItems: string[];
  completedItemIndices?: number[];
  sharedWithMentor?: boolean;
  existingId?: string;
  nowIso?: string;
}

export type ValidateSessionAgendaResult =
  | { ok: true; record: MentorshipSessionAgendaRecord }
  | { ok: false; error: string };

const FOCUS_TOPIC_STARTER_ITEMS: Record<MentorshipSessionFocus, string[]> = {
  'qa-architecture': [
    'Review deliverable schematic & safety margin calculations against partner rubric',
    'Confirm failure-mode isolation and edge-case test coverage',
    'Agree on QA sign-off criteria before Milestone 2 lock',
  ],
  'technical-unblocker': [
    'Walk through 2-line reproduction of current technical or diagnostic blocker',
    'Evaluate trade-offs between primary fix and fallback workaround',
    'Lock immediate next verification action and telemetry check',
  ],
  'handover-rubric': [
    'Audit operator handover checklist and lockout-tagout instructions',
    'Verify bilingual field notes and acceptance test thresholds',
    'Confirm final submission readiness for escrow release',
  ],
  'career-rpl': [
    'Map completed sprint deliverables to UNESCO UQP / ILO RPL competency descriptors',
    'Identify evidence artifacts to highlight in Living Competency Passport',
    'Select next high-fit partner sprint or micro-bridging module',
  ],
};

/**
 * Validates and normalizes a practitioner's bulleted mentorship session agenda.
 */
export function validateAndFormatSessionAgenda(
  input: ValidateSessionAgendaInput
): ValidateSessionAgendaResult {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const safeTitle = sanitizeText(input.agendaTitle, 140);
  if (safeTitle.length < 3) {
    return {
      ok: false,
      error: 'Agenda title must be at least 3 characters.',
    };
  }

  const safeOutcome = sanitizeText(input.desiredOutcome, 400);
  if (safeOutcome.length < 5) {
    return {
      ok: false,
      error: 'Desired session outcome must be at least 5 characters.',
    };
  }

  const cleanedItems = (Array.isArray(input.agendaItems) ? input.agendaItems : [])
    .map((item) => sanitizeText(String(item), 240))
    .filter((item) => item.length >= 2)
    .slice(0, 10);

  if (cleanedItems.length === 0) {
    return {
      ok: false,
      error: 'Add at least 1 bullet item (minimum 2 characters) to your agenda.',
    };
  }

  const validIndices = Array.from(
    new Set(
      (input.completedItemIndices ?? []).filter(
        (idx) => Number.isInteger(idx) && idx >= 0 && idx < cleanedItems.length
      )
    )
  ).sort((a, b) => a - b);

  const rawDate = sanitizeText(input.sessionDateIso || nowIso.slice(0, 10), 40);
  const safeDateIso = rawDate.length >= 10 ? rawDate : nowIso.slice(0, 10);
  const safeFocus: MentorshipSessionFocus =
    input.focusTopic === 'technical-unblocker' ||
    input.focusTopic === 'handover-rubric' ||
    input.focusTopic === 'career-rpl'
      ? input.focusTopic
      : 'qa-architecture';

  const record: MentorshipSessionAgendaRecord = {
    id:
      input.existingId && input.existingId.trim().length > 0
        ? input.existingId.trim()
        : makeSafeId('magenda'),
    ownerUid: input.ownerUid || 'local-practitioner',
    sprintId: input.sprintId || 'sprint-general',
    sprintTitle: sanitizeText(input.sprintTitle, 160) || 'Solution Sprint',
    mentorId: input.mentorId || 'mentor-green-01',
    mentorName: sanitizeText(input.mentorName, 80) || 'Senior Specialist',
    sessionId:
      input.sessionId && input.sessionId.trim().length > 0
        ? input.sessionId.trim()
        : undefined,
    sessionDateIso: safeDateIso,
    focusTopic: safeFocus,
    agendaTitle: safeTitle,
    desiredOutcome: safeOutcome,
    agendaItems: cleanedItems,
    completedItemIndices: validIndices,
    sharedWithMentor: Boolean(input.sharedWithMentor),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };

  return { ok: true, record };
}

/**
 * Formats a bulleted session agenda into a structured chat message for sharing
 * directly with the pod mentor in the thread.
 */
export function formatSessionAgendaForChat(
  agenda: Pick<
    MentorshipSessionAgendaRecord,
    | 'agendaTitle'
    | 'sprintTitle'
    | 'sessionDateIso'
    | 'focusTopic'
    | 'desiredOutcome'
    | 'agendaItems'
    | 'completedItemIndices'
  >
): string {
  const focusLabel =
    MENTORSHIP_FOCUS_LABELS[agenda.focusTopic] ?? agenda.focusTopic;
  const completedSet = new Set(agenda.completedItemIndices ?? []);
  const bulletLines = agenda.agendaItems.map((item, idx) => {
    const checkMark = completedSet.has(idx) ? '[x]' : '[ ]';
    return `• ${checkMark} ${item}`;
  });

  return [
    `📋 Session Agenda Shared: ${agenda.agendaTitle}`,
    `Sprint: ${agenda.sprintTitle} · Date: ${agenda.sessionDateIso.slice(0, 10)} · Focus: ${focusLabel}`,
    `Target Outcome: ${agenda.desiredOutcome}`,
    'Agenda Items:',
    ...bulletLines,
  ].join('\n');
}

/**
 * Toggles completion state of a single agenda bullet item by index.
 */
export function toggleAgendaItemCompletion(
  agenda: MentorshipSessionAgendaRecord,
  itemIndex: number,
  nowIso = new Date().toISOString()
): MentorshipSessionAgendaRecord {
  if (itemIndex < 0 || itemIndex >= agenda.agendaItems.length) {
    return agenda;
  }
  const existing = new Set(agenda.completedItemIndices);
  if (existing.has(itemIndex)) {
    existing.delete(itemIndex);
  } else {
    existing.add(itemIndex);
  }
  return {
    ...agenda,
    completedItemIndices: Array.from(existing).sort((a, b) => a - b),
    updatedAtIso: nowIso,
  };
}

/**
 * Computes completion percentage and counts for an agenda's bullet items.
 */
export function computeSessionAgendaProgress(
  agenda: Pick<
    MentorshipSessionAgendaRecord,
    'agendaItems' | 'completedItemIndices'
  >
): {
  totalItems: number;
  completedItems: number;
  completionPct: number;
  allCompleted: boolean;
} {
  const totalItems = agenda.agendaItems.length;
  if (totalItems === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      completionPct: 0,
      allCompleted: false,
    };
  }
  const validCompleted = (agenda.completedItemIndices ?? []).filter(
    (idx) => idx >= 0 && idx < totalItems
  );
  const completedItems = new Set(validCompleted).size;
  const completionPct = Math.round((completedItems / totalItems) * 100);
  return {
    totalItems,
    completedItems,
    completionPct,
    allCompleted: completedItems === totalItems,
  };
}

interface MentorshipSessionAgendaProps {
  sprintId: string;
  sprintTitle: string;
  mentor: PodMentorProfile;
  agendas: MentorshipSessionAgendaRecord[];
  scheduledSessions?: MentorshipSession[];
  ownerUid?: string;
  onSaveAgenda: (
    agenda: MentorshipSessionAgendaRecord,
    shareToThread: boolean
  ) => void;
  onShareAgendaToThread?: (agenda: MentorshipSessionAgendaRecord) => void;
  onDeleteAgenda?: (agendaId: string) => void;
}

const FOCUS_OPTIONS: Array<{ id: MentorshipSessionFocus; label: string }> = [
  { id: 'qa-architecture', label: MENTORSHIP_FOCUS_LABELS['qa-architecture'] },
  {
    id: 'technical-unblocker',
    label: MENTORSHIP_FOCUS_LABELS['technical-unblocker'],
  },
  { id: 'handover-rubric', label: MENTORSHIP_FOCUS_LABELS['handover-rubric'] },
  { id: 'career-rpl', label: MENTORSHIP_FOCUS_LABELS['career-rpl'] },
];

export const MentorshipSessionAgenda: React.FC<MentorshipSessionAgendaProps> = ({
  sprintId,
  sprintTitle,
  mentor,
  agendas = [],
  scheduledSessions = [],
  ownerUid = 'local-practitioner',
  onSaveAgenda,
  onShareAgendaToThread,
  onDeleteAgenda,
}) => {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [focusTopic, setFocusTopic] =
    useState<MentorshipSessionFocus>('qa-architecture');
  const [sessionDateIso, setSessionDateIso] = useState(todayIso);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [bulletDraft, setBulletDraft] = useState('');
  const [agendaItems, setAgendaItems] = useState<string[]>([
    'Walk through current deliverable metrics & edge-case tests with pod mentor',
    'Confirm handover checklist sign-off requirements before final upload',
  ]);
  const [shareOnSave, setShareOnSave] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [statusFlash, setStatusFlash] = useState<string | null>(null);

  const sprintAgendas = useMemo(
    () =>
      agendas
        .filter((a) => a.sprintId === sprintId)
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
    [agendas, sprintId]
  );

  const handleAddBullet = () => {
    const cleaned = sanitizeText(bulletDraft, 240);
    if (cleaned.length < 2) {
      setValidationError('Each agenda bullet item must be at least 2 characters.');
      return;
    }
    if (agendaItems.length >= 10) {
      setValidationError('You can include up to 10 bullet items per session agenda.');
      return;
    }
    setAgendaItems((prev) => [...prev, cleaned]);
    setBulletDraft('');
    setValidationError(null);
  };

  const handleRemoveBullet = (indexToRemove: number) => {
    setAgendaItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleLoadStarterBullets = (topic: MentorshipSessionFocus) => {
    setFocusTopic(topic);
    setAgendaItems(FOCUS_TOPIC_STARTER_ITEMS[topic]);
    setValidationError(null);
  };

  const handleCreateAgendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Include any pending text typed into bulletDraft if the user hasn't clicked "+ Add"
    const pendingBullet = sanitizeText(bulletDraft, 240);
    const combinedItems =
      pendingBullet.length >= 2 && agendaItems.length < 10
        ? [...agendaItems, pendingBullet]
        : agendaItems;

    const result = validateAndFormatSessionAgenda({
      ownerUid,
      sprintId,
      sprintTitle,
      mentorId: mentor.id,
      mentorName: mentor.name,
      sessionId: selectedSessionId || undefined,
      sessionDateIso,
      focusTopic,
      agendaTitle,
      desiredOutcome,
      agendaItems: combinedItems,
      completedItemIndices: [],
      sharedWithMentor: shareOnSave,
    });

    if (!result.ok) {
      setValidationError(result.error);
      return;
    }

    onSaveAgenda(result.record, shareOnSave);
    setAgendaTitle('');
    setDesiredOutcome('');
    setBulletDraft('');
    setStatusFlash(
      shareOnSave
        ? `Agenda saved and shared with ${mentor.name} in the sprint chat thread.`
        : 'Session agenda saved for your upcoming mentor meeting.'
    );
    window.setTimeout(() => setStatusFlash(null), 4000);
  };

  const handleToggleSavedBullet = (
    agenda: MentorshipSessionAgendaRecord,
    itemIdx: number
  ) => {
    const updated = toggleAgendaItemCompletion(agenda, itemIdx);
    onSaveAgenda(updated, false);
  };

  const handleShareSavedAgenda = (agenda: MentorshipSessionAgendaRecord) => {
    const updated: MentorshipSessionAgendaRecord = {
      ...agenda,
      sharedWithMentor: true,
      updatedAtIso: new Date().toISOString(),
    };
    if (onShareAgendaToThread) {
      onShareAgendaToThread(updated);
    } else {
      onSaveAgenda(updated, true);
    }
    setStatusFlash(`Shared "${agenda.agendaTitle}" to ${mentor.name}'s thread.`);
    window.setTimeout(() => setStatusFlash(null), 3500);
  };

  return (
    <div
      data-testid="mentorship-session-agenda"
      className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
    >
      {/* Create & Share Bulleted Agenda Form */}
      <form
        onSubmit={handleCreateAgendaSubmit}
        data-testid="session-agenda-form"
        className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
              Pre-Session Focus &amp; Preparation
            </p>
            <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Create Bulleted Session Agenda
            </h3>
            <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
              Prepare a structured bulleted agenda and share it with {mentor.name} before your scheduled session so every minute is focused and tracked.
            </p>
          </div>
          <ListChecks
            className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5"
            aria-hidden="true"
          />
        </div>

        {/* Agenda Title */}
        <div className="space-y-1">
          <label
            htmlFor="session-agenda-title-input"
            className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Agenda Title
          </label>
          <input
            id="session-agenda-title-input"
            data-testid="session-agenda-title-input"
            type="text"
            maxLength={140}
            value={agendaTitle}
            onChange={(e) => setAgendaTitle(e.target.value)}
            placeholder="e.g., Milestone 2 Pre-Handover Voltage Sag & Busbar Review"
            className="w-full min-h-[38px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30 dark:focus:ring-[#2EB88B]/35"
          />
        </div>

        {/* Date, Focus Topic & Optional Scheduled Session Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="session-agenda-date-input"
              className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Target Session Date
            </label>
            <input
              id="session-agenda-date-input"
              data-testid="session-agenda-date-input"
              type="date"
              value={sessionDateIso}
              onChange={(e) => setSessionDateIso(e.target.value)}
              className="w-full min-h-[38px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 text-xs font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="session-agenda-focus-select"
              className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Focus Topic
            </label>
            <select
              id="session-agenda-focus-select"
              data-testid="session-agenda-focus-select"
              value={focusTopic}
              onChange={(e) =>
                setFocusTopic(e.target.value as MentorshipSessionFocus)
              }
              className="w-full min-h-[38px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE]"
            >
              {FOCUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {scheduledSessions.length > 0 && (
          <div className="space-y-1">
            <label
              htmlFor="session-agenda-linked-session"
              className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Link to Scheduled Session (Optional)
            </label>
            <select
              id="session-agenda-linked-session"
              data-testid="session-agenda-linked-session"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full min-h-[36px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE]"
            >
              <option value="">General Sprint Session Agenda</option>
              {scheduledSessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.attendedAtIso.slice(0, 10)} ·{' '}
                  {MENTORSHIP_FOCUS_LABELS[sess.focusTopic]} ({sess.durationMinutes}m)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Desired Session Outcome */}
        <div className="space-y-1">
          <label
            htmlFor="session-agenda-outcome-input"
            className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Desired Session Outcome
          </label>
          <textarea
            id="session-agenda-outcome-input"
            data-testid="session-agenda-outcome-input"
            rows={2}
            maxLength={400}
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            placeholder="e.g., Get mentor sign-off on the Cell #6 bypass jumper plan and confirm the 14 Nm busbar torque table."
            className="w-full resize-none rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30 dark:focus:ring-[#2EB88B]/35"
          />
        </div>

        {/* Bulleted Agenda Items Builder */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="session-agenda-bullet-input"
              className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Bulleted Agenda Items ({agendaItems.length}/10)
            </label>
            <button
              type="button"
              data-testid="session-agenda-load-template-btn"
              onClick={() => handleLoadStarterBullets(focusTopic)}
              className="text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
            >
              Load Focus Template Bullets
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="session-agenda-bullet-input"
              data-testid="session-agenda-bullet-input"
              type="text"
              maxLength={240}
              value={bulletDraft}
              onChange={(e) => setBulletDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBullet();
                }
              }}
              placeholder="Add a specific question, artifact, or decision point…"
              className="flex-1 min-h-[36px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A]"
            />
            <button
              type="button"
              data-testid="session-agenda-add-bullet-btn"
              onClick={handleAddBullet}
              disabled={bulletDraft.trim().length < 2 || agendaItems.length >= 10}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/80 dark:bg-[#142B24] hover:bg-[#E7F3EE] disabled:opacity-45 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bullet</span>
            </button>
          </div>

          {agendaItems.length > 0 && (
            <ul
              data-testid="session-agenda-draft-bullets"
              className="space-y-1.5 pt-1"
            >
              {agendaItems.map((item, idx) => (
                <li
                  key={`${idx}-${item.slice(0, 18)}`}
                  className="flex items-start justify-between gap-2 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B] shrink-0">
                      •
                    </span>
                    <span className="leading-relaxed break-words">{item}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove agenda item ${idx + 1}`}
                    data-testid={`session-agenda-remove-bullet-${idx}`}
                    onClick={() => handleRemoveBullet(idx)}
                    className="text-[#575B62] dark:text-[#A3A7AE] hover:text-[#C4622D] dark:hover:text-[#E07B46] p-0.5 shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Share to Mentor Thread Toggle */}
        <label className="flex items-center gap-2 text-xs text-[#17191C] dark:text-[#F4F2EE] cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            data-testid="session-agenda-share-checkbox"
            checked={shareOnSave}
            onChange={(e) => setShareOnSave(e.target.checked)}
            className="rounded border-[#E8E3DB] dark:border-[#2C3037] text-[#146C53] focus:ring-[#146C53]"
          />
          <span>
            Share bulleted agenda to {mentor.name}&apos;s chat thread immediately
          </span>
        </label>

        {validationError && (
          <p
            role="alert"
            data-testid="session-agenda-error"
            className="text-xs font-medium text-[#C4622D] dark:text-[#E07B46]"
          >
            {validationError}
          </p>
        )}

        <button
          type="submit"
          data-testid="session-agenda-submit-btn"
          className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {shareOnSave
              ? 'Save & Share Agenda with Mentor'
              : 'Save Session Agenda'}
          </span>
        </button>

        {statusFlash && (
          <p
            role="status"
            data-testid="session-agenda-flash"
            className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]"
          >
            {statusFlash}
          </p>
        )}
      </form>

      {/* Saved Sprint Session Agendas & Live Checklist Tracker */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
            Tracked Session Agendas ({sprintAgendas.length})
          </h4>
          <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
            Check off items during your meeting
          </span>
        </div>

        {sprintAgendas.length === 0 ? (
          <p
            data-testid="session-agenda-empty"
            className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] p-4 text-xs text-[#575B62] dark:text-[#A3A7AE]"
          >
            No session agendas prepared for this sprint yet. Create a bulleted agenda above before your next mentor check-in.
          </p>
        ) : (
          <div className="space-y-3">
            {sprintAgendas.map((agenda) => {
              const progress = computeSessionAgendaProgress(agenda);
              const completedSet = new Set(agenda.completedItemIndices);
              return (
                <article
                  key={agenda.id}
                  data-testid={`session-agenda-card-${agenda.id}`}
                  className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        <span className="inline-flex items-center gap-1 font-mono-tabular tabular-nums">
                          <Calendar className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B]" />
                          <span>{agenda.sessionDateIso.slice(0, 10)}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                          {MENTORSHIP_FOCUS_LABELS[agenda.focusTopic] ??
                            agenda.focusTopic}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          data-testid={`session-agenda-share-status-${agenda.id}`}
                          className={
                            agenda.sharedWithMentor
                              ? 'font-semibold text-[#146C53] dark:text-[#2EB88B]'
                              : 'text-[#C4622D] dark:text-[#E07B46]'
                          }
                        >
                          {agenda.sharedWithMentor
                            ? 'Shared with Mentor'
                            : 'Draft · Not Shared Yet'}
                        </span>
                      </div>

                      <h5 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {agenda.agendaTitle}
                      </h5>
                    </div>

                    {onDeleteAgenda && (
                      <button
                        type="button"
                        aria-label={`Delete agenda ${agenda.agendaTitle}`}
                        data-testid={`delete-session-agenda-${agenda.id}`}
                        onClick={() => onDeleteAgenda(agenda.id)}
                        className="p-1 rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:text-[#C4622D] dark:hover:text-[#E07B46] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                    <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      Desired Outcome:
                    </strong>{' '}
                    {agenda.desiredOutcome}
                  </p>

                  {/* Agenda Completion Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                      <span>
                        {progress.completedItems} of {progress.totalItems} agenda items covered
                      </span>
                      <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {progress.completionPct}%
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`${agenda.agendaTitle} agenda progress`}
                      aria-valuenow={progress.completionPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-1.5 w-full rounded-full bg-[#F2EEE8] dark:bg-[#121315] overflow-hidden"
                    >
                      <div
                        className="h-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] transition-[width] duration-300"
                        style={{ width: `${progress.completionPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Interactive Bulleted Checklist */}
                  <ul
                    data-testid={`session-agenda-items-${agenda.id}`}
                    className="space-y-1.5"
                  >
                    {agenda.agendaItems.map((item, idx) => {
                      const isDone = completedSet.has(idx);
                      return (
                        <li key={`${agenda.id}-item-${idx}`}>
                          <button
                            type="button"
                            data-testid={`session-agenda-toggle-${agenda.id}-${idx}`}
                            onClick={() => handleToggleSavedBullet(agenda, idx)}
                            className={`w-full text-start rounded-lg px-3 py-2 text-xs border transition-colors inline-flex items-start gap-2 cursor-pointer ${
                              isDone
                                ? 'bg-[#E7F3EE]/50 dark:bg-[#142B24]/60 border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#575B62] dark:text-[#A3A7AE] line-through'
                                : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]'
                            }`}
                          >
                            {isDone ? (
                              <CheckSquare className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-[#575B62] dark:text-[#A3A7AE] shrink-0 mt-0.5" />
                            )}
                            <span className="leading-relaxed">{item}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Share / Re-Share Action Footer */}
                  <div className="pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                      Mentor: {agenda.mentorName}
                    </span>
                    <button
                      type="button"
                      data-testid={`share-session-agenda-btn-${agenda.id}`}
                      onClick={() => handleShareSavedAgenda(agenda)}
                      className="min-h-[30px] px-3 py-1 rounded-lg border border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-[#E7F3EE]/70 dark:bg-[#142B24] hover:bg-[#E7F3EE] text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {agenda.sharedWithMentor ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Re-Share to Thread</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Share Agenda to Mentor Thread</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
