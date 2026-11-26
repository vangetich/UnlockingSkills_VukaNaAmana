import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  Copy,
  FileDown,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useMessaging } from '../contexts/MessagingContext';
import type {
  MentorMessage,
  MentorshipSession,
  MentorshipSessionFocus,
  PodMentorProfile,
} from '../types/kora';
import { MENTORSHIP_FOCUS_LABELS } from '../utils/talentEngine';
import { MentorDashboardFeedback } from './MentorDashboardFeedback';
import { MentorshipHealthIndicator } from './MentorshipHealthIndicator';
import { MentorshipSessionAgenda } from './MentorshipSessionAgenda';

export type SprintSuccessTipPhase = 'kickoff' | 'building' | 'qa-review' | 'wrap-up';

export interface ContextAwareSuccessTip {
  id: string;
  actionLabel: string;
  detail: string;
  draftPrompt: string;
}

export const SPRINT_PHASE_META: Record<
  SprintSuccessTipPhase,
  { shortLabel: string; fullLabel: string; tips: ContextAwareSuccessTip[] }
> = {
  kickoff: {
    shortLabel: 'Kickoff',
    fullLabel: 'Kickoff & Problem Framing',
    tips: [
      {
        id: 'kickoff-scope',
        actionLabel: 'Confirm sprint scope early',
        detail: 'Align on deliverable boundaries and acceptance criteria before diving into build work.',
        draftPrompt: 'Before I dive in, could we quickly confirm the exact acceptance criteria and out-of-scope edges for this sprint?',
      },
      {
        id: 'kickoff-agenda',
        actionLabel: 'Share a focused agenda',
        detail: 'List your top 2 framing questions in the Agenda tab so your first check-in stays sharp.',
        draftPrompt: 'I drafted a short 3-point agenda for our intro session—does this order match what you want to review first?',
      },
      {
        id: 'kickoff-pitfalls',
        actionLabel: 'Ask about common pitfalls',
        detail: 'Request one real-world failure mode your mentor has seen on similar partner briefs.',
        draftPrompt: 'What is the most common pitfall or edge case you see practitioners miss early on in sprints like this?',
      },
    ],
  },
  building: {
    shortLabel: 'Active Build',
    fullLabel: 'Active Execution & Unblocking',
    tips: [
      {
        id: 'build-screenshare',
        actionLabel: 'Request screen share',
        detail: 'Walk through live code, wiring diagrams, or draft artifacts directly for faster troubleshooting.',
        draftPrompt: 'Could we jump on a quick screen share? I want to walk through my current implementation and get your eyes on one bottleneck.',
      },
      {
        id: 'build-blockers',
        actionLabel: 'Ask about project blockers',
        detail: 'Lead with the exact technical or team handoff blocker slowing down your active milestone.',
        draftPrompt: 'Here is the specific project blocker slowing down my current milestone—could you share how you would isolate or work around it?',
      },
      {
        id: 'build-tradeoffs',
        actionLabel: 'Compare two options',
        detail: 'Bring two concrete approaches you weighed so your mentor can pressure-test trade-offs.',
        draftPrompt: 'I am weighing two design options for this milestone and want your feedback on long-term reliability before committing.',
      },
    ],
  },
  'qa-review': {
    shortLabel: 'QA Review',
    fullLabel: 'QA & Verification',
    tips: [
      {
        id: 'qa-screenshare',
        actionLabel: 'Share screen for live QA',
        detail: 'Demo edge cases, offline fallbacks, and error handling step-by-step against the brief rubric.',
        draftPrompt: 'My milestone deliverable is ready for a live QA walkthrough—can I share my screen to test edge cases together?',
      },
      {
        id: 'qa-rubric',
        actionLabel: 'Check verification criteria',
        detail: 'Confirm every Tier 2 / Tier 3 competency proof requirement is documented before submission.',
        draftPrompt: 'Before I submit for final review, is there any missing evidence needed to satisfy the verification rubric?',
      },
      {
        id: 'qa-handoff',
        actionLabel: 'Capture team handoff notes',
        detail: 'Log key QA adjustments in your sprint collaboration notes for pod continuity.',
        draftPrompt: 'I summarized our QA adjustments in the sprint notes—could you double-check if our pod handoff checklist is complete?',
      },
    ],
  },
  'wrap-up': {
    shortLabel: 'Wrap-Up',
    fullLabel: 'Handover & Growth',
    tips: [
      {
        id: 'wrap-endorsement',
        actionLabel: 'Request skill endorsement',
        detail: 'Ask your mentor to endorse the strongest competency you demonstrated for your Passport.',
        draftPrompt: 'Thank you for mentoring me through this sprint! Would you be open to endorsing the core competency I demonstrated here?',
      },
      {
        id: 'wrap-export',
        actionLabel: 'Export session summary',
        detail: 'Use Export Summary above to keep a permanent record of key takeaways and decisions.',
        draftPrompt: 'I exported our session summary for my portfolio records—any final takeaway you recommend I carry into my next brief?',
      },
      {
        id: 'wrap-next',
        actionLabel: 'Ask about next sprint goals',
        detail: 'Get tailored advice on which mentorship track or domain brief will stretch your craft next.',
        draftPrompt: 'Based on how this sprint went, which domain or mentorship track would you recommend I tackle next?',
      },
    ],
  },
};

