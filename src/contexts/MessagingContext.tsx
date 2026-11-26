import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  MentorMessage,
  MentorMilestoneFeedback,
  MentorshipSession,
  MentorshipSessionAgendaRecord,
  MentorshipSessionFocus,
  PodMentorProfile,
} from '../types/kora';
import { getAssignedMentorForSprint } from '../utils/talentEngine';
import { formatMilestoneFeedbackForChat } from '../components/MentorDashboardFeedback';
import { formatSessionAgendaForChat } from '../components/MentorshipSessionAgenda';

export interface ActiveMentorThread {
  sprintId: string;
  sprintTitle: string;
  domain: string;
  mentor: PodMentorProfile;
  contextNote?: string;
  initialDraft?: string;
  initialPanel?: 'chat' | 'session' | 'agenda' | 'feedback';
}

export interface OpenMentorThreadOptions {
  contextNote?: string;
  initialDraft?: string;
  initialPanel?: 'chat' | 'session' | 'agenda' | 'feedback';
}

export interface LogMentorshipSessionInput {
  sprintId: string;
  sprintTitle: string;
  mentor: PodMentorProfile;
  focusTopic: MentorshipSessionFocus;
  durationMinutes: 15 | 30 | 45 | 60;
  status: 'attended' | 'scheduled';
  takeawayNote: string;
  scheduledAtIso?: string;
}

