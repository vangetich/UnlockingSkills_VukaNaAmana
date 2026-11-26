import React, { useMemo, useState } from 'react';
import { CalendarClock, Clock3, Globe2, MessageSquare } from 'lucide-react';
import type {
  BriefSubmission,
  MentorshipSession,
  PodMentorProfile,
  StudioDomain,
} from '../types/kora';
import { POD_MENTORS } from '../utils/talentEngine';

export type MentorHeatmapTimezoneId = 'utc' | 'eat' | 'cet' | 'cot' | 'pst';

export interface MentorTimezoneOption {
  id: MentorHeatmapTimezoneId;
  shortLabel: string;
  label: string;
  offsetHours: number;
}

export const MENTOR_HEATMAP_TIMEZONES: MentorTimezoneOption[] = [
  {
    id: 'utc',
    shortLabel: 'UTC+0',
    label: 'UTC · Coordinated Universal (UTC+0)',
    offsetHours: 0,
  },
  {
    id: 'eat',
    shortLabel: 'EAT (UTC+3)',
    label: 'EAT · Nairobi / Kampala / Amman (UTC+3)',
    offsetHours: 3,
  },
  {
    id: 'cet',
    shortLabel: 'CET (UTC+1)',
    label: 'CET · Kraków / Berlin (UTC+1)',
    offsetHours: 1,
  },
  {
    id: 'cot',
    shortLabel: 'COT (UTC-5)',
    label: 'COT · Bogotá / Lima (UTC-5)',
    offsetHours: -5,
  },
  {
    id: 'pst',
    shortLabel: 'PST (UTC-8)',
    label: 'PST · US Pacific (UTC-8)',
    offsetHours: -8,
  },
];

export type ResponseSpeedTier = 'peak' | 'fast' | 'async' | 'off-hours';

export interface MentorTimezoneScheduleProfile {
  mentorId: string;
  nativeTimezoneLabel: string;
  nativeOffsetHours: number;
  /** Peak local hours (0-23) for fastest live response */
  peakLocalHours: [number, number];
  /** Extended local hours (0-23) for responsive async check-ins */
  activeLocalHours: [number, number];
  basePeakMinutes: number;
}

export const MENTOR_TIMEZONE_PROFILES: Record<string, MentorTimezoneScheduleProfile> = {
  'mentor-green-01': {
    mentorId: 'mentor-green-01',
    nativeTimezoneLabel: 'EAT (UTC+3)',
    nativeOffsetHours: 3,
    peakLocalHours: [9, 17],
    activeLocalHours: [7, 21],
    basePeakMinutes: 8,
  },
  'mentor-health-02': {
    mentorId: 'mentor-health-02',
    nativeTimezoneLabel: 'EEST/AST (UTC+3)',
    nativeOffsetHours: 3,
    peakLocalHours: [8, 16],
    activeLocalHours: [7, 20],
    basePeakMinutes: 12,
  },
  'mentor-tech-03': {
    mentorId: 'mentor-tech-03',
    nativeTimezoneLabel: 'CET (UTC+1)',
    nativeOffsetHours: 1,
    peakLocalHours: [10, 18],
    activeLocalHours: [8, 22],
    basePeakMinutes: 14,
  },
  'mentor-finance-04': {
    mentorId: 'mentor-finance-04',
    nativeTimezoneLabel: 'EAT (UTC+3)',
    nativeOffsetHours: 3,
    peakLocalHours: [9, 17],
    activeLocalHours: [8, 20],
    basePeakMinutes: 10,
  },
};

export interface HeatmapTimeSlot {
  slotIndex: number;
  startHour: number;
  endHour: number;
  slotLabel: string;
  rangeLabel: string;
}

export interface MentorHeatmapCell {
  mentorId: string;
  mentorName: string;
  domain: StudioDomain;
  slotIndex: number;
  viewerStartHour: number;
  viewerRangeLabel: string;
  mentorLocalRangeLabel: string;
  mentorLocalTimezoneLabel: string;
  estimatedResponseMinutes: number;
  responseTimeLabel: string;
  tier: ResponseSpeedTier;
  tierLabel: string;
  schedulingAdvice: string;
  isOptimalSessionWindow: boolean;
}

export interface MentorHeatmapRow {
  mentor: PodMentorProfile;
  nativeTimezoneLabel: string;
  nativeOffsetHours: number;
  bestWindowViewerLabel: string;
  bestWindowLocalLabel: string;
  bestResponseMinutes: number;
  cells: MentorHeatmapCell[];
}

