import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Globe2,
  X,
} from 'lucide-react';
import type {
  BriefSubmission,
  MentorshipSession,
  MentorshipSessionFocus,
  PodMentorProfile,
} from '../types/kora';
import {
  MENTORSHIP_FOCUS_LABELS,
  POD_MENTORS,
  getAssignedMentorForSprint,
} from '../utils/talentEngine';
import {
  MENTOR_HEATMAP_TIMEZONES,
  MENTOR_TIMEZONE_PROFILES,
  formatResponseMinutes,
  resolveDefaultHeatmapTimezoneId,
  type MentorHeatmapTimezoneId,
  type MentorTimezoneOption,
} from './MentorAvailabilityHeatmap';

export interface MentorBookableSlot {
  slotId: string;
  mentorId: string;
  mentorName: string;
  domain: string;
  dateKey: string;
  dayLabel: string;
  slotIso: string;
  viewerStartLabel: string;
  viewerRangeLabel: string;
  mentorLocalRangeLabel: string;
  mentorLocalTzLabel: string;
  tier: 'peak' | 'fast';
  tierLabel: 'Peak Live' | 'Responsive';
  estimatedResponseMinutes: number;
  responseTimeLabel: string;
  isBooked: boolean;
  bookedSessionId?: string;
}

export interface MentorSlotDayGroup {
  dateKey: string;
  dayLabel: string;
  slots: MentorBookableSlot[];
  openCount: number;
}

export interface MentorAvailabilitySlotsResult {
  mentor: PodMentorProfile;
  timezone: MentorTimezoneOption;
  days: MentorSlotDayGroup[];
  allSlots: MentorBookableSlot[];
  openSlotsCount: number;
  bookedSlotsCount: number;
  peakSlotsCount: number;
}

const UTC_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const UTC_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function wrapHour24(hour: number): number {
  return ((hour % 24) + 24) % 24;
}

function isHourInSpan(hour: number, [start, end]: [number, number]): boolean {
  const h = wrapHour24(hour);
  if (start <= end) {
    return h >= start && h < end;
  }
  return h >= start || h < end;
}

function formatMinuteRange(startHour: number, startMinute = 0, durationMin = 30): string {
  const totalStart = wrapHour24(startHour) * 60 + startMinute;
  const totalEnd = (totalStart + durationMin) % (24 * 60);
  const sh = String(Math.floor(totalStart / 60)).padStart(2, '0');
  const sm = String(totalStart % 60).padStart(2, '0');
  const eh = String(Math.floor(totalEnd / 60)).padStart(2, '0');
  const em = String(totalEnd % 60).padStart(2, '0');
  return `${sh}:${sm}–${eh}:${em}`;
}

function formatUtcDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatUtcDayLabel(ms: number, dayOffset: number): string {
  const d = new Date(ms);
  const wd = UTC_WEEKDAYS[d.getUTCDay()];
  const mo = UTC_MONTHS[d.getUTCMonth()];
  const dayNum = d.getUTCDate();
  if (dayOffset === 0) return `Today · ${mo} ${dayNum}`;
  if (dayOffset === 1) return `Tomorrow · ${mo} ${dayNum}`;
  return `${wd}, ${mo} ${dayNum}`;
}

/**
 * Generates open 30-minute bookable mentorship session slots over upcoming days
 * based on a mentor's peak/responsive availability schedule and existing booked sessions.
 */
