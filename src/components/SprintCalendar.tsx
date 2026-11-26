import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
} from 'lucide-react';
import type {
  BriefSubmission,
  ContractPayout,
  SolutionSprint,
  SprintFeedback,
} from '../types/kora';
import {
  SOLUTION_SPRINTS,
  getSprintDurationDays,
  resolveContributionOrganization,
} from '../utils/talentEngine';

export type SprintCalendarCategory = 'active' | 'upcoming' | 'past';
export type SprintCalendarFilter = 'all' | SprintCalendarCategory;

export interface SprintCalendarEvent {
  id: string;
  briefId: string;
  title: string;
  organization: string;
  domain: string;
  category: SprintCalendarCategory;
  startDateKey: string;
  endDateKey: string;
  durationDays: number;
  estimatedHours: number;
  payoutUsd: number;
  contribution?: BriefSubmission;
}

export interface SprintCalendarDayCell {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: SprintCalendarEvent[];
}

export interface BuildSprintCalendarEventsInput {
  contributions: BriefSubmission[];
  payouts?: ContractPayout[];
  sprintFeedback?: SprintFeedback[];
  availableSprints?: SolutionSprint[];
  nowMs?: number;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
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
] as const;

export function toUtcDateKey(ms: number): string {
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKeyToUtcMs(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return 0;
  return Date.UTC(y, m - 1, d);
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const baseMs = parseDateKeyToUtcMs(dateKey);
  return toUtcDateKey(baseMs + days * 86_400_000);
}

function formatDateKeyRange(startKey: string, endKey: string): string {
  const startMs = parseDateKeyToUtcMs(startKey);
  const endMs = parseDateKeyToUtcMs(endKey);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  };
  const startLabel = new Date(startMs).toLocaleDateString(undefined, opts);
  const endLabel = new Date(endMs).toLocaleDateString(undefined, opts);
  return startKey === endKey ? startLabel : `${startLabel} – ${endLabel}`;
}

function parseIsoToDateKey(iso: string | undefined, fallbackMs: number): string {
  if (iso && !Number.isNaN(Date.parse(iso))) {
    return toUtcDateKey(Date.parse(iso));
  }
  return toUtcDateKey(fallbackMs);
}

/**
 * Pure transformer converting active, completed (past), and open cohort (upcoming)
 * sprint durations into normalized calendar date-span events.
 */
