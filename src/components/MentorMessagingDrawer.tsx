import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock3, MessageSquare, Send, ShieldCheck, X } from 'lucide-react';
import { useMessaging } from '../contexts/MessagingContext';

const QUICK_PROMPTS = [
  'Request quick safety & QA review on my current draft',
  'I hit a technical blocker — can we look at a 2-line repro?',
  'Ready for handover checklist sign-off before submitting',
];

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
    getMessagesForSprint,
  } = useMessaging();

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const threadMessages = activeThread ? getMessagesForSprint(activeThread.sprintId) : [];

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
    if (isDrawerOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isDrawerOpen, threadMessages.length]);

  useEffect(() => {
    if (isDrawerOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 140);
    }
  }, [isDrawerOpen, activeThread?.sprintId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned) return;
    sendMessageToActiveMentor(cleaned);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const cleaned = draft.trim();
      if (!cleaned) return;
      sendMessageToActiveMentor(cleaned);
      setDraft('');
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && activeThread && (
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
                  className="min-h-[36px] min-w-[36px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] hover:bg-[#FAF8F5] dark:hover:bg-[#121315] inline-flex items-center justify-center shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Real-time Availability + Sprint Context Strip */}
              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      activeThread.mentor.availability === 'available'
                        ? 'bg-[#146C53] dark:bg-[#2EB88B]'
                        : activeThread.mentor.availability === 'in-review'
                          ? 'bg-[#C4622D] dark:bg-[#E07B46]'
                          : 'bg-[#8A847A]'
                    }`}
                  />
                  <span>{activeThread.mentor.availabilityLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[#575B62] dark:text-[#A3A7AE]">
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>{activeThread.mentor.responseWindow}</span>
                </span>
              </div>

              <div className="text-xs text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                <span className="truncate">
                  Sprint: <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">{activeThread.sprintTitle}</strong>
                </span>
              </div>
            </div>

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
                        <span className="font-mono-tabular">{formatMessageTime(msg.createdAtIso)}</span>
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
                        onClick={() => sendMessageToActiveMentor(prompt)}
                        className="text-start rounded-xl px-3.5 py-2.5 text-xs border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#17191C] dark:text-[#F4F2EE] transition-colors inline-flex items-center gap-2"
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
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] disabled:opacity-45 text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
              <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                Messages save offline automatically and sync to Firebase when online.
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