export function buildMentorOpenSlots(input: {
  mentor: PodMentorProfile;
  timezoneId?: MentorHeatmapTimezoneId;
  mentorshipSessions?: MentorshipSession[];
  referenceNowMs?: number;
  daysAhead?: number;
}): MentorAvailabilitySlotsResult {
  const {
    mentor,
    timezoneId = 'utc',
    mentorshipSessions = [],
    referenceNowMs = Date.now(),
    daysAhead = 3,
  } = input;

  const timezone =
    MENTOR_HEATMAP_TIMEZONES.find((tz) => tz.id === timezoneId) ??
    MENTOR_HEATMAP_TIMEZONES[0];

  const schedule = MENTOR_TIMEZONE_PROFILES[mentor.id] ?? {
    mentorId: mentor.id,
    nativeTimezoneLabel: 'UTC+0',
    nativeOffsetHours: 0,
    peakLocalHours: [9, 17] as [number, number],
    activeLocalHours: [7, 21] as [number, number],
    basePeakMinutes: 12,
  };

  const mentorSessions = mentorshipSessions.filter((s) => s.mentorId === mentor.id);
  const offsetMs = timezone.offsetHours * 3_600_000;

  // Determine midnight of Day 0 in the viewer's selected timezone
  const viewerNow = new Date(referenceNowMs + offsetMs);
  const viewerDayMidnightMs =
    Date.UTC(
      viewerNow.getUTCFullYear(),
      viewerNow.getUTCMonth(),
      viewerNow.getUTCDate(),
      0,
      0,
      0,
      0
    ) - offsetMs;

  // Candidate 2-hour grid hours across the viewer's day (ensures clean, scannable open slots)
  const candidateViewerHours = [7, 9, 11, 13, 15, 17, 19];

  const days: MentorSlotDayGroup[] = [];
  const allSlots: MentorBookableSlot[] = [];

  for (let dayIdx = 0; dayIdx < daysAhead; dayIdx++) {
    const dayStartUtcMs = viewerDayMidnightMs + dayIdx * 86_400_000;
    const viewerDateMs = dayStartUtcMs + offsetMs;
    const dateKey = formatUtcDateKey(viewerDateMs);
    const dayLabel = formatUtcDayLabel(viewerDateMs, dayIdx);

    const daySlots: MentorBookableSlot[] = [];

    for (const viewerHour of candidateViewerHours) {
      const slotUtcMs = dayStartUtcMs + viewerHour * 3_600_000;
      // Skip slots that have already passed (allow 15m buffer)
      if (slotUtcMs <= referenceNowMs + 15 * 60_000) {
        continue;
      }

      const utcHour = new Date(slotUtcMs).getUTCHours();
      const mentorLocalHour = wrapHour24(utcHour + schedule.nativeOffsetHours);

      const inPeak = isHourInSpan(mentorLocalHour, schedule.peakLocalHours);
      const inActive = isHourInSpan(mentorLocalHour, schedule.activeLocalHours);

      if (!inPeak && !inActive) {
        continue;
      }

      const peakMid = (schedule.peakLocalHours[0] + schedule.peakLocalHours[1]) / 2;
      const estimatedResponseMinutes = inPeak
        ? Math.max(5, Math.round(schedule.basePeakMinutes + Math.abs(mentorLocalHour - peakMid) * 1.1))
        : Math.max(16, schedule.basePeakMinutes + 14);

      const tier: 'peak' | 'fast' =
        inPeak && estimatedResponseMinutes <= 14 ? 'peak' : 'fast';

      // Only expose peak or responsive windows as live bookable slots
      if (!inPeak && estimatedResponseMinutes > 26) {
        continue;
      }

      const slotIso = new Date(slotUtcMs).toISOString();
      const matchedSession = mentorSessions.find((sess) => {
        const sessMs = Date.parse(sess.attendedAtIso);
        if (!Number.isFinite(sessMs)) return false;
        return Math.abs(sessMs - slotUtcMs) < 30 * 60_000;
      });

      const slot: MentorBookableSlot = {
        slotId: `${mentor.id}::${slotIso}`,
        mentorId: mentor.id,
        mentorName: mentor.name,
        domain: mentor.domain,
        dateKey,
        dayLabel,
        slotIso,
        viewerStartLabel: `${String(viewerHour).padStart(2, '0')}:00`,
        viewerRangeLabel: `${formatMinuteRange(viewerHour, 0, 30)} ${timezone.shortLabel}`,
        mentorLocalRangeLabel: `${formatMinuteRange(mentorLocalHour, 0, 30)} ${schedule.nativeTimezoneLabel}`,
        mentorLocalTzLabel: schedule.nativeTimezoneLabel,
        tier,
        tierLabel: tier === 'peak' ? 'Peak Live' : 'Responsive',
        estimatedResponseMinutes,
        responseTimeLabel: formatResponseMinutes(estimatedResponseMinutes),
        isBooked: Boolean(matchedSession),
        bookedSessionId: matchedSession?.id,
      };

      daySlots.push(slot);
      allSlots.push(slot);
    }

    if (daySlots.length > 0) {
      days.push({
        dateKey,
        dayLabel,
        slots: daySlots,
        openCount: daySlots.filter((s) => !s.isBooked).length,
      });
    }
  }

  return {
    mentor,
    timezone,
    days,
    allSlots,
    openSlotsCount: allSlots.filter((s) => !s.isBooked).length,
    bookedSlotsCount: allSlots.filter((s) => s.isBooked).length,
    peakSlotsCount: allSlots.filter((s) => !s.isBooked && s.tier === 'peak').length,
  };
}