export function buildSprintCalendarEvents(
  input: BuildSprintCalendarEventsInput
): SprintCalendarEvent[] {
  const {
    contributions = [],
    payouts = [],
    sprintFeedback = [],
    availableSprints = SOLUTION_SPRINTS,
    nowMs = Date.now(),
  } = input;

  const events: SprintCalendarEvent[] = [];
  const joinedBriefIds = new Set<string>();

  for (const contrib of contributions) {
    joinedBriefIds.add(contrib.briefId);
    const durationDays = Math.max(2, getSprintDurationDays(contrib.briefId));
    const startDateKey = parseIsoToDateKey(contrib.createdAtIso, nowMs);
    const isCompleted = contrib.status === 'completed';

    let endDateKey: string;
    if (isCompleted) {
      const updatedKey = parseIsoToDateKey(
        contrib.updatedAtIso || contrib.deadlineIso,
        parseDateKeyToUtcMs(startDateKey) + (durationDays - 1) * 86_400_000
      );
      endDateKey = updatedKey >= startDateKey ? updatedKey : startDateKey;
    } else if (
      contrib.deadlineIso &&
      !Number.isNaN(Date.parse(contrib.deadlineIso))
    ) {
      const deadlineKey = toUtcDateKey(Date.parse(contrib.deadlineIso));
      endDateKey = deadlineKey >= startDateKey ? deadlineKey : startDateKey;
    } else {
      endDateKey = addDaysToDateKey(startDateKey, durationDays - 1);
    }

    const spanDays =
      Math.max(
        1,
        Math.round(
          (parseDateKeyToUtcMs(endDateKey) - parseDateKeyToUtcMs(startDateKey)) /
            86_400_000
        ) + 1
      );

    events.push({
      id: `cal-contrib-${contrib.id}`,
      briefId: contrib.briefId,
      title: contrib.briefTitle || 'Pod Solution Sprint',
      organization: resolveContributionOrganization(
        contrib,
        payouts,
        sprintFeedback
      ),
      domain: contrib.domain || 'Field Ops',
      category: isCompleted ? 'past' : 'active',
      startDateKey,
      endDateKey,
      durationDays: spanDays,
      estimatedHours: Math.max(1, Number(contrib.hoursLogged || 6)),
      payoutUsd: Math.max(0, Number(contrib.payoutUsd || 0)),
      contribution: contrib,
    });
  }

  // Add upcoming cohort windows for unjoined curated Solution Sprints
  const unjoinedSprints = availableSprints.filter(
    (sprint) => !joinedBriefIds.has(sprint.id)
  );
  const todayKey = toUtcDateKey(nowMs);

  unjoinedSprints.forEach((sprint, idx) => {
    const startOffsetDays = 2 + idx * 4;
    const durationDays = Math.max(3, getSprintDurationDays(sprint.id));
    const startDateKey = addDaysToDateKey(todayKey, startOffsetDays);
    const endDateKey = addDaysToDateKey(startDateKey, durationDays - 1);

    events.push({
      id: `cal-upcoming-${sprint.id}`,
      briefId: sprint.id,
      title: sprint.title,
      organization: sprint.partnerOrg,
      domain: sprint.domain,
      category: 'upcoming',
      startDateKey,
      endDateKey,
      durationDays,
      estimatedHours: sprint.estimatedHours,
      payoutUsd: sprint.payoutUsd,
    });
  });

  return events.sort(
    (a, b) =>
      a.startDateKey.localeCompare(b.startDateKey) ||
      a.category.localeCompare(b.category) ||
      a.title.localeCompare(b.title)
  );
}

/**
 * Pure month-grid builder returning 35 or 42 Sunday-aligned cells for a given month.
 */
export function buildMonthCalendarGrid(
  year: number,
  monthIndex: number,
  events: SprintCalendarEvent[],
  todayKey: string
): SprintCalendarDayCell[] {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const totalCells = startWeekday + daysInMonth > 35 ? 42 : 35;

  const gridStartMs = Date.UTC(year, monthIndex, 1 - startWeekday);
  const cells: SprintCalendarDayCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    const cellMs = gridStartMs + i * 86_400_000;
    const cellDate = new Date(cellMs);
    const dateKey = toUtcDateKey(cellMs);
    const inCurrentMonth =
      cellDate.getUTCFullYear() === year && cellDate.getUTCMonth() === monthIndex;
    const overlappingEvents = events.filter(
      (evt) => evt.startDateKey <= dateKey && dateKey <= evt.endDateKey
    );

    cells.push({
      dateKey,
      dayNumber: cellDate.getUTCDate(),
      inCurrentMonth,
      isToday: dateKey === todayKey,
      events: overlappingEvents,
    });
  }

  return cells;
}

interface SprintCalendarProps {
  contributions: BriefSubmission[];
  payouts?: ContractPayout[];
  sprintFeedback?: SprintFeedback[];
  availableSprints?: SolutionSprint[];
  onSelectContribution?: (contribution: BriefSubmission) => void;
  onGoToSolve?: () => void;
  initialNowMs?: number;
}

const CATEGORY_STYLES: Record<
  SprintCalendarCategory,
  {
    label: string;
    barClass: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  active: {
    label: 'Active',
    barClass:
      'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/35 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]',
    badgeClass:
      'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]',
    dotClass: 'bg-[#146C53] dark:bg-[#2EB88B]',
  },
  upcoming: {
    label: 'Upcoming',
    barClass:
      'bg-[#F9ECE5] dark:bg-[#2D1E17] border-[#C4622D]/35 dark:border-[#E07B46]/40 text-[#C4622D] dark:text-[#E07B46]',
    badgeClass:
      'bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46]',
    dotClass: 'bg-[#C4622D] dark:bg-[#E07B46]',
  },
  past: {
    label: 'Past',
    barClass:
      'bg-[#F2EEE8] dark:bg-[#23272E] border-[#8A847A]/30 dark:border-[#3E434D] text-[#575B62] dark:text-[#C4C9D0]',
    badgeClass:
      'bg-[#F2EEE8] dark:bg-[#23272E] text-[#575B62] dark:text-[#C4C9D0]',
    dotClass: 'bg-[#8A847A] dark:bg-[#8E95A0]',
  },
};