export interface MentorAvailabilityHeatmapData {
  timezone: MentorTimezoneOption;
  slots: HeatmapTimeSlot[];
  rows: MentorHeatmapRow[];
  bestOverlapSlotLabel: string;
  bestOverlapMentorsCount: number;
  fastestOverallResponseMinutes: number;
}

function wrapHour24(hour: number): number {
  return ((hour % 24) + 24) % 24;
}

function formatHourRange(startHour: number, spanHours = 3): string {
  const s = wrapHour24(startHour);
  const e = wrapHour24(startHour + spanHours);
  return `${String(s).padStart(2, '0')}:00–${String(e).padStart(2, '0')}:00`;
}

function isHourInSpan(hour: number, [start, end]: [number, number]): boolean {
  const h = wrapHour24(hour);
  if (start <= end) {
    return h >= start && h < end;
  }
  return h >= start || h < end;
}

export function formatResponseMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hrs = Math.round((minutes / 60) * 10) / 10;
  return `${hrs}h`;
}

/**
 * Computes typical mentor response latencies across 3-hour blocks in the chosen viewer time zone
 * by mapping each mentor's native working schedule and regional desk offset.
 */
export function buildMentorAvailabilityHeatmap(input: {
  timezoneId?: MentorHeatmapTimezoneId;
  mentors?: PodMentorProfile[];
  mentorshipSessions?: MentorshipSession[];
}): MentorAvailabilityHeatmapData {
  const {
    timezoneId = 'utc',
    mentors = POD_MENTORS,
    mentorshipSessions = [],
  } = input;

  const timezone =
    MENTOR_HEATMAP_TIMEZONES.find((tz) => tz.id === timezoneId) ??
    MENTOR_HEATMAP_TIMEZONES[0];

  const slots: HeatmapTimeSlot[] = Array.from({ length: 8 }, (_, idx) => {
    const startHour = idx * 3;
    const endHour = (startHour + 3) % 24;
    return {
      slotIndex: idx,
      startHour,
      endHour,
      slotLabel: `${String(startHour).padStart(2, '0')}:00`,
      rangeLabel: formatHourRange(startHour, 3),
    };
  });

  // Track attended QA sessions per mentor to reflect warmer responsiveness on active threads
  const attendedCountByMentor = new Map<string, number>();
  for (const sess of mentorshipSessions) {
    if (sess.status === 'attended') {
      attendedCountByMentor.set(
        sess.mentorId,
        (attendedCountByMentor.get(sess.mentorId) ?? 0) + 1
      );
    }
  }

  let fastestOverallResponseMinutes = Infinity;

  const rows: MentorHeatmapRow[] = mentors.map((mentor) => {
    const schedule = MENTOR_TIMEZONE_PROFILES[mentor.id] ?? {
      mentorId: mentor.id,
      nativeTimezoneLabel: 'UTC+0',
      nativeOffsetHours: 0,
      peakLocalHours: [9, 17] as [number, number],
      activeLocalHours: [7, 21] as [number, number],
      basePeakMinutes: 14,
    };

    const attendedBonus = Math.min(2, attendedCountByMentor.get(mentor.id) ?? 0);

    const cells: MentorHeatmapCell[] = slots.map((slot) => {
      // Midpoint of the 3h viewer window mapped to the mentor's native local hour
      const viewerMidHour = slot.startHour + 1;
      const utcMidHour = viewerMidHour - timezone.offsetHours;
      const mentorLocalMidHour = wrapHour24(utcMidHour + schedule.nativeOffsetHours);
      const mentorLocalStartHour = wrapHour24(
        slot.startHour - timezone.offsetHours + schedule.nativeOffsetHours
      );

      const inPeak = isHourInSpan(mentorLocalMidHour, schedule.peakLocalHours);
      const inActive = isHourInSpan(mentorLocalMidHour, schedule.activeLocalHours);

      let estimatedResponseMinutes: number;
      let tier: ResponseSpeedTier;
      let tierLabel: string;
      let schedulingAdvice: string;

      if (inPeak) {
        // Slightly faster near middle of peak window
        const peakMid =
          (schedule.peakLocalHours[0] + schedule.peakLocalHours[1]) / 2;
        const distFromMid = Math.abs(mentorLocalMidHour - peakMid);
        estimatedResponseMinutes = Math.max(
          5,
          Math.round(schedule.basePeakMinutes + distFromMid * 1.2 - attendedBonus)
        );
        tier = estimatedResponseMinutes <= 12 ? 'peak' : 'fast';
        tierLabel = tier === 'peak' ? 'Peak Live' : 'Responsive';
        schedulingAdvice =
          'Ideal for live 15m–30m QA sessions and rapid blocker check-ins.';
      } else if (inActive) {
        estimatedResponseMinutes = Math.max(
          18,
          schedule.basePeakMinutes + 18 - attendedBonus
        );
        tier = estimatedResponseMinutes <= 25 ? 'fast' : 'async';
        tierLabel = tier === 'fast' ? 'Responsive' : 'Async Window';
        schedulingAdvice =
          'Good window for async deliverable reviews and collaboration notes.';
      } else {
        // Off-hours: compute distance until mentor's active window opens
        const startActive = schedule.activeLocalHours[0];
        const hoursUntilOpen = wrapHour24(startActive - mentorLocalMidHour);
        const boundedWaitHours = Math.max(2, Math.min(9, hoursUntilOpen));
        estimatedResponseMinutes = boundedWaitHours * 30;
        tier = 'off-hours';
        tierLabel = 'Off-Hours';
        schedulingAdvice =
          'Post a collaboration note now; mentor will review at next desk opening.';
      }

      if (estimatedResponseMinutes < fastestOverallResponseMinutes) {
        fastestOverallResponseMinutes = estimatedResponseMinutes;
      }

      const viewerRangeLabel = slot.rangeLabel;
      const mentorLocalRangeLabel = formatHourRange(mentorLocalStartHour, 3);

      return {
        mentorId: mentor.id,
        mentorName: mentor.name,
        domain: mentor.domain,
        slotIndex: slot.slotIndex,
        viewerStartHour: slot.startHour,
        viewerRangeLabel,
        mentorLocalRangeLabel,
        mentorLocalTimezoneLabel: schedule.nativeTimezoneLabel,
        estimatedResponseMinutes,
        responseTimeLabel: formatResponseMinutes(estimatedResponseMinutes),
        tier,
        tierLabel,
        schedulingAdvice,
        isOptimalSessionWindow: tier === 'peak' || tier === 'fast',
      };
    });

    const bestCell = [...cells].sort(
      (a, b) => a.estimatedResponseMinutes - b.estimatedResponseMinutes
    )[0];

    return {
      mentor,
      nativeTimezoneLabel: schedule.nativeTimezoneLabel,
      nativeOffsetHours: schedule.nativeOffsetHours,
      bestWindowViewerLabel: bestCell.viewerRangeLabel,
      bestWindowLocalLabel: bestCell.mentorLocalRangeLabel,
      bestResponseMinutes: bestCell.estimatedResponseMinutes,
      cells,
    };
  });

  // Find the viewer slot with highest overlap of optimal (peak/fast) mentors
  let bestSlotIdx = 0;
  let bestOverlapCount = -1;
  let bestAvgMinutes = Infinity;

  for (let s = 0; s < slots.length; s++) {
    const slotCells = rows.map((r) => r.cells[s]);
    const optimalCount = slotCells.filter((c) => c.isOptimalSessionWindow).length;
    const avgMin =
      slotCells.reduce((sum, c) => sum + c.estimatedResponseMinutes, 0) /
      Math.max(1, slotCells.length);

    if (
      optimalCount > bestOverlapCount ||
      (optimalCount === bestOverlapCount && avgMin < bestAvgMinutes)
    ) {
      bestOverlapCount = optimalCount;
      bestAvgMinutes = avgMin;
      bestSlotIdx = s;
    }
  }

  return {
    timezone,
    slots,
    rows,
    bestOverlapSlotLabel: `${slots[bestSlotIdx].rangeLabel} ${timezone.shortLabel}`,
    bestOverlapMentorsCount: Math.max(0, bestOverlapCount),
    fastestOverallResponseMinutes: Number.isFinite(fastestOverallResponseMinutes)
      ? fastestOverallResponseMinutes
      : 8,
  };
}