export interface BookMentorSlotPayload {
  sprintId: string;
  sprintTitle: string;
  mentor: PodMentorProfile;
  focusTopic: MentorshipSessionFocus;
  durationMinutes: 15 | 30 | 45 | 60;
  scheduledAtIso: string;
  takeawayNote: string;
}

interface MentorshipAvailabilitySchedulerProps {
  variant?: 'sidebar' | 'popover';
  activeSubmission: BriefSubmission | null;
  contributions: BriefSubmission[];
  mentorshipSessions: MentorshipSession[];
  onBookSlot: (payload: BookMentorSlotPayload) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const FOCUS_TOPICS: MentorshipSessionFocus[] = [
  'qa-architecture',
  'technical-unblocker',
  'handover-rubric',
  'career-rpl',
];

const DURATIONS: Array<15 | 30 | 45 | 60> = [15, 30, 45, 60];

export const MentorshipAvailabilityScheduler: React.FC<
  MentorshipAvailabilitySchedulerProps
> = ({
  variant = 'sidebar',
  activeSubmission,
  contributions,
  mentorshipSessions,
  onBookSlot,
  onClose,
  isOpen = true,
}) => {
  const defaultMentor = useMemo(
    () =>
      activeSubmission
        ? getAssignedMentorForSprint(activeSubmission.briefId, activeSubmission.domain)
        : POD_MENTORS[0],
    [activeSubmission]
  );

  const [selectedMentorId, setSelectedMentorId] = useState<string>(defaultMentor.id);
  const [timezoneId, setTimezoneId] = useState<MentorHeatmapTimezoneId>(() =>
    resolveDefaultHeatmapTimezoneId()
  );
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [focusTopic, setFocusTopic] = useState<MentorshipSessionFocus>('qa-architecture');
  const [durationMinutes, setDurationMinutes] = useState<15 | 30 | 45 | 60>(30);
  const [agendaNote, setAgendaNote] = useState('');
  const [lastBookedSummary, setLastBookedSummary] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedMentorId(defaultMentor.id);
    setSelectedSlotId(null);
  }, [defaultMentor.id]);

  useEffect(() => {
    if (variant !== 'popover' || !isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [variant, isOpen, onClose]);

  const activeMentor = useMemo(
    () => POD_MENTORS.find((m) => m.id === selectedMentorId) ?? defaultMentor,
    [selectedMentorId, defaultMentor]
  );

  const slotsData = useMemo(
    () =>
      buildMentorOpenSlots({
        mentor: activeMentor,
        timezoneId,
        mentorshipSessions,
      }),
    [activeMentor, timezoneId, mentorshipSessions]
  );

  const currentDay = slotsData.days[selectedDayIdx] ?? slotsData.days[0] ?? null;

  const selectedSlot = useMemo(() => {
    if (selectedSlotId) {
      const found = slotsData.allSlots.find((s) => s.slotId === selectedSlotId && !s.isBooked);
      if (found) return found;
    }
    return currentDay?.slots.find((s) => !s.isBooked) ?? slotsData.allSlots.find((s) => !s.isBooked) ?? null;
  }, [selectedSlotId, slotsData, currentDay]);

  if (variant === 'popover' && !isOpen) {
    return null;
  }

  const targetSprint =
    activeSubmission ??
    contributions.find(
      (c) =>
        c.status === 'in-progress' &&
        c.domain.toLowerCase() === activeMentor.domain.toLowerCase()
    ) ??
    contributions.find((c) => c.status === 'in-progress') ??
    contributions[0] ??
    null;

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const sprintId = targetSprint?.briefId ?? `track-${activeMentor.domain.toLowerCase().replace(/\s+/g, '-')}`;
    const sprintTitle = targetSprint?.briefTitle ?? `${activeMentor.domain} Mentorship Check-In`;

    const notePrefix = `Booked ${selectedSlot.viewerRangeLabel} (${selectedSlot.mentorLocalRangeLabel})`;
    const combinedNote = agendaNote.trim()
      ? `${notePrefix} — ${agendaNote.trim()}`
      : `${notePrefix} · ${MENTORSHIP_FOCUS_LABELS[focusTopic]}`;

    onBookSlot({
      sprintId,
      sprintTitle,
      mentor: activeMentor,
      focusTopic,
      durationMinutes,
      scheduledAtIso: selectedSlot.slotIso,
      takeawayNote: combinedNote.slice(0, 320),
    });

    setLastBookedSummary(
      `Booked ${durationMinutes}m with ${activeMentor.name} for ${selectedSlot.dayLabel} at ${selectedSlot.viewerStartLabel} ${slotsData.timezone.shortLabel}.`
    );
    setAgendaNote('');
    setSelectedSlotId(null);
  };

  const content = (
    <div
      data-testid={`mentorship-availability-scheduler-${variant}`}
      className={
        variant === 'popover'
          ? 'rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl p-4 sm:p-5 space-y-4 w-[350px] sm:w-[430px] max-w-[calc(100vw-2rem)]'
          : 'rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-4'
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
            Mentor Slot Booking
          </p>
          <h3 className="font-display text-base font-medium text-[#17191C] dark:text-[#F4F2EE]">
            Schedule Open Session
          </h3>
          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              {slotsData.openSlotsCount}
            </span>{' '}
            open slots ·{' '}
            <span className="font-mono-tabular tabular-nums">
              {slotsData.peakSlotsCount} Peak Live
            </span>
          </p>
        </div>

        {variant === 'popover' && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Mentor Slot Scheduler"
            data-testid="close-availability-scheduler-popover"
            className="w-8 h-8 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Mentor & Time Zone Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label
            htmlFor={`scheduler-mentor-${variant}`}
            className="block text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]"
          >
            Mentor
          </label>
          <select
            id={`scheduler-mentor-${variant}`}
            data-testid="scheduler-mentor-select"
            value={activeMentor.id}
            onChange={(e) => {
              setSelectedMentorId(e.target.value);
              setSelectedSlotId(null);
              setLastBookedSummary(null);
            }}
            className="w-full min-h-[36px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-2.5 py-1.5 text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] cursor-pointer"
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
            htmlFor={`scheduler-tz-${variant}`}
            className="flex items-center gap-1 text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]"
          >
            <Globe2 className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
            <span>Time Zone</span>
          </label>
          <select
            id={`scheduler-tz-${variant}`}
            data-testid="scheduler-timezone-select"
            value={timezoneId}
            onChange={(e) => {
              setTimezoneId(e.target.value as MentorHeatmapTimezoneId);
              setSelectedSlotId(null);
            }}
            className="w-full min-h-[36px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-2.5 py-1.5 text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] cursor-pointer"
          >
            {MENTOR_HEATMAP_TIMEZONES.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Day Tabs */}
      {slotsData.days.length > 0 && (
        <div
          role="tablist"
          aria-label="Available days"
          className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
        >
          {slotsData.days.map((day, idx) => {
            const isSelected = idx === selectedDayIdx;
            return (
              <button
                key={day.dateKey}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`scheduler-day-tab-${idx}`}
                onClick={() => {
                  setSelectedDayIdx(idx);
                  setSelectedSlotId(null);
                }}
                className={`flex-1 min-h-[32px] px-2 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap truncate cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs font-semibold'
                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                {day.dayLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Open Slots Grid */}
      {currentDay ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
            <span>{currentDay.openCount} open 30m windows</span>
            <span className="font-mono-tabular tabular-nums">
              Mentor desk: {currentDay.slots[0]?.mentorLocalTzLabel}
            </span>
          </div>

          <div
            data-testid="scheduler-slot-grid"
            className="grid grid-cols-2 gap-2"
          >
            {currentDay.slots.map((slot) => {
              const isSelected = selectedSlot?.slotId === slot.slotId && !slot.isBooked;
              return (
                <button
                  key={slot.slotId}
                  type="button"
                  disabled={slot.isBooked}
                  data-testid={`scheduler-slot-${slot.viewerStartLabel}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedSlotId(slot.slotId);
                    setLastBookedSummary(null);
                  }}
                  className={`rounded-xl border px-2.5 py-2 text-left transition-colors ${
                    slot.isBooked
                      ? 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315] cursor-pointer'
                        : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53] dark:hover:border-[#2EB88B] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-xs font-mono-tabular tabular-nums font-semibold">
                    <span>{slot.viewerStartLabel}</span>
                    <span
                      className={`text-[10px] font-sans font-medium ${
                        slot.isBooked
                          ? 'text-[#575B62] dark:text-[#A3A7AE]'
                          : isSelected
                            ? 'text-white/90 dark:text-[#121315]/85'
                            : slot.tier === 'peak'
                              ? 'text-[#146C53] dark:text-[#2EB88B]'
                              : 'text-[#575B62] dark:text-[#A3A7AE]'
                      }`}
                    >
                      {slot.isBooked ? 'Booked' : slot.tierLabel}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 text-[10px] font-mono-tabular tabular-nums truncate ${
                      isSelected
                        ? 'text-white/85 dark:text-[#121315]/80'
                        : 'text-[#575B62] dark:text-[#A3A7AE]'
                    }`}
                  >
                    {slot.mentorLocalRangeLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] py-2">
          No upcoming open slots found for this window. Try switching days or time zones.
        </p>
      )}

      {/* Booking Form */}
      <form onSubmit={handleConfirmBooking} className="space-y-3 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <label
              htmlFor={`scheduler-focus-${variant}`}
              className="block text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]"
            >
              Session Focus
            </label>
            <select
              id={`scheduler-focus-${variant}`}
              data-testid="scheduler-focus-select"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value as MentorshipSessionFocus)}
              className="w-full min-h-[34px] rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-2 py-1 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            >
              {FOCUS_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {MENTORSHIP_FOCUS_LABELS[topic]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="block text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
              Duration
            </span>
            <div className="flex items-center gap-1">
              {DURATIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  data-testid={`scheduler-duration-${mins}`}
                  aria-pressed={durationMinutes === mins}
                  onClick={() => setDurationMinutes(mins)}
                  className={`flex-1 min-h-[34px] rounded-lg border text-[11px] font-mono-tabular tabular-nums font-medium transition-colors cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                      : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <input
          type="text"
          value={agendaNote}
          maxLength={200}
          onChange={(e) => setAgendaNote(e.target.value)}
          aria-label="Session agenda note (optional)"
          data-testid="scheduler-agenda-input"
          placeholder={
            targetSprint
              ? `Goal for ${targetSprint.briefTitle} (optional)...`
              : 'Optional question or deliverable to review...'
          }
          className="w-full min-h-[36px] rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-2.5 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
        />

        {lastBookedSummary && (
          <p
            role="status"
            data-testid="scheduler-booking-confirmation"
            className="flex items-start gap-1.5 text-xs font-medium text-[#146C53] dark:text-[#2EB88B]"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{lastBookedSummary}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={!selectedSlot}
          data-testid="confirm-book-mentor-slot-btn"
          className="w-full min-h-[38px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <CalendarClock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {selectedSlot
              ? `Book ${selectedSlot.viewerStartLabel} (${durationMinutes}m)`
              : 'Select an Open Slot'}
          </span>
        </button>

        {selectedSlot && (
          <p className="flex items-center justify-center gap-1 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
            <Clock3 className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>
              Typical reply ~{selectedSlot.responseTimeLabel} ·{' '}
              {targetSprint ? targetSprint.briefTitle : `${activeMentor.domain} Track`}
            </span>
          </p>
        )}
      </form>
    </div>
  );

  if (variant === 'popover') {
    return (
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="false"
        aria-label="Schedule Mentorship Session"
        className="absolute right-0 top-full mt-2 z-50"
      >
        {content}
      </div>
    );
  }

  return content;
};