interface MessagingContextValue {
  messages: MentorMessage[];
  mentorshipSessions: MentorshipSession[];
  milestoneFeedback: MentorMilestoneFeedback[];
  sessionAgendas: MentorshipSessionAgendaRecord[];
  activeThread: ActiveMentorThread | null;
  isDrawerOpen: boolean;
  openMentorThread: (
    sprintId: string,
    sprintTitle: string,
    domain: string,
    options?: OpenMentorThreadOptions
  ) => void;
  closeMentorThread: () => void;
  sendMessageToActiveMentor: (body: string) => void;
  logSessionForActiveMentor: (input: Omit<LogMentorshipSessionInput, 'sprintId' | 'sprintTitle' | 'mentor'>) => void;
  bookMentorshipSession: (input: LogMentorshipSessionInput) => void;
  markMentorshipSessionAttended: (sessionId: string) => void;
  submitMilestoneFeedbackForActiveMentor: (
    draft: Omit<MentorMilestoneFeedback, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>,
    shareToThread?: boolean
  ) => void;
  deleteMilestoneFeedback: (feedbackId: string) => void;
  saveSessionAgendaForActiveMentor: (
    agenda: MentorshipSessionAgendaRecord,
    shareToThread?: boolean
  ) => void;
  shareSessionAgendaToActiveMentor: (
    agenda: MentorshipSessionAgendaRecord
  ) => void;
  deleteSessionAgenda: (agendaId: string) => void;
  getMentorForSprint: (sprintId: string, domain?: string) => PodMentorProfile;
  getMessagesForSprint: (sprintId: string) => MentorMessage[];
  getSessionsForSprint: (sprintId: string) => MentorshipSession[];
  getMilestoneFeedbackForSprint: (sprintId: string) => MentorMilestoneFeedback[];
  getSessionAgendasForSprint: (sprintId: string) => MentorshipSessionAgendaRecord[];
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

interface MessagingProviderProps {
  messages: MentorMessage[];
  mentorshipSessions?: MentorshipSession[];
  milestoneFeedback?: MentorMilestoneFeedback[];
  sessionAgendas?: MentorshipSessionAgendaRecord[];
  onSendMessage: (input: {
    sprintId: string;
    sprintTitle: string;
    mentor: PodMentorProfile;
    body: string;
  }) => void;
  onLogMentorshipSession?: (input: LogMentorshipSessionInput) => void;
  onMarkSessionAttended?: (sessionId: string) => void;
  onSubmitMilestoneFeedback?: (
    draft: Omit<MentorMilestoneFeedback, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>
  ) => void;
  onDeleteMilestoneFeedback?: (feedbackId: string) => void;
  onSaveSessionAgenda?: (agenda: MentorshipSessionAgendaRecord) => void;
  onDeleteSessionAgenda?: (agendaId: string) => void;
  children: React.ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({
  messages,
  mentorshipSessions = [],
  milestoneFeedback = [],
  sessionAgendas = [],
  onSendMessage,
  onLogMentorshipSession,
  onMarkSessionAttended,
  onSubmitMilestoneFeedback,
  onDeleteMilestoneFeedback,
  onSaveSessionAgenda,
  onDeleteSessionAgenda,
  children,
}) => {
  const [activeThread, setActiveThread] = useState<ActiveMentorThread | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getMentorForSprint = useCallback(
    (sprintId: string, domain?: string): PodMentorProfile =>
      getAssignedMentorForSprint(sprintId, domain),
    []
  );

  const openMentorThread = useCallback(
    (
      sprintId: string,
      sprintTitle: string,
      domain: string,
      options?: OpenMentorThreadOptions
    ) => {
      const mentor = getAssignedMentorForSprint(sprintId, domain);
      setActiveThread({
        sprintId,
        sprintTitle,
        domain,
        mentor,
        contextNote: options?.contextNote,
        initialDraft: options?.initialDraft,
        initialPanel: options?.initialPanel ?? 'chat',
      });
      setIsDrawerOpen(true);
    },
    []
  );

  const closeMentorThread = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const sendMessageToActiveMentor = useCallback(
    (body: string) => {
      const trimmed = body.trim();
      if (!activeThread || trimmed.length === 0) return;
      onSendMessage({
        sprintId: activeThread.sprintId,
        sprintTitle: activeThread.sprintTitle,
        mentor: activeThread.mentor,
        body: trimmed,
      });
    },
    [activeThread, onSendMessage]
  );

  const logSessionForActiveMentor = useCallback(
    (input: Omit<LogMentorshipSessionInput, 'sprintId' | 'sprintTitle' | 'mentor'>) => {
      if (!activeThread || !onLogMentorshipSession) return;
      onLogMentorshipSession({
        sprintId: activeThread.sprintId,
        sprintTitle: activeThread.sprintTitle,
        mentor: activeThread.mentor,
        ...input,
      });
    },
    [activeThread, onLogMentorshipSession]
  );

  const bookMentorshipSession = useCallback(
    (input: LogMentorshipSessionInput) => {
      onLogMentorshipSession?.(input);
    },
    [onLogMentorshipSession]
  );

  const markMentorshipSessionAttended = useCallback(
    (sessionId: string) => {
      onMarkSessionAttended?.(sessionId);
    },
    [onMarkSessionAttended]
  );

  const submitMilestoneFeedbackForActiveMentor = useCallback(
    (
      draft: Omit<MentorMilestoneFeedback, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>,
      shareToThread = true
    ) => {
      onSubmitMilestoneFeedback?.(draft);
      if (shareToThread && activeThread) {
        const chatSummary = formatMilestoneFeedbackForChat(draft);
        onSendMessage({
          sprintId: activeThread.sprintId,
          sprintTitle: activeThread.sprintTitle,
          mentor: activeThread.mentor,
          body: chatSummary,
        });
      }
    },
    [activeThread, onSendMessage, onSubmitMilestoneFeedback]
  );

  const deleteMilestoneFeedback = useCallback(
    (feedbackId: string) => {
      onDeleteMilestoneFeedback?.(feedbackId);
    },
    [onDeleteMilestoneFeedback]
  );

  const saveSessionAgendaForActiveMentor = useCallback(
    (agenda: MentorshipSessionAgendaRecord, shareToThread = false) => {
      onSaveSessionAgenda?.(agenda);
      if (shareToThread && activeThread) {
        const formatted = formatSessionAgendaForChat(agenda);
        onSendMessage({
          sprintId: activeThread.sprintId,
          sprintTitle: activeThread.sprintTitle,
          mentor: activeThread.mentor,
          body: formatted,
        });
      }
    },
    [activeThread, onSaveSessionAgenda, onSendMessage]
  );

  const shareSessionAgendaToActiveMentor = useCallback(
    (agenda: MentorshipSessionAgendaRecord) => {
      const updated: MentorshipSessionAgendaRecord = {
        ...agenda,
        sharedWithMentor: true,
        updatedAtIso: new Date().toISOString(),
      };
      onSaveSessionAgenda?.(updated);
      if (activeThread) {
        const formatted = formatSessionAgendaForChat(updated);
        onSendMessage({
          sprintId: activeThread.sprintId,
          sprintTitle: activeThread.sprintTitle,
          mentor: activeThread.mentor,
          body: formatted,
        });
      }
    },
    [activeThread, onSaveSessionAgenda, onSendMessage]
  );

  const deleteSessionAgenda = useCallback(
    (agendaId: string) => {
      onDeleteSessionAgenda?.(agendaId);
    },
    [onDeleteSessionAgenda]
  );

  const getMessagesForSprint = useCallback(
    (sprintId: string) =>
      messages
        .filter((m) => m.sprintId === sprintId)
        .sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso)),
    [messages]
  );

