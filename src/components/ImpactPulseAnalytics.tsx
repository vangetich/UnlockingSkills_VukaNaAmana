import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Download,
  Flame,
  Gauge,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type {
  BriefSubmission,
  ContractPayout,
  SprintMilestoneKey,
} from '../types/kora';
import {
  SPRINT_MILESTONE_STEPS,
  normalizeSprintMilestones,
} from '../utils/talentEngine';

export interface ImpactPulseSprintPoint {
  sprintId: string;
  label: string;
  sprintTitle: string;
  domain: string;
  status: 'completed' | 'in-progress';
  payoutUsd: number;
  cumulativePayoutUsd: number;
  hoursLogged: number;
  milestonesCompleted: number;
  totalMilestones: number;
  milestoneVelocityPct: number;
  cumulativeMilestones: number;
  velocityPerHour: number;
  dateLabel: string;
  exactDateLabel: string;
  timestampIso: string;
}

export interface ImpactPulseSeriesResult {
  points: ImpactPulseSprintPoint[];
  totalPayoutUsd: number;
  totalHoursLogged: number;
  totalMilestonesCompleted: number;
  averageVelocityPct: number;
  averagePayoutPerSprintUsd: number;
}

export interface BuildImpactPulseInput {
  contributions: BriefSubmission[];
  payouts: ContractPayout[];
  sprintMilestonesByBrief?: Record<string, SprintMilestoneKey[]>;
}

/**
 * Pure transformer that converts real sprint submissions, milestone checkpoints,
 * and contract payouts into chronological chart series for Recharts.
 */
export function buildImpactPulseSeries(
  input: BuildImpactPulseInput
): ImpactPulseSeriesResult {
  const {
    contributions = [],
    payouts = [],
    sprintMilestonesByBrief = {},
  } = input;

  const totalStepCount = Math.max(1, SPRINT_MILESTONE_STEPS.length);

  interface MergedSprintRecord {
    sprintId: string;
    sprintTitle: string;
    domain: string;
    status: 'completed' | 'in-progress';
    payoutUsd: number;
    hoursLogged: number;
    milestonesCompleted: number;
    timestampMs: number;
    timestampIso: string;
  }

  const bySprint = new Map<string, MergedSprintRecord>();

  for (const contrib of contributions) {
    const isCompleted = contrib.status === 'completed';
    const doneKeys = normalizeSprintMilestones(
      contrib.milestonesDone ?? sprintMilestonesByBrief[contrib.briefId],
      isCompleted
    );
    const iso = contrib.updatedAtIso || contrib.createdAtIso || '';
    const ts = Date.parse(iso) || 0;

    bySprint.set(contrib.briefId, {
      sprintId: contrib.briefId,
      sprintTitle: contrib.briefTitle || 'Solution Sprint',
      domain: contrib.domain || 'Field Ops',
      status: isCompleted ? 'completed' : 'in-progress',
      payoutUsd: Math.max(0, Number(contrib.payoutUsd || 0)),
      hoursLogged: Math.max(0, Number(contrib.hoursLogged || 0)),
      milestonesCompleted: doneKeys.length,
      timestampMs: ts,
      timestampIso: iso,
    });
  }

  for (const payout of payouts) {
    const existing = bySprint.get(payout.sprintId);
    const iso = payout.updatedAtIso || payout.createdAtIso || '';
    const ts = Date.parse(iso) || 0;
    const payoutAmt = Math.max(0, Number(payout.amountUsd || 0));
    const isReleased = payout.status === 'released';

    if (!existing) {
      bySprint.set(payout.sprintId, {
        sprintId: payout.sprintId,
        sprintTitle: payout.sprintTitle || 'Solution Sprint',
        domain: 'Partner Sprint',
        status: isReleased ? 'completed' : 'in-progress',
        payoutUsd: payoutAmt,
        hoursLogged: isReleased ? 6 : 2,
        milestonesCompleted: isReleased ? totalStepCount : 1,
        timestampMs: ts,
        timestampIso: iso,
      });
    } else {
      existing.payoutUsd = Math.max(existing.payoutUsd, payoutAmt);
      if (isReleased) {
        existing.status = 'completed';
        existing.milestonesCompleted = totalStepCount;
      }
      if (ts > existing.timestampMs) {
        existing.timestampMs = ts;
        existing.timestampIso = iso;
      }
    }
  }

  const ordered = Array.from(bySprint.values()).sort(
    (a, b) => a.timestampMs - b.timestampMs || a.sprintId.localeCompare(b.sprintId)
  );

  let cumulativePayoutUsd = 0;
  let cumulativeMilestones = 0;
  let totalHoursLogged = 0;

  const points: ImpactPulseSprintPoint[] = ordered.map((rec, index) => {
    cumulativePayoutUsd += rec.payoutUsd;
    cumulativeMilestones += rec.milestonesCompleted;
    totalHoursLogged += rec.hoursLogged;

    const milestoneVelocityPct = Math.round(
      (rec.milestonesCompleted / totalStepCount) * 100
    );
    const velocityPerHour =
      rec.hoursLogged > 0
        ? Math.round((rec.milestonesCompleted / rec.hoursLogged) * 100) / 100
        : rec.milestonesCompleted;

    const parsedDate = rec.timestampIso ? new Date(rec.timestampIso) : null;
    const isValidDate = Boolean(parsedDate && !Number.isNaN(parsedDate.getTime()));
    const dateLabel =
      isValidDate && parsedDate
        ? parsedDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
        : `Sprint ${index + 1}`;
    const exactDateLabel =
      isValidDate && parsedDate
        ? parsedDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : `Sprint ${index + 1}`;

    return {
      sprintId: rec.sprintId,
      label: `S${index + 1}`,
      sprintTitle: rec.sprintTitle,
      domain: rec.domain,
      status: rec.status,
      payoutUsd: rec.payoutUsd,
      cumulativePayoutUsd,
      hoursLogged: rec.hoursLogged,
      milestonesCompleted: rec.milestonesCompleted,
      totalMilestones: totalStepCount,
      milestoneVelocityPct,
      cumulativeMilestones,
      velocityPerHour,
      dateLabel,
      exactDateLabel,
      timestampIso: rec.timestampIso,
    };
  });

  const averageVelocityPct =
    points.length > 0
      ? Math.round(
          points.reduce((sum, pt) => sum + pt.milestoneVelocityPct, 0) /
            points.length
        )
      : 0;

  const averagePayoutPerSprintUsd =
    points.length > 0
      ? Math.round(cumulativePayoutUsd / points.length)
      : 0;

  return {
    points,
    totalPayoutUsd: cumulativePayoutUsd,
    totalHoursLogged: Math.round(totalHoursLogged * 10) / 10,
    totalMilestonesCompleted: cumulativeMilestones,
    averageVelocityPct,
    averagePayoutPerSprintUsd,
  };
}

