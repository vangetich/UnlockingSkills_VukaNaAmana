import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageSquare,
  Plus,
  User,
  X,
} from 'lucide-react';
import type {
  BriefSubmission,
  MentorPairingRequest,
  MentorshipSession,
  MentorshipSessionFocus,
} from '../types/kora';
import type { LogMentorshipSessionInput } from '../contexts/MessagingContext';
import {
  MENTORSHIP_FOCUS_LABELS,
  POD_MENTORS,
  parseCalendarSlotToIso,
} from '../utils/talentEngine';

export interface CalendarSessionItem {
  id: string;
  rawSessionId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  timeLabel: string;
  mentorName: string;
  domain: string;
  sprintId?: string;
  status: 'confirmed' | 'pending';
  source: 'session' | 'pairing' | 'custom';
}

interface MentorCalendarAvailabilityProps {
  mentorshipSessions?: MentorshipSession[];
  mentorPairings?: MentorPairingRequest[];
  contributions?: BriefSubmission[];
  embedded?: boolean;
  onBookSession?: (input: LogMentorshipSessionInput) => void;
  onConfirmSession?: (sessionId: string) => void;
  onOpenMentorThread?: (
    sprintId: string,
    sprintTitle: string,
    domain: string,
    options?: {
      contextNote?: string;
      initialPanel?: 'chat' | 'session' | 'agenda' | 'feedback';
    }
  ) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatYmd(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function addDaysYmd(base: Date, offsetDays: number): string {
  const d = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + offsetDays
  );
  return formatYmd(d.getFullYear(), d.getMonth(), d.getDate());
}

export const MentorCalendarAvailability: React.FC<
  MentorCalendarAvailabilityProps
> = ({
  mentorshipSessions = [],
  mentorPairings = [],
  contributions = [],
  embedded = false,
  onBookSession,
  onConfirmSession,
  onOpenMentorThread,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayYmd = useMemo(
    () => formatYmd(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );

  const [currentDate, setCurrentDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'confirmed' | 'pending'
  >('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [localCustomItems, setLocalCustomItems] = useState<
    CalendarSessionItem[]
  >([]);
  const [acceptedPendingIds, setAcceptedPendingIds] = useState<
    Record<string, boolean>
  >({});

  const defaultMentor = POD_MENTORS[0];
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => addDaysYmd(today, 2));
  const [newTime, setNewTime] = useState('14:00 UTC');
  const [newMentorId, setNewMentorId] = useState(defaultMentor.id);
  const [newFocusTopic, setNewFocusTopic] =
    useState<MentorshipSessionFocus>('qa-architecture');
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  // Merge real persisted mentorshipSessions + mentorPairings (+ fallback local custom items if no onBookSession provided)
  const allItems = useMemo<CalendarSessionItem[]>(() => {
    const derived: CalendarSessionItem[] = [];

    mentorshipSessions.forEach((sess) => {
      const iso = sess.attendedAtIso || new Date().toISOString();
      const parsed = new Date(iso);
      const valid = !Number.isNaN(parsed.getTime());
      const dateStr = valid
        ? formatYmd(
            parsed.getUTCFullYear(),
            parsed.getUTCMonth(),
            parsed.getUTCDate()
          )
        : todayYmd;
      const timeLabel = valid
        ? `${String(parsed.getUTCHours()).padStart(2, '0')}:${String(
            parsed.getUTCMinutes()
          ).padStart(2, '0')} UTC`
        : '14:00 UTC';
      const focusLabel =
        MENTORSHIP_FOCUS_LABELS[sess.focusTopic] ?? sess.focusTopic;
      const itemId = `session-${sess.id}`;
      const isConfirmed =
        sess.status === 'attended' || Boolean(acceptedPendingIds[itemId]);

      derived.push({
        id: itemId,
        rawSessionId: sess.id,
        title: sess.takeawayNote?.trim()
          ? `${sess.takeawayNote.trim()} (${focusLabel})`
          : `${focusLabel} — ${sess.sprintTitle}`,
        date: dateStr,
        timeLabel,
        mentorName: sess.mentorName,
        domain:
          contributions.find((c) => c.briefId === sess.sprintId)?.domain ??
          POD_MENTORS.find((m) => m.id === sess.mentorId)?.domain ??
          'Green Energy',
        sprintId: sess.sprintId,
        status: isConfirmed ? 'confirmed' : 'pending',
        source: 'session',
      });
    });

    mentorPairings.forEach((pairing, idx) => {
      const iso = pairing.createdAtIso;
      const parsed = new Date(iso);
      const valid = !Number.isNaN(parsed.getTime());
      const dateStr = valid
        ? formatYmd(
            parsed.getUTCFullYear(),
            parsed.getUTCMonth(),
            parsed.getUTCDate()
          )
        : addDaysYmd(today, idx + 3);
      const isConfirmed =
        pairing.status === 'active' ||
        pairing.status === 'matched' ||
        Boolean(acceptedPendingIds[`pairing-${pairing.id}`]);

      derived.push({
        id: `pairing-${pairing.id}`,
        title: pairing.sprintTitle
          ? `Formal Pairing · ${pairing.sprintTitle}`
          : `Formal Track Pairing · ${pairing.trackTitle}`,
        date: dateStr,
        timeLabel: '11:00 UTC',
        mentorName: pairing.mentorName,
        domain: pairing.domain,
        sprintId: pairing.sprintId,
        status: isConfirmed ? 'confirmed' : 'pending',
        source: 'pairing',
      });
    });

    if (derived.length === 0) {
      const m0 = POD_MENTORS[0];
      const m1 = POD_MENTORS[1] ?? m0;
      const m2 = POD_MENTORS[2] ?? m0;
      derived.push(
        {
          id: 'seed-cal-1',
          title: 'Microgrid Load Balancing & Handover QA',
          date: addDaysYmd(today, 2),
          timeLabel: '14:00 UTC',
          mentorName: m0.name,
          domain: m0.domain,
          sprintId: contributions[0]?.briefId,
          status: 'confirmed',
          source: 'session',
        },
        {
          id: 'seed-cal-2',
          title: 'Formal Pairing Request · Cold-Chain Protocol Review',
          date: addDaysYmd(today, 4),
          timeLabel: '10:30 UTC',
          mentorName: m1.name,
          domain: m1.domain,
          sprintId: contributions[1]?.briefId,
          status: acceptedPendingIds['seed-cal-2'] ? 'confirmed' : 'pending',
          source: 'pairing',
        },
        {
          id: 'seed-cal-3',
          title: 'Offline Sync Architecture Office Hours',
          date: addDaysYmd(today, 7),
          timeLabel: '16:00 UTC',
          mentorName: m2.name,
          domain: m2.domain,
          sprintId: contributions[0]?.briefId,
          status: 'confirmed',
          source: 'session',
        }
      );
    }

    const mergedCustom = localCustomItems.map((item) =>
      acceptedPendingIds[item.id]
        ? { ...item, status: 'confirmed' as const }
        : item
    );

    return [...mergedCustom, ...derived].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [
    mentorshipSessions,
    mentorPairings,
    contributions,
    localCustomItems,
    acceptedPendingIds,
    today,
    todayYmd,
  ]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayIndex = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDate(null);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTitle.trim();
    if (!cleaned) return;

    const chosenMentor =
      POD_MENTORS.find((m) => m.id === newMentorId) ?? POD_MENTORS[0];
    const matchedContrib =
      contributions.find((c) => c.domain === chosenMentor.domain) ??
      contributions[0];
    const scheduledIso = parseCalendarSlotToIso(newDate, newTime);

    if (onBookSession) {
      onBookSession({
        sprintId: matchedContrib?.briefId ?? 'sprint-calendar-slot',
        sprintTitle: matchedContrib?.briefTitle ?? cleaned,
        mentor: chosenMentor,
        focusTopic: newFocusTopic,
        durationMinutes: 30,
        status: 'scheduled',
        takeawayNote: cleaned,
        scheduledAtIso: scheduledIso,
      });
    } else {
      const newItem: CalendarSessionItem = {
        id: `custom-${Date.now()}`,
        title: cleaned,
        date: newDate,
        timeLabel: newTime.trim() || '14:00 UTC',
        mentorName: chosenMentor.name,
        domain: chosenMentor.domain,
        sprintId: matchedContrib?.briefId,
        status: 'pending',
        source: 'custom',
      };
      setLocalCustomItems((prev) => [newItem, ...prev]);
    }

    // Jump calendar view to booked month so the user sees the slot immediately
    const parsedBooked = new Date(scheduledIso);
    if (!Number.isNaN(parsedBooked.getTime())) {
      setCurrentDate(
        new Date(parsedBooked.getUTCFullYear(), parsedBooked.getUTCMonth(), 1)
      );
    }

    setBookingNotice(
      `Scheduled "${cleaned}" with ${chosenMentor.name} for ${newDate} (${newTime.trim() || '14:00 UTC'}).`
    );
    setNewTitle('');
    setShowNewSessionModal(false);
  };

  const handleConfirmPending = (item: CalendarSessionItem) => {
    if (item.rawSessionId && onConfirmSession) {
      onConfirmSession(item.rawSessionId);
    }
    setAcceptedPendingIds((prev) => ({ ...prev, [item.id]: true }));
  };

  const confirmedCount = allItems.filter((s) => s.status === 'confirmed').length;
  const pendingCount = allItems.filter((s) => s.status === 'pending').length;

  const filteredItems = allItems.filter((item) => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (selectedDate && item.date !== selectedDate) return false;
    return true;
  });

  const containerClass = embedded
    ? 'space-y-6'
    : 'rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-6 space-y-6';

  return (
    <section
      aria-labelledby="mentor-calendar-availability-heading"
      data-testid="mentor-calendar-availability"
      className={containerClass}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Monthly Mentorship Schedule</span>
          </p>
          <h3
            id="mentor-calendar-availability-heading"
            className="font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Mentor Calendar &amp; Pairing Availability
          </h3>
          <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
            View confirmed mentorship sessions and scheduled requests across the month. New bookings sync automatically to your workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Filter sessions by confirmation status"
            className="inline-flex items-center p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
          >
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-[#24272D] text-[#17191C] dark:text-[#F4F2EE] font-semibold shadow-xs'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              All ({allItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('confirmed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === 'confirmed'
                  ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Confirmed ({confirmedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-[#C4622D] dark:bg-[#E07B46] text-white dark:text-[#121315] font-semibold'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Scheduled ({pendingCount})
            </button>
          </div>

          <button
            type="button"
            data-testid="open-request-pairing-session-btn"
            onClick={() => setShowNewSessionModal(true)}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Request Pairing Session</span>
          </button>
        </div>
      </div>

      {bookingNotice && (
        <div
          role="status"
          data-testid="calendar-booking-confirmation"
          className="rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/35 bg-[#E7F3EE]/65 dark:bg-[#142B24] px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs text-[#17191C] dark:text-[#F4F2EE]"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2
              className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0"
              aria-hidden="true"
            />
            <span>{bookingNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setBookingNotice(null)}
            aria-label="Dismiss booking confirmation"
            className="text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Month Grid + Sessions Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Calendar */}
        <div className="lg:col-span-5 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm text-[#17191C] dark:text-[#F4F2EE]">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="min-h-[32px] min-w-[32px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="min-h-[32px] min-w-[32px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs font-mono-tabular tabular-nums">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatYmd(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                dayNum
              );
              const dayItems = allItems.filter((item) => item.date === dateStr);
              const hasConfirmed = dayItems.some(
                (item) => item.status === 'confirmed'
              );
              const hasPending = dayItems.some(
                (item) => item.status === 'pending'
              );
              const isToday = dateStr === todayYmd;
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() =>
                    setSelectedDate((prev) =>
                      prev === dateStr ? null : dateStr
                    )
                  }
                  aria-pressed={isSelected}
                  aria-label={`${MONTH_NAMES[currentDate.getMonth()]} ${dayNum}, ${currentDate.getFullYear()}${dayItems.length > 0 ? `, ${dayItems.length} mentorship event${dayItems.length > 1 ? 's' : ''}` : ''}`}
                  className={`h-9 rounded-lg border text-xs font-medium flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                      : isToday
                        ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                        : hasConfirmed
                          ? 'bg-white dark:bg-[#1A1C20] border-[#146C53]/45 dark:border-[#2EB88B]/45 text-[#17191C] dark:text-[#F4F2EE]'
                          : hasPending
                            ? 'bg-white dark:bg-[#1A1C20] border-[#C4622D]/50 dark:border-[#E07B46]/50 text-[#17191C] dark:text-[#F4F2EE]'
                            : 'border-transparent text-[#575B62] dark:text-[#A3A7AE] hover:bg-white dark:hover:bg-[#1A1C20]'
                  }`}
                >
                  <span>{dayNum}</span>
                  {(hasConfirmed || hasPending) && (
                    <span
                      className="flex items-center gap-0.5 mt-0.5"
                      aria-hidden="true"
                    >
                      {hasConfirmed && (
                        <span
                          className={`w-1.5 h-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white dark:bg-[#121315]'
                              : 'bg-[#146C53] dark:bg-[#2EB88B]'
                          }`}
                        />
                      )}
                      {hasPending && (
                        <span
                          className={`w-1.5 h-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/80 dark:bg-[#121315]/80'
                              : 'bg-[#C4622D] dark:bg-[#E07B46]'
                          }`}
                        />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-1 rounded-full bg-[#146C53] dark:bg-[#2EB88B]"
                  aria-hidden="true"
                />
                <span>Confirmed ({confirmedCount})</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-1 rounded-full bg-[#C4622D] dark:bg-[#E07B46]"
                  aria-hidden="true"
                />
                <span>Scheduled ({pendingCount})</span>
              </span>
            </div>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
              >
                Show all dates
              </button>
            )}
          </div>
        </div>

        {/* Sessions & Pairing Queue */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              {selectedDate
                ? `Schedule for ${selectedDate} (${filteredItems.length})`
                : `Confirmed Sessions & Scheduled Pairings (${filteredItems.length})`}
            </h4>
            <span className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
              All times in UTC
            </span>
          </div>

          <div
            data-testid="mentor-calendar-session-list"
            className="space-y-2.5 max-h-[380px] overflow-y-auto pe-1"
          >
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3.5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`font-semibold ${
                        item.status === 'confirmed'
                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                          : 'text-[#C4622D] dark:text-[#E07B46]'
                      }`}
                    >
                      {item.status === 'confirmed'
                        ? 'Confirmed Session'
                        : 'Scheduled Slot'}
                    </span>
                    <span className="text-[#8A847A]" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                      {item.date} · {item.timeLabel}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                    {item.domain}
                  </span>
                </div>

                <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {item.title}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[#575B62] dark:text-[#A3A7AE]">
                    <User
                      className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]"
                      aria-hidden="true"
                    />
                    <span>
                      Mentor:{' '}
                      <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        {item.mentorName}
                      </strong>
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    {item.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmPending(item)}
                        className="min-h-[32px] px-3 py-1 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Confirm Attended</span>
                      </button>
                    )}

                    {onOpenMentorThread && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenMentorThread(
                            item.sprintId ?? 'sprint-general',
                            item.title,
                            item.domain,
                            {
                              initialPanel: 'session',
                              contextNote: `Calendar slot: ${item.date} at ${item.timeLabel} (${item.status})`,
                            }
                          )
                        }
                        className="min-h-[32px] px-3 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare
                          className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]"
                          aria-hidden="true"
                        />
                        <span>Open Thread</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] py-10 px-4 text-center space-y-2">
                <Clock3 className="w-6 h-6 mx-auto text-[#8A847A]" aria-hidden="true" />
                <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                  No mentorship sessions or pairing requests scheduled for this filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request New Pairing Session Modal */}
      {showNewSessionModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-calendar-session-title"
          data-testid="calendar-request-session-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewSessionModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4
                  id="new-calendar-session-title"
                  className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  Request Mentorship Session
                </h4>
                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                  Schedule a 30-minute review block with a Pod Track Mentor. Syncs across your workspace and cloud ledger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                aria-label="Close session request modal"
                className="p-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div className="space-y-1">
                <label
                  htmlFor="calendar-session-objective"
                  className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  Session Objective
                </label>
                <input
                  id="calendar-session-objective"
                  data-testid="calendar-session-objective-input"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sprint QA & Load Isolation Walkthrough"
                  className="w-full min-h-[40px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="calendar-session-date"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Date
                  </label>
                  <input
                    id="calendar-session-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="calendar-session-time"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Time (UTC)
                  </label>
                  <input
                    id="calendar-session-time"
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="calendar-session-mentor"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Pod Mentor
                  </label>
                  <select
                    id="calendar-session-mentor"
                    value={newMentorId}
                    onChange={(e) => setNewMentorId(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                  >
                    {POD_MENTORS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.domain})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="calendar-session-focus"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Focus Track
                  </label>
                  <select
                    id="calendar-session-focus"
                    value={newFocusTopic}
                    onChange={(e) =>
                      setNewFocusTopic(e.target.value as MentorshipSessionFocus)
                    }
                    className="w-full min-h-[40px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                  >
                    {(
                      Object.keys(
                        MENTORSHIP_FOCUS_LABELS
                      ) as MentorshipSessionFocus[]
                    ).map((key) => (
                      <option key={key} value={key}>
                        {MENTORSHIP_FOCUS_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037]">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="min-h-[38px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#FAF8F5] dark:hover:bg-[#22252A] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-calendar-session-btn"
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Schedule &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
