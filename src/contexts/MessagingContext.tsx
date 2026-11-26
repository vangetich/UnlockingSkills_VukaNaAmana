import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { MentorMessage, PodMentorProfile } from '../types/kora';
import { getAssignedMentorForSprint } from '../utils/talentEngine';

export interface ActiveMentorThread {
  sprintId: string;
  sprintTitle: string;
  domain: string;
  mentor: PodMentorProfile;
  contextNote?: string;
  initialDraft?: string;
}

export interface OpenMentorThreadOptions {
  contextNote?: string;
  initialDraft?: string;
}

interface MessagingContextValue {
  messages: MentorMessage[];
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
  getMentorForSprint: (sprintId: string, domain?: string) => PodMentorProfile;
  getMessagesForSprint: (sprintId: string) => MentorMessage[];
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

interface MessagingProviderProps {
  messages: MentorMessage[];
  onSendMessage: (input: {
    sprintId: string;
    sprintTitle: string;
    mentor: PodMentorProfile;
    body: string;
  }) => void;
  children: React.ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({
  messages,
  onSendMessage,
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

  const getMessagesForSprint = useCallback(
    (sprintId: string) =>
      messages
        .filter((m) => m.sprintId === sprintId)
        .sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso)),
    [messages]
  );

  const value = useMemo<MessagingContextValue>(
    () => ({
      messages,
      activeThread,
      isDrawerOpen,
      openMentorThread,
      closeMentorThread,
      sendMessageToActiveMentor,
      getMentorForSprint,
      getMessagesForSprint,
    }),
    [
      messages,
      activeThread,
      isDrawerOpen,
      openMentorThread,
      closeMentorThread,
      sendMessageToActiveMentor,
      getMentorForSprint,
      getMessagesForSprint,
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