function escapeCsvCell(value: string | number): string {
  const raw = String(value ?? '');
  const safe =
    typeof value === 'string' && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Generates RFC 4180 CSV content for a practitioner's full sprint history,
 * including payout amounts, cumulative totals, hours, velocity, and timestamps.
 */
export function buildImpactPulseHistoryCsv(
  points: ImpactPulseSprintPoint[]
): string {
  const headers = [
    'Sprint Label',
    'Sprint ID',
    'Sprint Title',
    'Domain',
    'Status',
    'Payout (USD)',
    'Cumulative Payout (USD)',
    'Hours Logged',
    'Milestones Completed',
    'Total Milestones',
    'Milestone Velocity (%)',
    'Exact Date',
    'Timestamp (ISO)',
  ];

  const rows = points.map((point) => [
    escapeCsvCell(point.label),
    escapeCsvCell(point.sprintId),
    escapeCsvCell(point.sprintTitle),
    escapeCsvCell(point.domain),
    escapeCsvCell(point.status),
    escapeCsvCell(point.payoutUsd),
    escapeCsvCell(point.cumulativePayoutUsd),
    escapeCsvCell(point.hoursLogged),
    escapeCsvCell(point.milestonesCompleted),
    escapeCsvCell(point.totalMilestones),
    escapeCsvCell(point.milestoneVelocityPct),
    escapeCsvCell(point.exactDateLabel),
    escapeCsvCell(point.timestampIso),
  ]);

  return [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join(
    '\n'
  );
}

export type HeatmapIntensityLevel = 0 | 1 | 2 | 3 | 4;

export interface YearHeatmapDayCell {
  dateKey: string;
  dateLabel: string;
  monthIndex: number;
  dayOfWeek: number;
  inTargetYear: boolean;
  sprintCount: number;
  milestoneCompletions: number;
  hoursDensity: number;
  intensityScore: number;
  level: HeatmapIntensityLevel;
  sprintTitles: string[];
}

export interface YearInReviewHeatmapResult {
  year: number;
  availableYears: number[];
  weeks: YearHeatmapDayCell[][];
  monthLabels: Array<{ weekIndex: number; label: string }>;
  totalActiveDays: number;
  totalMilestonesCompleted: number;
  totalSprintTouches: number;
  longestStreakDays: number;
  peakDay: YearHeatmapDayCell | null;
}

export interface BuildYearHeatmapInput extends BuildImpactPulseInput {
  year?: number;
  referenceYear?: number;
}

const HEATMAP_MONTH_NAMES = [
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
];

const MS_PER_UTC_DAY = 86_400_000;

function toUtcDayNumber(isoOrMs: string | number | undefined): number | null {
  if (isoOrMs === undefined || isoOrMs === '') return null;
  const ms = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / MS_PER_UTC_DAY
  );
}

function formatUtcDayKey(utcDayNumber: number): string {
  const d = new Date(utcDayNumber * MS_PER_UTC_DAY);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatUtcDayLabel(utcDayNumber: number): string {
  const d = new Date(utcDayNumber * MS_PER_UTC_DAY);
  return `${HEATMAP_MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function classifyHeatmapLevel(intensityScore: number): HeatmapIntensityLevel {
  if (intensityScore <= 0) return 0;
  if (intensityScore <= 3) return 1;
  if (intensityScore <= 6) return 2;
  if (intensityScore <= 9) return 3;
  return 4;
}

/**
 * Pure builder mapping sprint durations, hours logged, and milestone completions
 * across every calendar day of the selected year (Sun–Sat weeks × 52–54 columns).
 */
export function buildYearInReviewHeatmap(
  input: BuildYearHeatmapInput
): YearInReviewHeatmapResult {
  const {
    contributions = [],
    payouts = [],
    sprintMilestonesByBrief = {},
    year,
    referenceYear = new Date().getUTCFullYear(),
  } = input;

  const totalStepCount = Math.max(1, SPRINT_MILESTONE_STEPS.length);
  const yearsSet = new Set<number>([referenceYear]);

  interface SprintSpanItem {
    sprintId: string;
    sprintTitle: string;
    startDay: number;
    endDay: number;
    hoursLogged: number;
    milestonesCompleted: number;
  }

  const bySprint = new Map<string, SprintSpanItem>();

  for (const contrib of contributions) {
    const isCompleted = contrib.status === 'completed';
    const doneKeys = normalizeSprintMilestones(
      contrib.milestonesDone ?? sprintMilestonesByBrief[contrib.briefId],
      isCompleted
    );
    const createdDay = toUtcDayNumber(contrib.createdAtIso);
    const updatedDay = toUtcDayNumber(contrib.updatedAtIso);
    const deadlineDay = toUtcDayNumber(contrib.deadlineIso);

    const hours = Math.max(1, Number(contrib.hoursLogged || 0));
    const defaultSpanDays = Math.min(14, Math.max(3, Math.ceil(hours / 3)));

    const anchorEnd = isCompleted
      ? (updatedDay ?? deadlineDay ?? createdDay)
      : (deadlineDay ?? (createdDay !== null ? createdDay + defaultSpanDays - 1 : updatedDay));

    if (anchorEnd === null && createdDay === null) continue;

    let startDay =
      createdDay !== null
        ? createdDay
        : (anchorEnd as number) - (defaultSpanDays - 1);
    let endDay =
      anchorEnd !== null
        ? anchorEnd
        : startDay + defaultSpanDays - 1;

    if (endDay < startDay) {
      const tmp = startDay;
      startDay = endDay;
      endDay = tmp;
    }
    if (endDay - startDay > 30) {
      startDay = endDay - 30;
    }

    yearsSet.add(new Date(startDay * MS_PER_UTC_DAY).getUTCFullYear());
    yearsSet.add(new Date(endDay * MS_PER_UTC_DAY).getUTCFullYear());

    bySprint.set(contrib.briefId, {
      sprintId: contrib.briefId,
      sprintTitle: contrib.briefTitle || 'Solution Sprint',
      startDay,
      endDay,
      hoursLogged: Math.max(0, Number(contrib.hoursLogged || 0)),
      milestonesCompleted: doneKeys.length,
    });
  }

  for (const payout of payouts) {
    const existing = bySprint.get(payout.sprintId);
    const updatedDay = toUtcDayNumber(payout.updatedAtIso || payout.createdAtIso);
    const createdDay = toUtcDayNumber(payout.createdAtIso || payout.updatedAtIso);
    const isReleased = payout.status === 'released';

    if (createdDay !== null) {
      yearsSet.add(new Date(createdDay * MS_PER_UTC_DAY).getUTCFullYear());
    }
    if (updatedDay !== null) {
      yearsSet.add(new Date(updatedDay * MS_PER_UTC_DAY).getUTCFullYear());
    }

    if (!existing) {
      if (updatedDay === null && createdDay === null) continue;
      let startDay = createdDay ?? (updatedDay as number) - 4;
      let endDay = updatedDay ?? startDay + 4;
      if (endDay < startDay) startDay = endDay;
      if (endDay - startDay > 30) startDay = endDay - 30;

      bySprint.set(payout.sprintId, {
        sprintId: payout.sprintId,
        sprintTitle: payout.sprintTitle || 'Solution Sprint',
        startDay,
        endDay,
        hoursLogged: isReleased ? 6 : 2,
        milestonesCompleted: isReleased ? totalStepCount : 1,
      });
    } else if (isReleased) {
      existing.milestonesCompleted = Math.max(existing.milestonesCompleted, totalStepCount);
      if (updatedDay !== null && updatedDay > existing.endDay && updatedDay - existing.startDay <= 30) {
        existing.endDay = updatedDay;
      }
    }
  }

  if (year !== undefined) {
    yearsSet.add(year);
  }

  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
  const targetYear =
    year ??
    (contributions.length > 0 || payouts.length > 0
      ? availableYears[0]
      : referenceYear);

  // Accumulate daily sprint touches, hours density, and milestone completions
  const dayAcc = new Map<
    number,
    {
      sprintIds: Set<string>;
      sprintTitles: string[];
      hoursDensity: number;
      milestoneCompletions: number;
    }
  >();

  const ensureAcc = (dayNum: number) => {
    let entry = dayAcc.get(dayNum);
    if (!entry) {
      entry = {
        sprintIds: new Set<string>(),
        sprintTitles: [],
        hoursDensity: 0,
        milestoneCompletions: 0,
      };
      dayAcc.set(dayNum, entry);
    }
    return entry;
  };

  for (const span of bySprint.values()) {
    const spanLen = Math.max(1, span.endDay - span.startDay + 1);
    const dailyHours = span.hoursLogged / spanLen;

    for (let d = span.startDay; d <= span.endDay; d++) {
      const entry = ensureAcc(d);
      if (!entry.sprintIds.has(span.sprintId)) {
        entry.sprintIds.add(span.sprintId);
        entry.sprintTitles.push(span.sprintTitle);
      }
      entry.hoursDensity += dailyHours;
    }

    // Distribute milestone completions deterministically across the sprint span
    const milestonesToPlace = Math.min(totalStepCount, Math.max(0, span.milestonesCompleted));
    const checkpointOffsets = [
      Math.floor((spanLen - 1) * 0.25),
      Math.floor((spanLen - 1) * 0.6),
      spanLen - 1,
    ];
    for (let mIdx = 0; mIdx < milestonesToPlace; mIdx++) {
      const offset = checkpointOffsets[mIdx] ?? spanLen - 1;
      const milestoneDay = Math.min(span.endDay, span.startDay + offset);
      const entry = ensureAcc(milestoneDay);
      entry.milestoneCompletions += 1;
    }
  }

  const jan1Day = Math.floor(Date.UTC(targetYear, 0, 1) / MS_PER_UTC_DAY);
  const dec31Day = Math.floor(Date.UTC(targetYear, 11, 31) / MS_PER_UTC_DAY);
  const jan1Dow = new Date(jan1Day * MS_PER_UTC_DAY).getUTCDay();
  const dec31Dow = new Date(dec31Day * MS_PER_UTC_DAY).getUTCDay();

  const gridStartDay = jan1Day - jan1Dow;
  const gridEndDay = dec31Day + (6 - dec31Dow);

  const weeks: YearHeatmapDayCell[][] = [];
  const monthLabels: Array<{ weekIndex: number; label: string }> = [];
  const seenMonths = new Set<number>();

  let totalActiveDays = 0;
  let totalMilestonesCompleted = 0;
  let currentStreak = 0;
  let longestStreakDays = 0;
  let peakDay: YearHeatmapDayCell | null = null;
  const targetYearSprintIds = new Set<string>();

  let currentWeek: YearHeatmapDayCell[] = [];
  for (let dayNum = gridStartDay; dayNum <= gridEndDay; dayNum++) {
    const d = new Date(dayNum * MS_PER_UTC_DAY);
    const cellYear = d.getUTCFullYear();
    const monthIndex = d.getUTCMonth();
    const dayOfWeek = d.getUTCDay();
    const inTargetYear = cellYear === targetYear;

    const acc = dayAcc.get(dayNum);
    const sprintCount = inTargetYear && acc ? acc.sprintIds.size : 0;
    const milestoneCompletions = inTargetYear && acc ? acc.milestoneCompletions : 0;
    const hoursDensity = inTargetYear && acc ? Math.round(acc.hoursDensity * 10) / 10 : 0;
    const sprintTitles = inTargetYear && acc ? [...acc.sprintTitles] : [];

    const intensityScore =
      sprintCount === 0 && milestoneCompletions === 0
        ? 0
        : sprintCount * 2 + milestoneCompletions * 3 + Math.round(hoursDensity);
    const level = inTargetYear ? classifyHeatmapLevel(intensityScore) : 0;

    if (inTargetYear) {
      if (acc) {
        acc.sprintIds.forEach((id) => targetYearSprintIds.add(id));
      }
      totalMilestonesCompleted += milestoneCompletions;
      if (level > 0) {
        totalActiveDays += 1;
        currentStreak += 1;
        if (currentStreak > longestStreakDays) {
          longestStreakDays = currentStreak;
        }
      } else {
        currentStreak = 0;
      }

      if (dayNum === jan1Day || (d.getUTCDate() === 1 && !seenMonths.has(monthIndex))) {
        seenMonths.add(monthIndex);
        monthLabels.push({
          weekIndex: weeks.length,
          label: HEATMAP_MONTH_NAMES[monthIndex],
        });
      }
    }

    const cell: YearHeatmapDayCell = {
      dateKey: formatUtcDayKey(dayNum),
      dateLabel: formatUtcDayLabel(dayNum),
      monthIndex,
      dayOfWeek,
      inTargetYear,
      sprintCount,
      milestoneCompletions,
      hoursDensity,
      intensityScore,
      level,
      sprintTitles,
    };

    if (
      inTargetYear &&
      level > 0 &&
      (!peakDay || cell.intensityScore > peakDay.intensityScore)
    ) {
      peakDay = cell;
    }

    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return {
    year: targetYear,
    availableYears,
    weeks,
    monthLabels,
    totalActiveDays,
    totalMilestonesCompleted,
    totalSprintTouches: targetYearSprintIds.size,
    longestStreakDays,
    peakDay,
  };
}

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: ImpactPulseSprintPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}

export const PayoutTrendsTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      data-testid="payout-trends-custom-tooltip"
      className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 px-3.5 py-3 shadow-lg text-xs max-w-[260px] space-y-2"
    >
      <div className="border-b border-[#E8E3DB] dark:border-[#2C3037] pb-1.5 space-y-0.5">
        <p className="text-[11px] font-mono-tabular font-semibold text-[#C4622D] dark:text-[#E07B46]">
          {point.exactDateLabel}
        </p>
        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
          {point.sprintTitle}
        </p>
        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          {point.domain} · {point.status === 'completed' ? 'Completed' : 'In Progress'}
        </p>
      </div>

      <div className="space-y-1 font-mono-tabular tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#575B62] dark:text-[#A3A7AE]">Specific Payout</span>
          <span className="font-semibold text-sm text-[#146C53] dark:text-[#2EB88B]">
            ${point.payoutUsd.toLocaleString()} USD
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#575B62] dark:text-[#A3A7AE]">Cumulative Total</span>
          <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            ${point.cumulativePayoutUsd.toLocaleString()} USD
          </span>
        </div>
      </div>
    </div>
  );
};

const SprintAnalyticsTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 shadow-lg text-xs max-w-[240px] space-y-1.5">
      <div className="border-b border-[#E8E3DB] dark:border-[#2C3037] pb-1.5">
        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
          {point.sprintTitle}
        </p>
        <p className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
          {point.label} · {point.exactDateLabel} ·{' '}
          {point.status === 'completed' ? 'Completed' : 'In Progress'}
        </p>
      </div>
      <div className="space-y-1 font-mono-tabular tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#575B62] dark:text-[#A3A7AE]">Sprint Payout</span>
          <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
            ${point.payoutUsd.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#575B62] dark:text-[#A3A7AE]">Hours Logged</span>
          <span className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
            {point.hoursLogged}h
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#575B62] dark:text-[#A3A7AE]">Milestone Velocity</span>
          <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
            {point.milestonesCompleted}/{point.totalMilestones} ({point.milestoneVelocityPct}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export type ImpactAnalyticsViewMode =
  | 'payout-trends'
  | 'milestone-velocity'
  | 'year-heatmap';

const HEATMAP_LEVEL_CLASSES: Record<HeatmapIntensityLevel, string> = {
  0: 'bg-[#E8E3DB]/70 dark:bg-[#242830] border-[#E8E3DB] dark:border-[#2C3037]',
  1: 'bg-[#CDE8DD] dark:bg-[#143D31] border-[#9CD5BF] dark:border-[#1F5A47]',
  2: 'bg-[#7AC9AC] dark:bg-[#1C6E55] border-[#4EB390] dark:border-[#258B6C]',
  3: 'bg-[#2B9374] dark:bg-[#249A74] border-[#1D785C] dark:border-[#2EB88B]',
  4: 'bg-[#146C53] dark:bg-[#2EB88B] border-[#0E4E3B] dark:border-[#6EE7B7]',
};

const HEATMAP_LEVEL_LABELS: Record<HeatmapIntensityLevel, string> = {
  0: 'No activity',
  1: 'Light intensity',
  2: 'Moderate intensity',
  3: 'High intensity',
  4: 'Peak milestone density',
};

interface ImpactPulseAnalyticsProps extends BuildImpactPulseInput {
  onGoToSolve?: () => void;
  defaultView?: ImpactAnalyticsViewMode;
  onExportCsv?: (csvContent: string, points: ImpactPulseSprintPoint[]) => void;
}

export const ImpactPulseAnalytics: React.FC<ImpactPulseAnalyticsProps> = ({
  contributions,
  payouts,
  sprintMilestonesByBrief,
  onGoToSolve,
  defaultView = 'payout-trends',
  onExportCsv,
}) => {
  const [activeView, setActiveView] = useState<ImpactAnalyticsViewMode>(defaultView);
  const [csvExportedNotice, setCsvExportedNotice] = useState<string | null>(null);
  const [selectedHeatmapYear, setSelectedHeatmapYear] = useState<number | undefined>(
    undefined
  );
  const [inspectedDayKey, setInspectedDayKey] = useState<string | null>(null);

  const analytics = useMemo(
    () =>
      buildImpactPulseSeries({
        contributions,
        payouts,
        sprintMilestonesByBrief,
      }),
    [contributions, payouts, sprintMilestonesByBrief]
  );

  const heatmap = useMemo(
    () =>
      buildYearInReviewHeatmap({
        contributions,
        payouts,
        sprintMilestonesByBrief,
        year: selectedHeatmapYear,
      }),
    [contributions, payouts, sprintMilestonesByBrief, selectedHeatmapYear]
  );

  const inspectedCell = useMemo(() => {
    const allCells = heatmap.weeks.flat().filter((cell) => cell.inTargetYear);
    if (inspectedDayKey) {
      const match = allCells.find((cell) => cell.dateKey === inspectedDayKey);
      if (match) return match;
    }
    return heatmap.peakDay ?? allCells[allCells.length - 1] ?? null;
  }, [heatmap, inspectedDayKey]);

  useEffect(() => {
    if (!csvExportedNotice) return;
    const timer = window.setTimeout(() => setCsvExportedNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [csvExportedNotice]);

  const handleExportToCsv = () => {
    if (analytics.points.length === 0) return;
    const csvContent = buildImpactPulseHistoryCsv(analytics.points);

    if (onExportCsv) {
      onExportCsv(csvContent, analytics.points);
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute('download', `vuka-sprint-history-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setCsvExportedNotice(
      `Exported ${analytics.points.length} sprint record${analytics.points.length === 1 ? '' : 's'} to CSV`
    );
  };

  return (
    <section
      aria-labelledby="impact-pulse-analytics-heading"
      data-testid="impact-pulse-analytics"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 space-y-6"
    >
      {/* Header + 3 Summary Metrics + Export to CSV */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div>
          <p className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
            Practitioner Sprint History · Recharts Telemetry
          </p>
          <h2
            id="impact-pulse-analytics-heading"
            className="mt-0.5 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Impact Pulse Analytics
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
            Payout trends, hours applied per pod sprint, and milestone completion velocity across your history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 shrink-0 pt-2 lg:pt-0">
          <dl className="grid grid-cols-3 gap-4 sm:gap-6 shrink-0">
            <div>
              <dt className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-1">
                <Wallet className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                <span>Total Payouts</span>
              </dt>
              <dd
                data-testid="impact-analytics-total-payout"
                className="mt-0.5 font-mono-tabular tabular-nums text-lg sm:text-xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
              >
                ${analytics.totalPayoutUsd.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-1">
                <Clock3 className="w-3 h-3 text-[#C4622D] dark:text-[#E07B46]" aria-hidden="true" />
                <span>Hours Logged</span>
              </dt>
              <dd
                data-testid="impact-analytics-total-hours"
                className="mt-0.5 font-mono-tabular tabular-nums text-lg sm:text-xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
              >
                {analytics.totalHoursLogged}h
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-1">
                <Gauge className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                <span>Avg Velocity</span>
              </dt>
              <dd
                data-testid="impact-analytics-avg-velocity"
                className="mt-0.5 font-mono-tabular tabular-nums text-lg sm:text-xl font-semibold text-[#146C53] dark:text-[#2EB88B]"
              >
                {analytics.averageVelocityPct}%
              </dd>
            </div>
          </dl>

          <div className="flex flex-col items-start sm:items-end gap-1">
            <button
              type="button"
              data-testid="impact-analytics-export-csv-btn"
              onClick={handleExportToCsv}
              disabled={analytics.points.length === 0}
              aria-label="Export full sprint history data to CSV"
              className="min-h-[38px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] hover:bg-[#E7F3EE]/50 dark:hover:bg-[#142B24]/60 text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {csvExportedNotice ? (
                <Check className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
              )}
              <span>Export to CSV</span>
            </button>
            {csvExportedNotice && (
              <span
                role="status"
                data-testid="impact-analytics-csv-notice"
                className="text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B]"
              >
                {csvExportedNotice}
              </span>
            )}
          </div>
        </div>
      </div>

      {analytics.points.length === 0 ? (
        <div
          data-testid="impact-pulse-analytics-empty"
          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-8 text-center space-y-3"
        >
          <p className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
            No sprint history recorded yet
          </p>
          <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] max-w-md mx-auto leading-relaxed">
            Join a Pod Sprint in Solve and log your first hours and delivery checkpoints to unlock payout trend and milestone velocity charts.
          </p>
          {onGoToSolve && (
            <button
              type="button"
              onClick={onGoToSolve}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Explore Pod Sprints</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Mode Toggle: Payout Trends vs Milestone Velocity vs Year in Review */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Impact Pulse Analytics View"
              data-testid="impact-analytics-view-toggle"
              className="inline-flex flex-wrap rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-1 gap-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'payout-trends'}
                data-testid="analytics-toggle-payout-trends"
                onClick={() => setActiveView('payout-trends')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'payout-trends'
                    ? 'bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#2EB88B] shadow-xs border border-[#E8E3DB] dark:border-[#2C3037]'
                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Payout Trends</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'milestone-velocity'}
                data-testid="analytics-toggle-milestone-velocity"
                onClick={() => setActiveView('milestone-velocity')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'milestone-velocity'
                    ? 'bg-white dark:bg-[#1A1C20] text-[#C4622D] dark:text-[#E07B46] shadow-xs border border-[#E8E3DB] dark:border-[#2C3037]'
                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Milestone Velocity</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'year-heatmap'}
                data-testid="analytics-toggle-year-heatmap"
                onClick={() => setActiveView('year-heatmap')}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'year-heatmap'
                    ? 'bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#2EB88B] shadow-xs border border-[#E8E3DB] dark:border-[#2C3037]'
                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Year in Review</span>
              </button>
            </div>

            <p className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
              {activeView === 'payout-trends'
                ? `Avg $${analytics.averagePayoutPerSprintUsd.toLocaleString()} / sprint · ${analytics.points.length} sprint${analytics.points.length === 1 ? '' : 's'}`
                : activeView === 'milestone-velocity'
                  ? `${analytics.totalMilestonesCompleted} milestones cleared · ${analytics.totalHoursLogged}h applied`
                  : `${heatmap.year} · ${heatmap.totalActiveDays} active day${heatmap.totalActiveDays === 1 ? '' : 's'} · ${heatmap.totalMilestonesCompleted} milestone${heatmap.totalMilestonesCompleted === 1 ? '' : 's'}`}
            </p>
          </div>

          {activeView === 'payout-trends' ? (
            /* Chart 1: Payout Trends (Per-Sprint + Cumulative USD) */
            <div
              key="payout-trends"
              role="tabpanel"
              data-testid="impact-analytics-payout-chart"
              className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4 min-w-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                    <span>Payout Trends (Per Sprint &amp; Cumulative)</span>
                  </div>
                  <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums">
                    Total Earned ${analytics.totalPayoutUsd.toLocaleString()} USD across {analytics.points.length} sprint{analytics.points.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#C4622D] dark:bg-[#E07B46]" aria-hidden="true" />
                    Sprint USD
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-[#146C53] dark:bg-[#2EB88B]" aria-hidden="true" />
                    Cumulative
                  </span>
                </div>
              </div>

              <div className="h-[260px] sm:h-[290px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={analytics.points}
                    margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="impactCumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#146C53" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#146C53" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8A847A" strokeOpacity={0.18} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#8A847A', fontSize: 11 }}
                      axisLine={{ stroke: '#8A847A', strokeOpacity: 0.25 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#8A847A', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <Tooltip content={<PayoutTrendsTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumulativePayoutUsd"
                      name="Cumulative Payout"
                      stroke="#146C53"
                      strokeWidth={2.2}
                      fill="url(#impactCumulativeGrad)"
                    />
                    <Bar
                      dataKey="payoutUsd"
                      name="Sprint Payout"
                      fill="#C4622D"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={36}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : activeView === 'milestone-velocity' ? (
            /* Chart 2: Hours Logged per Sprint & Milestone Velocity Over Time */
            <div
              key="milestone-velocity"
              role="tabpanel"
              data-testid="impact-analytics-velocity-chart"
              className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4 min-w-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                    <Gauge className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46]" aria-hidden="true" />
                    <span>Hours Logged &amp; Milestone Velocity Over Time</span>
                  </div>
                  <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular tabular-nums">
                    Avg {analytics.averageVelocityPct}% milestone completion · {analytics.totalHoursLogged}h applied
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#146C53] dark:bg-[#2EB88B]" aria-hidden="true" />
                    Hours
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-[#C4622D] dark:bg-[#E07B46]" aria-hidden="true" />
                    Velocity %
                  </span>
                </div>
              </div>

              <div className="h-[260px] sm:h-[290px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={analytics.points}
                    margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#8A847A" strokeOpacity={0.18} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#8A847A', fontSize: 11 }}
                      axisLine={{ stroke: '#8A847A', strokeOpacity: 0.25 }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="hours"
                      tick={{ fill: '#8A847A', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}h`}
                    />
                    <YAxis
                      yAxisId="velocity"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fill: '#8A847A', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<SprintAnalyticsTooltip />} />
                    <Bar
                      yAxisId="hours"
                      dataKey="hoursLogged"
                      name="Hours Logged"
                      fill="#146C53"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={36}
                    />
                    <Line
                      yAxisId="velocity"
                      type="monotone"
                      dataKey="milestoneVelocityPct"
                      name="Milestone Velocity %"
                      stroke="#C4622D"
                      strokeWidth={2.4}
                      dot={{ r: 4, fill: '#C4622D', strokeWidth: 1.5, stroke: '#FAF8F5' }}
                      activeDot={{ r: 5.5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            /* Chart 3: Year-in-Review Sprint Intensity & Milestone Density Heatmap */
            <div
              key="year-heatmap"
              role="tabpanel"
              data-testid="impact-analytics-year-heatmap"
              className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4 min-w-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                    <CalendarDays className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                    <span>Year-in-Review Sprint Intensity &amp; Milestone Density ({heatmap.year})</span>
                  </div>
                  <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Each square reflects active sprint overlap, hours density, and verified milestone checkpoints.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="heatmap-year-selector" className="sr-only">
                    Select calendar year
                  </label>
                  <select
                    id="heatmap-year-selector"
                    data-testid="heatmap-year-select"
                    value={heatmap.year}
                    onChange={(e) => {
                      setSelectedHeatmapYear(Number(e.target.value));
                      setInspectedDayKey(null);
                    }}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-xs font-mono-tabular font-semibold text-[#17191C] dark:text-[#F4F2EE] focus:border-[#146C53] focus:outline-none cursor-pointer"
                  >
                    {heatmap.availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year Summary Strip */}
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2.5">
                  <dt className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">Active Sprint Days</dt>
                  <dd
                    data-testid="heatmap-active-days-count"
                    className="mt-0.5 font-mono-tabular tabular-nums text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    {heatmap.totalActiveDays}
                  </dd>
                </div>
                <div className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2.5">
                  <dt className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">Milestones Cleared</dt>
                  <dd
                    data-testid="heatmap-milestones-count"
                    className="mt-0.5 font-mono-tabular tabular-nums text-base font-semibold text-[#146C53] dark:text-[#2EB88B]"
                  >
                    {heatmap.totalMilestonesCompleted}
                  </dd>
                </div>
                <div className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2.5">
                  <dt className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center gap-1">
                    <Flame className="w-3 h-3 text-[#C4622D] dark:text-[#E07B46]" aria-hidden="true" />
                    <span>Longest Streak</span>
                  </dt>
                  <dd
                    data-testid="heatmap-longest-streak"
                    className="mt-0.5 font-mono-tabular tabular-nums text-base font-semibold text-[#C4622D] dark:text-[#E07B46]"
                  >
                    {heatmap.longestStreakDays}d
                  </dd>
                </div>
                <div className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2.5">
                  <dt className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">Sprints Touched</dt>
                  <dd className="mt-0.5 font-mono-tabular tabular-nums text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    {heatmap.totalSprintTouches}
                  </dd>
                </div>
              </dl>

              {/* Calendar Grid (7 rows x ~53 week columns) */}
              <div className="overflow-x-auto pb-1">
                <div className="min-w-[680px] space-y-1.5">
                  {/* Month Labels */}
                  <div className="flex items-center pl-8 text-[10px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                    <div
                      className="grid flex-1 gap-[3px]"
                      style={{
                        gridTemplateColumns: `repeat(${heatmap.weeks.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {heatmap.weeks.map((_, wIdx) => {
                        const labelMatch = heatmap.monthLabels.find((m) => m.weekIndex === wIdx);
                        return (
                          <span key={`month-col-${wIdx}`} className="truncate leading-none">
                            {labelMatch ? labelMatch.label : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weekday labels + Week columns */}
                  <div className="flex items-stretch gap-2">
                    <div className="w-6 shrink-0 grid grid-rows-7 gap-[3px] text-[10px] font-mono-tabular text-[#8A847A] leading-none">
                      <span className="flex items-center">Sun</span>
                      <span className="flex items-center">Mon</span>
                      <span aria-hidden="true" />
                      <span className="flex items-center">Wed</span>
                      <span aria-hidden="true" />
                      <span className="flex items-center">Fri</span>
                      <span aria-hidden="true" />
                    </div>

                    <div
                      data-testid="year-heatmap-grid"
                      className="grid flex-1 gap-[3px]"
                      style={{
                        gridTemplateColumns: `repeat(${heatmap.weeks.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {heatmap.weeks.map((week, weekIdx) => (
                        <div key={`week-${weekIdx}`} className="grid grid-rows-7 gap-[3px]">
                          {week.map((cell) => {
                            if (!cell.inTargetYear) {
                              return (
                                <span
                                  key={cell.dateKey}
                                  aria-hidden="true"
                                  className="aspect-square w-full rounded-[2px] opacity-0 pointer-events-none"
                                />
                              );
                            }
                            const isInspected = inspectedCell?.dateKey === cell.dateKey;
                            return (
                              <button
                                key={cell.dateKey}
                                type="button"
                                data-testid={`heatmap-day-${cell.dateKey}`}
                                data-level={cell.level}
                                onMouseEnter={() => setInspectedDayKey(cell.dateKey)}
                                onFocus={() => setInspectedDayKey(cell.dateKey)}
                                onClick={() => setInspectedDayKey(cell.dateKey)}
                                aria-label={`${cell.dateLabel}: ${HEATMAP_LEVEL_LABELS[cell.level]}, ${cell.sprintCount} active sprint${cell.sprintCount === 1 ? '' : 's'}, ${cell.milestoneCompletions} milestone${cell.milestoneCompletions === 1 ? '' : 's'} cleared`}
                                className={`aspect-square w-full rounded-[2px] border transition-transform cursor-pointer focus:outline-none ${
                                  HEATMAP_LEVEL_CLASSES[cell.level]
                                } ${
                                  isInspected
                                    ? 'ring-2 ring-[#C4622D] dark:ring-[#E07B46] scale-110 z-10'
                                    : 'hover:scale-110'
                                }`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspected Day Readout + Discrete Intensity Legend */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
                <div
                  data-testid="heatmap-inspected-day-detail"
                  className="text-xs text-[#43484E] dark:text-[#C4C9D0] space-y-0.5"
                >
                  {inspectedCell ? (
                    <>
                      <p className="font-mono-tabular tabular-nums">
                        <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                          {inspectedCell.dateLabel}
                        </strong>{' '}
                        · {HEATMAP_LEVEL_LABELS[inspectedCell.level]} ·{' '}
                        <span className="text-[#146C53] dark:text-[#2EB88B] font-semibold">
                          {inspectedCell.milestoneCompletions} milestone
                          {inspectedCell.milestoneCompletions === 1 ? '' : 's'}
                        </span>{' '}
                        · {inspectedCell.sprintCount} sprint
                        {inspectedCell.sprintCount === 1 ? '' : 's'}
                      </p>
                      {inspectedCell.sprintTitles.length > 0 && (
                        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] truncate max-w-xl">
                          Sprints: {inspectedCell.sprintTitles.join(' · ')}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>Select or hover any day to inspect sprint intensity and milestone density.</p>
                  )}
                </div>

                <div
                  aria-label="Heatmap intensity scale"
                  className="flex items-center gap-1.5 text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE] shrink-0"
                >
                  <span>Less</span>
                  {([0, 1, 2, 3, 4] as const).map((lvl) => (
                    <span
                      key={`legend-${lvl}`}
                      title={HEATMAP_LEVEL_LABELS[lvl]}
                      className={`w-3 h-3 rounded-[2px] border ${HEATMAP_LEVEL_CLASSES[lvl]}`}
                    />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