export function resolveSprintPhaseForTips(params: {
  contextNote?: string;
  messagesCount: number;
  attendedSessionsCount: number;
  milestoneReviewsCount: number;
}): SprintSuccessTipPhase {
  const note = (params.contextNote || '').toLowerCase();
  if (
    /\b(complete|completed|settled|paid|cleared|handover|100%)\b/.test(note)
  ) {
    return 'wrap-up';
  }
  if (
    /\b(qa|review|verify|verification|audit|evidence|rubric|8\d%|9\d%)\b/.test(note) ||
    params.milestoneReviewsCount > 0 ||
    params.attendedSessionsCount >= 2
  ) {
    return 'qa-review';
  }
  if (
    /\b(kickoff|framing|onboarding|scope|intro|0%)\b/.test(note) ||
    (params.messagesCount === 0 && params.attendedSessionsCount === 0 && !note)
  ) {
    return 'kickoff';
  }
  return 'building';
}

export interface MentorshipSessionSummaryInput {
  sprintId: string;
  sprintTitle: string;
  mentor: PodMentorProfile;
  messages: MentorMessage[];
  sessions?: MentorshipSession[];
  contextNote?: string;
  generatedAtIso?: string;
}

/**
 * Pure helper that summarizes the current sprint's mentorship chat history and
 * logged QA sessions into a clean, structured text format for practitioner records.
 */
export function buildMentorshipSessionSummaryText(
  input: MentorshipSessionSummaryInput
): string {
  const {
    sprintId,
    sprintTitle,
    mentor,
    messages,
    sessions = [],
    contextNote,
    generatedAtIso = new Date().toISOString(),
  } = input;

  const sortedMessages = [...messages].sort(
    (a, b) => (Date.parse(a.createdAtIso) || 0) - (Date.parse(b.createdAtIso) || 0)
  );
  const practitionerCount = sortedMessages.filter((m) => m.sender === 'practitioner').length;
  const mentorCount = sortedMessages.filter((m) => m.sender === 'mentor').length;
  const attendedSessions = sessions.filter((s) => s.status === 'attended');
  const scheduledSessions = sessions.filter((s) => s.status === 'scheduled');
  const totalAttendedMinutes = attendedSessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );

  const lines: string[] = [
    '====================================================================',
    'KORA POD MENTORSHIP — STRUCTURED SESSION SUMMARY RECORD',
    '====================================================================',
    `Sprint:           ${sprintTitle} (${sprintId})`,
    `Pod Mentor:       ${mentor.name} · ${mentor.roleTitle}`,
    `Mentor Hub:       ${mentor.hubLocation} (${mentor.ageStageBadge})`,
    `Specialty Focus:  ${mentor.specialty}`,
    `Exported At:      ${generatedAtIso}`,
  ];

  if (contextNote && contextNote.trim().length > 0) {
    lines.push(`Sprint Context:   ${contextNote.trim()}`);
  }

  lines.push(
    '',
    '--------------------------------------------------------------------',
    '1. SESSION & THREAD OVERVIEW',
    '--------------------------------------------------------------------',
    `- Direct Thread Messages: ${sortedMessages.length} (${practitionerCount} practitioner · ${mentorCount} mentor)`,
    `- Attended QA Sessions:   ${attendedSessions.length} (${totalAttendedMinutes} mins total)`,
    `- Upcoming Scheduled:     ${scheduledSessions.length}`,
    '',
    '--------------------------------------------------------------------',
    '2. LOGGED QA SESSION TAKEAWAYS & ACTION ITEMS',
    '--------------------------------------------------------------------'
  );

  if (sessions.length === 0) {
    lines.push('No formal QA sessions logged yet for this sprint.');
  } else {
    sessions.forEach((sess, idx) => {
      const focusLabel =
        MENTORSHIP_FOCUS_LABELS[sess.focusTopic] ?? sess.focusTopic;
      const statusLabel = sess.status === 'attended' ? 'ATTENDED' : 'SCHEDULED';
      const dateSlice = (sess.attendedAtIso || '').slice(0, 10) || 'Recent';
      lines.push(
        `${idx + 1}. [${statusLabel}] ${focusLabel} (${sess.durationMinutes}m · ${dateSlice})`,
        `   Takeaway: ${sess.takeawayNote.trim()}`
      );
    });
  }

  lines.push(
    '',
    '--------------------------------------------------------------------',
    '3. CHRONOLOGICAL MENTORSHIP CHAT TRANSCRIPT',
    '--------------------------------------------------------------------',
    `[Mentor Opening Prompt — ${mentor.name}]: ${mentor.greetingPrompt}`
  );

  if (sortedMessages.length === 0) {
    lines.push('(No direct messages exchanged in this sprint thread yet.)');
  } else {
    sortedMessages.forEach((msg, index) => {
      const speaker =
        msg.sender === 'practitioner' ? 'Practitioner (You)' : `${msg.mentorName} (Mentor)`;
      const timestamp = msg.createdAtIso ? msg.createdAtIso.replace('T', ' ').slice(0, 16) + ' UTC' : 'Recent';
      lines.push(`${index + 1}. [${timestamp}] ${speaker}:`, `   ${msg.body.trim()}`);
    });
  }

  lines.push(
    '',
    '====================================================================',
    'END OF MENTORSHIP SESSION RECORD · VUKA NA AMANA / KORA WORKBENCH',
    '===================================================================='
  );

  return lines.join('\n');
}