  const getSessionsForSprint = useCallback(
    (sprintId: string) =>
      mentorshipSessions
        .filter((s) => s.sprintId === sprintId)
        .sort((a, b) => b.attendedAtIso.localeCompare(a.attendedAtIso)),
    [mentorshipSessions]
  );

  const getMilestoneFeedbackForSprint = useCallback(
    (sprintId: string) =>
      milestoneFeedback
        .filter((f) => f.sprintId === sprintId)
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
    [milestoneFeedback]
  );

  const getSessionAgendasForSprint = useCallback(
    (sprintId: string) =>
      sessionAgendas
        .filter((a) => a.sprintId === sprintId)
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
    [sessionAgendas]
  );

  const value = useMemo<MessagingContextValue>(
    () => ({
      messages,
      mentorshipSessions,
      milestoneFeedback,
      sessionAgendas,
      activeThread,
      isDrawerOpen,
      openMentorThread,
      closeMentorThread,
      sendMessageToActiveMentor,
      logSessionForActiveMentor,
      bookMentorshipSession,
      markMentorshipSessionAttended,
      submitMilestoneFeedbackForActiveMentor,
      deleteMilestoneFeedback,
      saveSessionAgendaForActiveMentor,
      shareSessionAgendaToActiveMentor,
      deleteSessionAgenda,
      getMentorForSprint,
      getMessagesForSprint,
      getSessionsForSprint,
      getMilestoneFeedbackForSprint,
      getSessionAgendasForSprint,
    }),
    [
      messages,
      mentorshipSessions,
      milestoneFeedback,
      sessionAgendas,
      activeThread,
      isDrawerOpen,
      openMentorThread,
      closeMentorThread,
      sendMessageToActiveMentor,
      logSessionForActiveMentor,
      bookMentorshipSession,
      markMentorshipSessionAttended,
      submitMilestoneFeedbackForActiveMentor,
      deleteMilestoneFeedback,
      saveSessionAgendaForActiveMentor,
      shareSessionAgendaToActiveMentor,
      deleteSessionAgenda,
      getMentorForSprint,
      getMessagesForSprint,
      getSessionsForSprint,
      getMilestoneFeedbackForSprint,
      getSessionAgendasForSprint,
    ]
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};

export function useMessaging(): MessagingContextValue {
  const ctx = useContext(MessagingContext);
  if (!ctx) {
    throw new Error('useMessaging must be used inside a MessagingProvider');
  }
  return ctx;
}