export function resolveDefaultHeatmapTimezoneId(): MentorHeatmapTimezoneId {
  try {
    const offsetHours = -new Date().getTimezoneOffset() / 60;
    let closest = MENTOR_HEATMAP_TIMEZONES[0];
    let minDiff = Infinity;
    for (const tz of MENTOR_HEATMAP_TIMEZONES) {
      const diff = Math.abs(tz.offsetHours - offsetHours);
      if (diff < minDiff) {
        minDiff = diff;
        closest = tz;
      }
    }
    return closest.id;
  } catch {
    return 'utc';
  }
}

interface MentorAvailabilityHeatmapProps {
  contributions: BriefSubmission[];
  mentorshipSessions: MentorshipSession[];
  onOpenMentorThread: (
    sprintId: string,
    sprintTitle: string,
    domain: string,
    options?: { contextNote?: string; initialPanel?: 'chat' | 'session' }
  ) => void;
}

const CELL_STYLES: Record<ResponseSpeedTier, string> = {
  peak: 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] border-[#146C53] dark:border-[#2EB88B]',
  fast: 'bg-[#D6ECE3] dark:bg-[#16382E] text-[#0E523F] dark:text-[#8BE0C3] border-[#9AD2BC] dark:border-[#235949]',
  async:
    'bg-[#FEF3C7] dark:bg-[#2F2410] text-[#8F5304] dark:text-[#F5C451] border-[#F3D17A] dark:border-[#5C4417]',
  'off-hours':
    'bg-[#F4F1EC] dark:bg-[#17191D] text-[#575B62] dark:text-[#8E95A0] border-[#E8E3DB] dark:border-[#2C3037]',
};