export type RealtimeMentorAvailabilityState = 'active' | 'away' | 'offline';

export interface RealtimeMentorAvailability {
  state: RealtimeMentorAvailabilityState;
  label: 'Active' | 'Away' | 'Offline';
  detailLabel: string;
  expectedResponseTime: string;
  hubLocalTimeLabel: string;
}

const HUB_TIMEZONE_OFFSETS: Record<string, { offsetHours: number; tzLabel: string }> = {
  'mentor-green-01': { offsetHours: 3, tzLabel: 'EAT' },
  'mentor-health-02': { offsetHours: 3, tzLabel: 'EET' },
  'mentor-tech-03': { offsetHours: 1, tzLabel: 'CET' },
  'mentor-finance-04': { offsetHours: 3, tzLabel: 'EAT' },
};

/**
 * Computes real-time mentor availability ('Active', 'Away', or 'Offline')
 * from live connectivity, mentor hub schedule window, and active thread engagement
 * so practitioners can gauge expected response times accurately.
 */
export function resolveRealtimeMentorAvailability(params: {
  mentor: PodMentorProfile;
  isOnline?: boolean;
  nowMs?: number;
  hasRecentThreadActivity?: boolean;
}): RealtimeMentorAvailability {
  const {
    mentor,
    isOnline = true,
    nowMs = Date.now(),
    hasRecentThreadActivity = false,
  } = params;

  const hubTz = HUB_TIMEZONE_OFFSETS[mentor.id] ?? {
    offsetHours: 3,
    tzLabel: 'EAT',
  };
  const hubDate = new Date(nowMs + hubTz.offsetHours * 3_600_000);
  const hubHour = hubDate.getUTCHours();
  const hubMinute = hubDate.getUTCMinutes();
  const hubLocalTimeLabel = `${String(hubHour).padStart(2, '0')}:${String(
    hubMinute
  ).padStart(2, '0')} ${hubTz.tzLabel}`;

  if (!isOnline) {
    return {
      state: 'offline',
      label: 'Offline',
      detailLabel: 'Connection offline',
      expectedResponseTime: 'Queued · sends on reconnect',
      hubLocalTimeLabel,
    };
  }

  if (hasRecentThreadActivity) {
    return {
      state: 'active',
      label: 'Active',
      detailLabel: 'Live in pod thread',
      expectedResponseTime: mentor.responseWindow,
      hubLocalTimeLabel,
    };
  }

  const isOffShiftHours = hubHour < 6 || hubHour >= 22;
  if (isOffShiftHours) {
    return {
      state: 'offline',
      label: 'Offline',
      detailLabel: 'Outside hub desk hours',
      expectedResponseTime: 'Next hub shift · 06:00 local',
      hubLocalTimeLabel,
    };
  }

  if (mentor.availability === 'away') {
    return {
      state: 'away',
      label: 'Away',
      detailLabel: 'Temporarily away from desk',
      expectedResponseTime: 'Replies within 1–2h',
      hubLocalTimeLabel,
    };
  }

  if (mentor.availability === 'in-review') {
    return {
      state: 'away',
      label: 'Away',
      detailLabel: 'In pod review session',
      expectedResponseTime: 'Replies ~20m–45m',
      hubLocalTimeLabel,
    };
  }

  return {
    state: 'active',
    label: 'Active',
    detailLabel: 'Online at mentor desk',
    expectedResponseTime: mentor.responseWindow,
    hubLocalTimeLabel,
  };
}

const QUICK_PROMPTS = [
  'Request quick safety & QA review on my current draft',
  'I hit a technical blocker — can we look at a 2-line repro?',
  'Ready for handover checklist sign-off before submitting',
];

const FOCUS_OPTIONS: Array<{ id: MentorshipSessionFocus; label: string }> = [
  { id: 'qa-architecture', label: MENTORSHIP_FOCUS_LABELS['qa-architecture'] },
  { id: 'technical-unblocker', label: MENTORSHIP_FOCUS_LABELS['technical-unblocker'] },
  { id: 'handover-rubric', label: MENTORSHIP_FOCUS_LABELS['handover-rubric'] },
  { id: 'career-rpl', label: MENTORSHIP_FOCUS_LABELS['career-rpl'] },
];