export const SprintCalendar: React.FC<SprintCalendarProps> = ({
  contributions,
  payouts = [],
  sprintFeedback = [],
  availableSprints = SOLUTION_SPRINTS,
  onSelectContribution,
  onGoToSolve,
  initialNowMs,
}) => {
  const nowMs = initialNowMs ?? Date.now();
  const todayKey = useMemo(() => toUtcDateKey(nowMs), [nowMs]);
  const todayDate = useMemo(() => new Date(parseDateKeyToUtcMs(todayKey)), [todayKey]);

  const [viewYear, setViewYear] = useState<number>(() => todayDate.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => todayDate.getUTCMonth());
  const [categoryFilter, setCategoryFilter] = useState<SprintCalendarFilter>('all');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  const allEvents = useMemo(
    () =>
      buildSprintCalendarEvents({
        contributions,
        payouts,
        sprintFeedback,
        availableSprints,
        nowMs,
      }),
    [contributions, payouts, sprintFeedback, availableSprints, nowMs]
  );

  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'all') return allEvents;
    return allEvents.filter((evt) => evt.category === categoryFilter);
  }, [allEvents, categoryFilter]);

  const monthGrid = useMemo(
    () => buildMonthCalendarGrid(viewYear, viewMonth, filteredEvents, todayKey),
    [viewYear, viewMonth, filteredEvents, todayKey]
  );

  const monthRange = useMemo(() => {
    const startKey = toUtcDateKey(Date.UTC(viewYear, viewMonth, 1));
    const endKey = toUtcDateKey(Date.UTC(viewYear, viewMonth + 1, 0));
    return { startKey, endKey };
  }, [viewYear, viewMonth]);

  const monthEventsAll = useMemo(
    () =>
      allEvents.filter(
        (evt) =>
          evt.endDateKey >= monthRange.startKey &&
          evt.startDateKey <= monthRange.endKey
      ),
    [allEvents, monthRange]
  );

  const categoryCounts = useMemo(
    () => ({
      all: monthEventsAll.length,
      active: monthEventsAll.filter((e) => e.category === 'active').length,
      upcoming: monthEventsAll.filter((e) => e.category === 'upcoming').length,
      past: monthEventsAll.filter((e) => e.category === 'past').length,
    }),
    [monthEventsAll]
  );

  const selectedCell = useMemo(
    () => monthGrid.find((c) => c.dateKey === selectedDateKey) ?? null,
    [monthGrid, selectedDateKey]
  );

  const selectedDayEvents = useMemo(
    () =>
      selectedCell?.events ??
      filteredEvents.filter(
        (evt) =>
          evt.startDateKey <= selectedDateKey && selectedDateKey <= evt.endDateKey
      ),
    [selectedCell, filteredEvents, selectedDateKey]
  );

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
      setSelectedDateKey(toUtcDateKey(Date.UTC(viewYear - 1, 11, 1)));
    } else {
      setViewMonth((m) => m - 1);
      setSelectedDateKey(toUtcDateKey(Date.UTC(viewYear, viewMonth - 1, 1)));
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
      setSelectedDateKey(toUtcDateKey(Date.UTC(viewYear + 1, 0, 1)));
    } else {
      setViewMonth((m) => m + 1);
      setSelectedDateKey(toUtcDateKey(Date.UTC(viewYear, viewMonth + 1, 1)));
    }
  };

  const goToToday = () => {
    setViewYear(todayDate.getUTCFullYear());
    setViewMonth(todayDate.getUTCMonth());
    setSelectedDateKey(todayKey);
  };

  const selectedDateReadable = useMemo(() => {
    const ms = parseDateKeyToUtcMs(selectedDateKey);
    return new Date(ms).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }, [selectedDateKey]);

  const monthTitle = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  return (
    <section
      aria-labelledby="sprint-calendar-heading"
      data-testid="sprint-calendar"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 space-y-5"
    >
      {/* Header + Month Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div>
          <p className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Availability &amp; Pod Schedule</span>
          </p>
          <h2
            id="sprint-calendar-heading"
            className="mt-0.5 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Sprint Calendar
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
            Plan weekly availability across active pod commitments, upcoming cohorts, and completed sprint durations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-1 gap-1">
            <button
              type="button"
              data-testid="sprint-calendar-prev-month"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
              className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white dark:hover:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span
              data-testid="sprint-calendar-month-label"
              className="px-2.5 text-xs sm:text-sm font-semibold font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE] min-w-[132px] text-center whitespace-nowrap"
            >
              {monthTitle}
            </span>
            <button
              type="button"
              data-testid="sprint-calendar-next-month"
              onClick={goToNextMonth}
              aria-label="Next month"
              className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white dark:hover:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            data-testid="sprint-calendar-today-btn"
            onClick={goToToday}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] transition-colors whitespace-nowrap cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Category Filter Toolbar & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter sprint calendar by status"
          data-testid="sprint-calendar-filters"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
        >
          {(
            [
              { id: 'all', label: 'All', count: categoryCounts.all },
              { id: 'active', label: 'Active', count: categoryCounts.active },
              { id: 'upcoming', label: 'Upcoming', count: categoryCounts.upcoming },
              { id: 'past', label: 'Past', count: categoryCounts.past },
            ] as Array<{
              id: SprintCalendarFilter;
              label: string;
              count: number;
            }>
          ).map((tab) => {
            const selected = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={selected}
                data-testid={`sprint-calendar-filter-${tab.id}`}
                onClick={() => setCategoryFilter(tab.id)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  selected
                    ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs font-semibold border border-[#E8E3DB] dark:border-[#2C3037]'
                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono-tabular tabular-nums text-[11px] opacity-75">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          {(['active', 'upcoming', 'past'] as SprintCalendarCategory[]).map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-xs ${CATEGORY_STYLES[cat].dotClass}`}
                aria-hidden="true"
              />
              <span>{CATEGORY_STYLES[cat].label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Month Grid */}
      <div className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] overflow-hidden">
        <div
          role="row"
          className="grid grid-cols-7 bg-[#FAF8F5] dark:bg-[#121315] border-b border-[#E8E3DB] dark:border-[#2C3037]"
        >
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="py-2 px-2 text-center text-[11px] font-semibold text-[#575B62] dark:text-[#A3A7AE]"
            >
              {day}
            </div>
          ))}
        </div>

        <div
          role="grid"
          aria-label={`${monthTitle} sprint calendar`}
          data-testid="sprint-calendar-grid"
          className="grid grid-cols-7 divide-x divide-y divide-[#E8E3DB] dark:divide-[#2C3037] bg-[#FAF8F5]/40 dark:bg-[#121315]/40"
        >
          {monthGrid.map((cell) => {
            const isSelected = cell.dateKey === selectedDateKey;
            const visibleEvents = cell.events.slice(0, 2);
            const overflowCount = Math.max(0, cell.events.length - visibleEvents.length);

            return (
              <button
                key={cell.dateKey}
                type="button"
                data-testid={`sprint-calendar-day-${cell.dateKey}`}
                aria-label={`${cell.dateKey}, ${cell.events.length} sprint${
                  cell.events.length === 1 ? '' : 's'
                }`}
                aria-pressed={isSelected}
                onClick={() => setSelectedDateKey(cell.dateKey)}
                className={`min-h-[76px] sm:min-h-[94px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#146C53] ${
                  isSelected
                    ? 'bg-[#E7F3EE]/60 dark:bg-[#142B24]/60'
                    : cell.inCurrentMonth
                      ? 'bg-white dark:bg-[#1A1C20] hover:bg-[#FAF8F5] dark:hover:bg-[#20242A]'
                      : 'bg-[#FAF8F5]/75 dark:bg-[#121315]/75 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span
                    className={`font-mono-tabular tabular-nums text-[11px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                      cell.isToday
                        ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                        : isSelected
                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                          : 'text-[#17191C] dark:text-[#F4F2EE]'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.events.length > 0 && (
                    <span className="sm:hidden flex items-center gap-0.5">
                      {cell.events.slice(0, 3).map((evt) => (
                        <span
                          key={evt.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            CATEGORY_STYLES[evt.category].dotClass
                          }`}
                        />
                      ))}
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col gap-1 w-full mt-1.5">
                  {visibleEvents.map((evt) => {
                    const style = CATEGORY_STYLES[evt.category];
                    const isStart = evt.startDateKey === cell.dateKey;
                    const isEnd = evt.endDateKey === cell.dateKey;
                    return (
                      <div
                        key={evt.id}
                        title={`${evt.title} (${style.label} · ${formatDateKeyRange(
                          evt.startDateKey,
                          evt.endDateKey
                        )})`}
                        className={`px-1.5 py-0.5 text-[10px] font-medium border truncate ${
                          style.barClass
                        } ${isStart ? 'rounded-l-md' : 'rounded-l-none'} ${
                          isEnd ? 'rounded-r-md' : 'rounded-r-none'
                        }`}
                      >
                        {isStart ? evt.title : `${style.label} · ${evt.domain}`}
                      </div>
                    );
                  })}
                  {overflowCount > 0 && (
                    <span className="text-[10px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE] px-1">
                      +{overflowCount} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Availability & Sprint Duration Breakdown */}
      <div
        data-testid="sprint-calendar-day-panel"
        className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Schedule for {selectedDateReadable}
            </p>
            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums">
              {selectedDayEvents.length === 0
                ? 'Open availability — no overlapping sprint durations on this date'
                : `${selectedDayEvents.length} sprint window${
                    selectedDayEvents.length === 1 ? '' : 's'
                  } overlapping this day`}
            </p>
          </div>
          {onGoToSolve && selectedDayEvents.length === 0 && (
            <button
              type="button"
              onClick={onGoToSolve}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Browse Pod Sprints</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {selectedDayEvents.length > 0 && (
          <ul className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] border border-[#E8E3DB] dark:border-[#2C3037] rounded-xl bg-[#FAF8F5]/60 dark:bg-[#121315]/60">
            {selectedDayEvents.map((evt) => {
              const style = CATEGORY_STYLES[evt.category];
              return (
                <li
                  key={evt.id}
                  data-testid={`sprint-calendar-day-event-${evt.briefId}`}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${style.badgeClass}`}
                      >
                        {evt.category === 'past' ? (
                          <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                        ) : evt.category === 'upcoming' ? (
                          <Compass className="w-3 h-3 shrink-0" aria-hidden="true" />
                        ) : (
                          <Clock3 className="w-3 h-3 shrink-0" aria-hidden="true" />
                        )}
                        <span>{style.label}</span>
                      </span>
                      <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                        {formatDateKeyRange(evt.startDateKey, evt.endDateKey)} ({evt.durationDays}d)
                      </span>
                      <span aria-hidden="true" className="text-[#8A847A]">
                        ·
                      </span>
                      <span className="text-[#575B62] dark:text-[#A3A7AE]">
                        {evt.organization}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {evt.title}
                    </p>

                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums">
                      {evt.domain} · {evt.estimatedHours}h scoped · ${evt.payoutUsd} USD
                    </p>
                  </div>

                  <div className="shrink-0">
                    {evt.contribution && onSelectContribution ? (
                      <button
                        type="button"
                        onClick={() => onSelectContribution(evt.contribution!)}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>View Summary</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      onGoToSolve && (
                        <button
                          type="button"
                          onClick={onGoToSolve}
                          className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <span>Plan in Solve</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