export const MentorAvailabilityHeatmap: React.FC<MentorAvailabilityHeatmapProps> = ({
  contributions,
  mentorshipSessions,
  onOpenMentorThread,
}) => {
  const [timezoneId, setTimezoneId] = useState<MentorHeatmapTimezoneId>(() =>
    resolveDefaultHeatmapTimezoneId()
  );
  const [selectedCell, setSelectedCell] = useState<{
    mentorId: string;
    slotIndex: number;
  } | null>(null);

  const heatmap = useMemo(
    () =>
      buildMentorAvailabilityHeatmap({
        timezoneId,
        mentorshipSessions,
      }),
    [timezoneId, mentorshipSessions]
  );

  const activeCell = useMemo(() => {
    if (selectedCell) {
      const row = heatmap.rows.find((r) => r.mentor.id === selectedCell.mentorId);
      const cell = row?.cells[selectedCell.slotIndex];
      if (cell) return cell;
    }
    // Default highlight: fastest cell of the first row
    const firstRow = heatmap.rows[0];
    if (!firstRow) return null;
    return [...firstRow.cells].sort(
      (a, b) => a.estimatedResponseMinutes - b.estimatedResponseMinutes
    )[0];
  }, [heatmap, selectedCell]);

  const handleScheduleForCell = (cell: MentorHeatmapCell) => {
    const matchingSprint =
      contributions.find(
        (c) =>
          c.status === 'in-progress' &&
          c.domain.toLowerCase() === cell.domain.toLowerCase()
      ) ??
      contributions.find(
        (c) => c.domain.toLowerCase() === cell.domain.toLowerCase()
      ) ??
      contributions.find((c) => c.status === 'in-progress') ??
      contributions[0];

    const sprintId = matchingSprint?.briefId ?? 'sprint-solar-coldchain-01';
    const sprintTitle =
      matchingSprint?.briefTitle ?? `${cell.domain} Mentorship Sprint`;

    onOpenMentorThread(sprintId, sprintTitle, cell.domain, {
      initialPanel: cell.isOptimalSessionWindow ? 'session' : 'chat',
      contextNote: `Preferred window: ${cell.viewerRangeLabel} ${heatmap.timezone.shortLabel} (${cell.mentorLocalRangeLabel} ${cell.mentorLocalTimezoneLabel}) · Est. reply ${cell.responseTimeLabel}`,
    });
  };

  return (
    <section
      aria-labelledby="mentor-availability-heatmap-heading"
      data-testid="mentor-availability-heatmap"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
            Global Pod Scheduling
          </p>
          <h2
            id="mentor-availability-heatmap-heading"
            className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Mentor Response Time &amp; Time-Zone Heatmap
          </h2>
          <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
            Compare median mentor response windows across time zones to time live QA sessions and async collaboration notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          <div className="flex items-center gap-2">
            <label
              htmlFor="mentor-heatmap-timezone-select"
              className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
              <span>View Time Zone</span>
            </label>
            <select
              id="mentor-heatmap-timezone-select"
              data-testid="mentor-heatmap-timezone-select"
              value={timezoneId}
              onChange={(e) => setTimezoneId(e.target.value as MentorHeatmapTimezoneId)}
              className="min-h-[38px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-1.5 text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] cursor-pointer"
            >
              {MENTOR_HEATMAP_TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overlap Summary & Legend Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#575B62] dark:text-[#A3A7AE]">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
            <span>
              Peak pod overlap:{' '}
              <strong
                data-testid="mentor-heatmap-best-overlap"
                className="font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE]"
              >
                {heatmap.bestOverlapSlotLabel}
              </strong>{' '}
              ({heatmap.bestOverlapMentorsCount}/{heatmap.rows.length} mentors responsive)
            </span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular tabular-nums">
            Fastest response: ~{heatmap.fastestOverallResponseMinutes}m
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-3 text-[11px] text-[#575B62] dark:text-[#A3A7AE]"
          aria-label="Response speed legend"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#146C53] dark:bg-[#2EB88B]" />
            <span className="font-mono-tabular tabular-nums">≤12m Peak Live</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#D6ECE3] dark:bg-[#16382E] border border-[#9AD2BC] dark:border-[#235949]" />
            <span className="font-mono-tabular tabular-nums">13–25m Responsive</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#FEF3C7] dark:bg-[#2F2410] border border-[#F3D17A] dark:border-[#5C4417]" />
            <span className="font-mono-tabular tabular-nums">26–60m Async</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#F4F1EC] dark:bg-[#17191D] border border-[#E8E3DB] dark:border-[#2C3037]" />
            <span className="font-mono-tabular tabular-nums">&gt;60m Off-Hours</span>
          </span>
        </div>
      </div>

      {/* Heatmap Matrix */}
      <div className="overflow-x-auto pb-1">
        <table
          data-testid="mentor-heatmap-grid"
          className="w-full min-w-[700px] border-separate border-spacing-y-2 border-spacing-x-1.5 text-left"
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="w-56 pb-1 pr-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#575B62] dark:text-[#A3A7AE]"
              >
                Pod Mentor · Desk TZ
              </th>
              {heatmap.slots.map((slot) => (
                <th
                  key={slot.slotIndex}
                  scope="col"
                  className="pb-1 text-center text-[11px] font-mono-tabular tabular-nums font-semibold text-[#575B62] dark:text-[#A3A7AE]"
                >
                  <div>{slot.slotLabel}</div>
                  <div className="text-[10px] font-normal opacity-75">
                    +{String(slot.endHour).padStart(2, '0')}h
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.rows.map((row) => (
              <tr key={row.mentor.id} data-testid={`mentor-heatmap-row-${row.mentor.id}`}>
                <th scope="row" className="pr-3 py-1 align-middle font-normal">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] truncate">
                      {row.mentor.name}
                    </p>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] truncate">
                      {row.mentor.domain} · {row.nativeTimezoneLabel}
                    </p>
                  </div>
                </th>

                {row.cells.map((cell) => {
                  const isSelected =
                    activeCell?.mentorId === cell.mentorId &&
                    activeCell?.slotIndex === cell.slotIndex;
                  return (
                    <td key={cell.slotIndex} className="p-0 align-middle">
                      <button
                        type="button"
                        data-testid={`heatmap-cell-${cell.mentorId}-${cell.slotIndex}`}
                        data-tier={cell.tier}
                        aria-pressed={isSelected}
                        aria-label={`${cell.mentorName} (${cell.domain}) at ${cell.viewerRangeLabel} ${heatmap.timezone.shortLabel} (${cell.mentorLocalRangeLabel} ${cell.mentorLocalTimezoneLabel}): typical response ${cell.responseTimeLabel}, ${cell.tierLabel}`}
                        onClick={() =>
                          setSelectedCell({
                            mentorId: cell.mentorId,
                            slotIndex: cell.slotIndex,
                          })
                        }
                        className={`w-full min-h-[42px] rounded-lg border px-1.5 py-2 text-center font-mono-tabular tabular-nums text-xs font-semibold transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
                          CELL_STYLES[cell.tier]
                        } ${
                          isSelected
                            ? 'ring-2 ring-[#17191C] dark:ring-[#F4F2EE] scale-[1.02]'
                            : 'hover:opacity-90'
                        }`}
                      >
                        {cell.responseTimeLabel}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Slot Scheduling Guidance Bar */}
      {activeCell && (
        <div
          data-testid="mentor-heatmap-cell-detail"
          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {activeCell.mentorName}
              </span>
              <span className="text-[#8A847A]" aria-hidden="true">·</span>
              <span className="font-medium text-[#146C53] dark:text-[#2EB88B]">
                {activeCell.tierLabel} (~{activeCell.responseTimeLabel})
              </span>
              <span className="text-[#8A847A]" aria-hidden="true">·</span>
              <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                {activeCell.viewerRangeLabel} {heatmap.timezone.shortLabel} ({activeCell.mentorLocalRangeLabel}{' '}
                {activeCell.mentorLocalTimezoneLabel})
              </span>
            </div>
            <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
              {activeCell.schedulingAdvice}
            </p>
          </div>

          <button
            type="button"
            data-testid="mentor-heatmap-schedule-btn"
            onClick={() => handleScheduleForCell(activeCell)}
            className="min-h-[38px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeCell.isOptimalSessionWindow ? (
              <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              {activeCell.isOptimalSessionWindow
                ? 'Schedule Session in Window'
                : 'Leave Collaboration Note'}
            </span>
          </button>
        </div>
      )}
    </section>
  );
};