const DURATION_OPTIONS: Array<15 | 30 | 45 | 60> = [15, 30, 45, 60];

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MentorMessagingDrawer: React.FC = () => {
  const {
    activeThread,
    isDrawerOpen,
    closeMentorThread,
    sendMessageToActiveMentor,
    logSessionForActiveMentor,
    markMentorshipSessionAttended,
    submitMilestoneFeedbackForActiveMentor,
    deleteMilestoneFeedback,
    saveSessionAgendaForActiveMentor,
    shareSessionAgendaToActiveMentor,
    deleteSessionAgenda,
    milestoneFeedback,
    sessionAgendas,
    getMessagesForSprint,
    getSessionsForSprint,
    getMilestoneFeedbackForSprint,
    getSessionAgendasForSprint,
  } = useMessaging();

  const [activePanel, setActivePanel] = useState<'chat' | 'session' | 'agenda' | 'feedback'>('chat');
  const [draft, setDraft] = useState('');
  const [focusTopic, setFocusTopic] = useState<MentorshipSessionFocus>('qa-architecture');
  const [durationMinutes, setDurationMinutes] = useState<15 | 30 | 45 | 60>(30);
  const [sessionStatus, setSessionStatus] = useState<'attended' | 'scheduled'>('attended');
  const [takeawayNote, setTakeawayNote] = useState('');
  const [sessionSavedFlash, setSessionSavedFlash] = useState(false);
  const [summaryExportNotice, setSummaryExportNotice] = useState<'downloaded' | 'copied' | null>(
    null
  );
  const [showSuccessTips, setShowSuccessTips] = useState(false);
  const [selectedTipPhaseOverride, setSelectedTipPhaseOverride] =
    useState<SprintSuccessTipPhase | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const threadMessages = activeThread ? getMessagesForSprint(activeThread.sprintId) : [];
  const sprintSessions = activeThread ? getSessionsForSprint(activeThread.sprintId) : [];
  const sprintMilestoneReviews = activeThread
    ? getMilestoneFeedbackForSprint(activeThread.sprintId)
    : [];
  const sprintAgendas = activeThread
    ? getSessionAgendasForSprint(activeThread.sprintId)
    : [];
  const attendedSessionsCount = sprintSessions.filter((s) => s.status === 'attended').length;
  const scheduledSessions = sprintSessions.filter((s) => s.status === 'scheduled');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) return;
    setNowMs(Date.now());
    const interval = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [isDrawerOpen]);

  const hasRecentThreadActivity = useMemo(
    () =>
      threadMessages.some((m) => {
        const ts = Date.parse(m.createdAtIso);
        return !Number.isNaN(ts) && nowMs - ts <= 300_000;
      }),
    [threadMessages, nowMs]
  );

  const liveAvailability = useMemo(() => {
    if (!activeThread) return null;
    return resolveRealtimeMentorAvailability({
      mentor: activeThread.mentor,
      isOnline,
      nowMs,
      hasRecentThreadActivity,
    });
  }, [activeThread, isOnline, nowMs, hasRecentThreadActivity]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMentorThread();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeMentorThread]);

  useEffect(() => {
    if (isDrawerOpen && activePanel === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isDrawerOpen, activePanel, threadMessages.length]);

  useEffect(() => {
    if (isDrawerOpen) {
      setActivePanel(activeThread?.initialPanel ?? 'chat');
      setDraft(activeThread?.initialDraft ?? '');
      setSessionSavedFlash(false);
      setSummaryExportNotice(null);
      setSelectedTipPhaseOverride(null);
      if ((activeThread?.initialPanel ?? 'chat') === 'chat') {
        window.setTimeout(() => inputRef.current?.focus(), 140);
      }
    }
  }, [isDrawerOpen, activeThread?.sprintId, activeThread?.initialDraft, activeThread?.initialPanel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned) return;
    sendMessageToActiveMentor(cleaned);
    setNowMs(Date.now());
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const cleaned = draft.trim();
      if (!cleaned) return;
      sendMessageToActiveMentor(cleaned);
      setNowMs(Date.now());
      setDraft('');
    }
  };

  const handleLogSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedNote = takeawayNote.trim();
    if (!cleanedNote) return;
    logSessionForActiveMentor({
      focusTopic,
      durationMinutes,
      status: sessionStatus,
      takeawayNote: cleanedNote,
    });
    setTakeawayNote('');
    setSessionSavedFlash(true);
    window.setTimeout(() => setSessionSavedFlash(false), 3200);
  };

  const handleExportSessionSummary = () => {
    if (!activeThread) return;
    const textContent = buildMentorshipSessionSummaryText({
      sprintId: activeThread.sprintId,
      sprintTitle: activeThread.sprintTitle,
      mentor: activeThread.mentor,
      messages: threadMessages,
      sessions: sprintSessions,
      contextNote: activeThread.contextNote,
    });
    const safeSlug = activeThread.sprintId.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const dateStamp = new Date().toISOString().slice(0, 10);
    if (typeof document !== 'undefined') {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `kora-mentorship-summary-${safeSlug}-${dateStamp}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }
    setSummaryExportNotice('downloaded');
    window.setTimeout(() => setSummaryExportNotice(null), 2800);
  };

  const handleCopySessionSummary = async () => {
    if (!activeThread) return;
    const textContent = buildMentorshipSessionSummaryText({
      sprintId: activeThread.sprintId,
      sprintTitle: activeThread.sprintTitle,
      mentor: activeThread.mentor,
      messages: threadMessages,
      sessions: sprintSessions,
      contextNote: activeThread.contextNote,
    });
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textContent);
      } else if (typeof document !== 'undefined') {
        const area = document.createElement('textarea');
        area.value = textContent;
        area.setAttribute('readonly', 'true');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
    } catch {
      // Clipboard fallback ignored
    }
    setSummaryExportNotice('copied');
    window.setTimeout(() => setSummaryExportNotice(null), 2800);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && activeThread && liveAvailability && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mentor-drawer-title"
          data-testid="mentor-messaging-drawer"
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeMentorThread}
            className="fixed inset-0 bg-[#17191C]/45 dark:bg-black/65 backdrop-blur-[2px]"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative z-10 w-full max-w-md h-full bg-[#FAF8F5] dark:bg-[#121315] border-s border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                    Pod Mentorship · Direct Thread
                  </p>
                  <h2
                    id="mentor-drawer-title"
                    className="mt-0.5 font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE] truncate"
                  >
                    {activeThread.mentor.name}
                  </h2>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    {activeThread.mentor.roleTitle} · {activeThread.mentor.ageStageBadge}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeMentorThread}
                  aria-label="Close mentor message drawer"
                  data-testid="close-mentor-drawer-btn"
                  className="min-h-[36px] min-w-[36px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] hover:bg-[#FAF8F5] dark:hover:bg-[#121315] inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Real-time Mentor Availability + Expected Response Strip */}
              <div
                data-testid="mentor-availability-indicator"
                data-availability={liveAvailability.state}
                className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 space-y-1 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    <span
                      aria-hidden="true"
                      className={`inline-flex rounded-full h-2.5 w-2.5 shrink-0 ${
                        liveAvailability.state === 'active'
                          ? 'bg-[#146C53] dark:bg-[#2EB88B]'
                          : liveAvailability.state === 'away'
                            ? 'bg-[#C4622D] dark:bg-[#E07B46]'
                            : 'bg-[#8A847A] dark:bg-[#6C717A]'
                      }`}
                    />
                    <span className="text-[#575B62] dark:text-[#A3A7AE]">Mentor Availability:</span>
                    <span
                      data-testid="mentor-availability-status-label"
                      className={`font-semibold ${
                        liveAvailability.state === 'active'
                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                          : liveAvailability.state === 'away'
                            ? 'text-[#C4622D] dark:text-[#E07B46]'
                            : 'text-[#575B62] dark:text-[#A3A7AE]'
                      }`}
                    >
                      {liveAvailability.label}
                    </span>
                  </span>

                  <span
                    data-testid="mentor-expected-response"
                    className="inline-flex items-center gap-1 font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]"
                  >
                    <Clock3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{liveAvailability.expectedResponseTime}</span>
                  </span>
                </div>

                <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums pl-4.5">
                  {liveAvailability.detailLabel} · Hub time {liveAvailability.hubLocalTimeLabel}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-1.5 min-w-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                    <span className="truncate">
                      Sprint: <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">{activeThread.sprintTitle}</strong>
                    </span>
                  </div>

                  {/* SessionSummaryExport Action Group */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-testid="session-summary-export-btn"
                      onClick={handleExportSessionSummary}
                      title="Download structured .txt summary of mentorship session & chat transcript"
                      className="min-h-[28px] px-2.5 py-1 rounded-lg border border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-[#E7F3EE]/70 dark:bg-[#142B24] hover:bg-[#E7F3EE] dark:hover:bg-[#19382E] text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {summaryExportNotice === 'downloaded' ? (
                        <>
                          <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Exported .txt</span>
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Export Summary</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      data-testid="session-summary-copy-btn"
                      onClick={() => void handleCopySessionSummary()}
                      title="Copy structured session summary to clipboard"
                      aria-label="Copy structured session summary to clipboard"
                      className="min-h-[28px] px-2 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[11px] font-semibold text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {summaryExportNotice === 'copied' ? (
                        <>
                          <Check className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <Copy className="w-3 h-3" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {activeThread.contextNote && (
                  <p
                    data-testid="mentor-drawer-sprint-context"
                    className="text-[11px] font-mono-tabular tabular-nums text-[#146C53] dark:text-[#2EB88B] pl-5"
                  >
                    {activeThread.contextNote}
                  </p>
                )}
              </div>

              {/* Context-Aware Mentorship Success Tips Toggle & Panel */}
              {(() => {
                const detectedPhase = resolveSprintPhaseForTips({
                  contextNote: activeThread.contextNote,
                  messagesCount: threadMessages.length,
                  attendedSessionsCount,
                  milestoneReviewsCount: sprintMilestoneReviews.length,
                });
                const activeTipPhase = selectedTipPhaseOverride ?? detectedPhase;
                const phaseConfig = SPRINT_PHASE_META[activeTipPhase];

                return (
                  <div className="space-y-2.5">
                    <MentorshipHealthIndicator
                      sprintPhase={activeTipPhase}
                      messagesCount={threadMessages.length}
                      attendedSessionsCount={attendedSessionsCount}
                      agendasCount={sprintAgendas.length}
                      milestoneReviewsCount={sprintMilestoneReviews.length}
                      onSelectSuggestedAction={(prompt) => {
                        setActivePanel('chat');
                        setDraft(prompt);
                        window.setTimeout(() => inputRef.current?.focus(), 60);
                      }}
                    />

                    <button
                      type="button"
                      data-testid="mentorship-success-tips-toggle"
                      aria-expanded={showSuccessTips}
                      aria-controls="mentorship-success-tips-panel"
                      onClick={() => setShowSuccessTips((prev) => !prev)}
                      className="w-full min-h-[38px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#E7F3EE]/55 dark:bg-[#142B24]/65 border border-[#146C53]/25 dark:border-[#2EB88B]/30 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:bg-[#E7F3EE] dark:hover:bg-[#19382E] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">Mentorship Success Tips</span>
                        <span aria-hidden="true" className="text-[#146C53]/50 dark:text-[#2EB88B]/50">·</span>
                        <span className="font-normal text-[11px] truncate text-[#575B62] dark:text-[#A3A7AE]">
                          {phaseConfig.shortLabel}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] shrink-0">
                        <span>{showSuccessTips ? 'Hide' : 'Show'}</span>
                        {showSuccessTips ? (
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </span>
                    </button>

                    {showSuccessTips && (
                      <div
                        id="mentorship-success-tips-panel"
                        data-testid="mentorship-success-tips-panel"
                        data-sprint-phase={activeTipPhase}
                        className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            {phaseConfig.fullLabel}
                          </p>
                          <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                            {activeTipPhase === detectedPhase ? 'Matched to sprint phase' : 'Manual phase preview'}
                          </span>
                        </div>

                        {/* Interactive Phase Switcher */}
                        <div
                          role="group"
                          aria-label="Sprint phase mentorship tips"
                          className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-[#F2EEE8] dark:bg-[#1A1C20]"
                        >
                          {(
                            ['kickoff', 'building', 'qa-review', 'wrap-up'] as SprintSuccessTipPhase[]
                          ).map((phaseKey) => {
                            const isCurrent = activeTipPhase === phaseKey;
                            return (
                              <button
                                key={phaseKey}
                                type="button"
                                aria-pressed={isCurrent}
                                onClick={() => setSelectedTipPhaseOverride(phaseKey)}
                                className={`py-1 px-1.5 rounded-md text-[10px] font-medium whitespace-nowrap truncate transition-colors cursor-pointer ${
                                  isCurrent
                                    ? 'bg-white dark:bg-[#24272D] text-[#146C53] dark:text-[#2EB88B] shadow-xs font-semibold'
                                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                                }`}
                              >
                                {SPRINT_PHASE_META[phaseKey].shortLabel}
                              </button>
                            );
                          })}
                        </div>

                        <ul className="space-y-2">
                          {phaseConfig.tips.map((tip) => (
                            <li
                              key={tip.id}
                              className="flex items-start justify-between gap-2.5 pt-2 first:pt-0 border-t first:border-t-0 border-[#E8E3DB]/70 dark:border-[#2C3037]/70"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                  {tip.actionLabel}
                                </p>
                                <p className="text-[11px] leading-relaxed text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                                  {tip.detail}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePanel('chat');
                                  setDraft(tip.draftPrompt);
                                  window.setTimeout(() => inputRef.current?.focus(), 60);
                                }}
                                className="shrink-0 px-2 py-1 rounded-md border border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-white dark:bg-[#1A1C20] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap transition-colors cursor-pointer"
                              >
                                Use prompt
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Drawer Mode Tabs: Direct Thread vs. QA Sessions vs. Session Agenda vs. Milestone Feedback */}
              <div
                role="tablist"
                aria-label="Mentor workspace panels"
                className="grid grid-cols-4 p-1 rounded-xl bg-[#F2EEE8] dark:bg-[#121315] text-[11px] font-medium gap-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePanel === 'chat'}
                  data-testid="mentor-tab-chat"
                  onClick={() => setActivePanel('chat')}
                  className={`py-1.5 px-1.5 rounded-lg inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activePanel === 'chat'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Thread ({threadMessages.length})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePanel === 'session'}
                  data-testid="mentor-tab-session"
                  onClick={() => setActivePanel('session')}
                  className={`py-1.5 px-1.5 rounded-lg inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activePanel === 'session'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  <CalendarPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Sessions ({attendedSessionsCount})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePanel === 'agenda'}
                  data-testid="mentor-tab-agenda"
                  onClick={() => setActivePanel('agenda')}
                  className={`py-1.5 px-1.5 rounded-lg inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activePanel === 'agenda'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Agenda ({sprintAgendas.length})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePanel === 'feedback'}
                  data-testid="mentor-tab-feedback"
                  onClick={() => setActivePanel('feedback')}
                  className={`py-1.5 px-1.5 rounded-lg inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activePanel === 'feedback'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Milestones ({sprintMilestoneReviews.length})</span>
                </button>
              </div>
            </div>

            {activePanel === 'chat' ? (
              <>
                {/* Thread Messages */}
                <div
                  ref={scrollRef}
                  data-testid="mentor-thread-messages"
                  className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                >
                  {/* Mentor Greeting Message */}
                  <div className="rounded-2xl rounded-tl-md bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 max-w-[92%] space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                      <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {activeThread.mentor.name}
                      </span>
                      <span>{activeThread.mentor.hubLocation}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                      {activeThread.mentor.greetingPrompt}
                    </p>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                      Focus: {activeThread.mentor.specialty}
                    </p>
                  </div>

                  {threadMessages.map((msg) => {
                    const isPractitioner = msg.sender === 'practitioner';
                    return (
                      <div
                        key={msg.id}
                        data-testid={`mentor-msg-${msg.sender}`}
                        className={`flex ${isPractitioner ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-[88%] space-y-1 text-xs sm:text-sm leading-relaxed ${
                            isPractitioner
                              ? 'rounded-tr-md bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                              : 'rounded-tl-md bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-between gap-3 text-[10px] font-medium ${
                              isPractitioner
                                ? 'text-white/80 dark:text-[#121315]/75'
                                : 'text-[#575B62] dark:text-[#A3A7AE]'
                            }`}
                          >
                            <span>{isPractitioner ? 'You' : msg.mentorName}</span>
                            <span className="font-mono-tabular tabular-nums">
                              {formatMessageTime(msg.createdAtIso)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      </div>
                    );
                  })}

                  {threadMessages.length === 0 && (
                    <div className="pt-2 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
                        Quick Pod Starters
                      </p>
                      <div className="flex flex-col gap-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => {
                              sendMessageToActiveMentor(prompt);
                              setNowMs(Date.now());
                            }}
                            className="text-start rounded-xl px-3.5 py-2.5 text-xs border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#17191C] dark:text-[#F4F2EE] transition-colors inline-flex items-center gap-2 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                            <span>{prompt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Composer */}
                <form
                  onSubmit={handleSubmit}
                  className="p-4 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2.5"
                >
                  <label htmlFor="mentor-message-input" className="sr-only">
                    Message {activeThread.mentor.name}
                  </label>
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      id="mentor-message-input"
                      data-testid="mentor-message-input"
                      rows={2}
                      maxLength={1000}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${activeThread.mentor.name} about this sprint…`}
                      className="flex-1 resize-none rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30 dark:focus:ring-[#2EB88B]/35"
                    />
                    <button
                      type="submit"
                      data-testid="send-mentor-message-btn"
                      disabled={draft.trim().length === 0}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] disabled:opacity-45 text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                    {liveAvailability.state === 'offline'
                      ? 'Mentor is currently offline — messages save locally and deliver as soon as their hub opens.'
                      : 'Messages save offline automatically and sync to Firebase when online.'}
                  </p>
                </form>
              </>
            ) : activePanel === 'session' ? (
              /* QA Sessions Check-In & History Panel */
              <div
                data-testid="mentor-session-panel"
                className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
              >
                <form
                  onSubmit={handleLogSessionSubmit}
                  className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3.5"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      Log or Schedule Pod QA Session
                    </h3>
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                      Recorded sessions feed your Mentorship vs. Sprint Velocity metrics in Pulse.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="session-focus-select"
                      className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      Session Focus
                    </label>
                    <select
                      id="session-focus-select"
                      data-testid="session-focus-select"
                      value={focusTopic}
                      onChange={(e) => setFocusTopic(e.target.value as MentorshipSessionFocus)}
                      className="w-full min-h-[38px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      {FOCUS_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        Duration
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {DURATION_OPTIONS.map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDurationMinutes(mins)}
                            className={`py-1.5 rounded-lg text-[11px] font-mono-tabular tabular-nums border transition-colors cursor-pointer ${
                              durationMinutes === mins
                                ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] border-transparent font-semibold'
                                : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        Check-In Status
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          data-testid="session-status-attended"
                          onClick={() => setSessionStatus('attended')}
                          className={`py-1.5 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                            sessionStatus === 'attended'
                              ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] border-transparent font-semibold'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                          }`}
                        >
                          Attended
                        </button>
                        <button
                          type="button"
                          data-testid="session-status-scheduled"
                          onClick={() => setSessionStatus('scheduled')}
                          className={`py-1.5 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                            sessionStatus === 'scheduled'
                              ? 'bg-[#C4622D] dark:bg-[#E07B46] text-white dark:text-[#121315] border-transparent font-semibold'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                          }`}
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="session-takeaway-input"
                      className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      {sessionStatus === 'attended' ? 'Key QA Takeaway / Outcome' : 'Session Agenda / Question'}
                    </label>
                    <textarea
                      id="session-takeaway-input"
                      data-testid="session-takeaway-input"
                      rows={3}
                      maxLength={600}
                      value={takeawayNote}
                      onChange={(e) => setTakeawayNote(e.target.value)}
                      placeholder={
                        sessionStatus === 'attended'
                          ? 'e.g., Confirmed 48V defrost cycle timing and safety lockout checklist with mentor.'
                          : 'e.g., Review thermal curve edge cases before final handover upload.'
                      }
                      className="w-full resize-none rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus:ring-2 focus:ring-[#146C53]/30 dark:focus:ring-[#2EB88B]/35"
                    />
                  </div>

                  <button
                    type="submit"
                    data-testid="submit-mentorship-session-btn"
                    disabled={takeawayNote.trim().length === 0}
                    className="w-full min-h-[40px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] disabled:opacity-45 text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {sessionStatus === 'attended'
                        ? 'Save Attended QA Session'
                        : 'Book Upcoming QA Session'}
                    </span>
                  </button>

                  {sessionSavedFlash && (
                    <p
                      role="status"
                      data-testid="session-saved-confirmation"
                      className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]"
                    >
                      Session saved and synced to your Pulse velocity dashboard.
                    </p>
                  )}
                </form>

                  {/* Sprint Session History */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
                      Sessions for This Sprint ({sprintSessions.length})
                    </h4>
                    <button
                      type="button"
                      data-testid="open-session-agenda-panel-btn"
                      onClick={() => setActivePanel('agenda')}
                      className="text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ListChecks className="w-3 h-3" />
                      <span>Prepare Session Agenda ({sprintAgendas.length})</span>
                    </button>
                  </div>
                  {sprintSessions.length === 0 ? (
                    <p className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] p-4 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      No QA sessions logged for this sprint yet. Log your first check-in above.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sprintSessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span
                              className={`font-semibold ${
                                sess.status === 'attended'
                                  ? 'text-[#146C53] dark:text-[#2EB88B]'
                                  : 'text-[#C4622D] dark:text-[#E07B46]'
                              }`}
                            >
                              {sess.status === 'attended' ? 'Attended' : 'Scheduled'} ·{' '}
                              {MENTORSHIP_FOCUS_LABELS[sess.focusTopic]}
                            </span>
                            <span className="font-mono-tabular tabular-nums text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                              {sess.durationMinutes}m
                            </span>
                          </div>
                          <p className="text-xs text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                            {sess.takeawayNote}
                          </p>
                          {sess.status === 'scheduled' && (
                            <div className="pt-1 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => markMentorshipSessionAttended(sess.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                <span>Mark Attended Now</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActivePanel('agenda')}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C4622D] dark:text-[#E07B46] hover:underline cursor-pointer"
                              >
                                <ListChecks className="w-3 h-3" aria-hidden="true" />
                                <span>Prepare Bulleted Agenda</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : activePanel === 'agenda' ? (
              /* Bulleted Pre-Session Agenda Builder & Tracker (MentorshipSessionAgenda) */
              <MentorshipSessionAgenda
                sprintId={activeThread.sprintId}
                sprintTitle={activeThread.sprintTitle}
                mentor={activeThread.mentor}
                agendas={sessionAgendas}
                scheduledSessions={scheduledSessions}
                onSaveAgenda={saveSessionAgendaForActiveMentor}
                onShareAgendaToThread={shareSessionAgendaToActiveMentor}
                onDeleteAgenda={deleteSessionAgenda}
              />
            ) : (
              /* Milestone Feedback Panel (MentorDashboardFeedback) */
              <MentorDashboardFeedback
                sprintId={activeThread.sprintId}
                sprintTitle={activeThread.sprintTitle}
                mentor={activeThread.mentor}
                feedbackEntries={milestoneFeedback}
                onSubmitFeedback={submitMilestoneFeedbackForActiveMentor}
                onDeleteFeedback={deleteMilestoneFeedback}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
