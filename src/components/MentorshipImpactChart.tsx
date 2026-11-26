import React, { useMemo, useState } from 'react';
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
  CheckCircle2,
  MessageSquare,
  PlusCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  BriefSubmission,
  ContractPayout,
  MentorMessage,
  MentorPairingRequest,
  MentorshipSession,
  SprintMilestoneKey,
  StudioDomain,
} from '../types/kora';
import {
  MENTORSHIP_FOCUS_LABELS,
  MENTORSHIP_TRACKS,
  SPRINT_MILESTONE_STEPS,
  getAssignedMentorForSprint,
  getMentorshipTrackForDomain,
  normalizeSprintMilestones,
} from '../utils/talentEngine';

export interface MentorshipVelocityPoint {
  sprintId: string;
  label: string;
  sprintTitle: string;
  domain: string;
  status: 'completed' | 'in-progress';
  mentorName: string;
  sessionsAttended: number;
  sessionsScheduled: number;
  sessionsCumulative: number;
  sprintsCompletedCumulative: number;
  milestoneVelocityPct: number;
  hoursLogged: number;
  payoutUsd: number;
  dateLabel: string;
  latestTakeaway: string;
}

export interface MentorshipVelocityMetrics {
  points: MentorshipVelocityPoint[];
  sessionsAttendedCount: number;
  scheduledSessionsCount: number;
  totalMentorshipMinutes: number;
  completedSprintsCount: number;
  totalSprintsCount: number;
  mentoredSprintsCount: number;
  unmentoredSprintsCount: number;
  sessionToSprintRatio: number;
  sessionToSprintRatioLabel: string;
  mentoredSprintCoveragePct: number;
  mentoredAvgVelocityPct: number;
  unmentoredAvgVelocityPct: number | null;
  velocityLiftPct: number | null;
}

export interface SixMonthCorrelationPoint {
  monthKey: string;
  monthLabel: string;
  sessionsAttended: number;
  scheduledSessions: number;
  mentorshipMinutes: number;
  totalSprints: number;
  completedSprints: number;
  completionSuccessRatePct: number;
  milestoneVelocityPct: number;
  hasActivity: boolean;
}

export interface SixMonthCorrelationMetrics {
  months: SixMonthCorrelationPoint[];
  totalSessions6M: number;
  totalCompletedSprints6M: number;
  totalSprints6M: number;
  overallSuccessRatePct: number;
  avgMilestoneVelocityPct: number;
  correlationSummary: string;
  hasAnyActivity: boolean;
}

export interface MentorshipTrackImpactPoint {
  trackId: string;
  trackTitle: string;
  shortTrackLabel: string;
  domain: StudioDomain;
  mentorName: string;
  totalSprints: number;
  mentoredSprints: number;
  completedMentoredSprints: number;
  sessionsAttended: number;
  mentorshipMinutes: number;
  mentorLedSuccessRatePct: number;
  avgMilestoneVelocityPct: number;
  pairingRequestsCount: number;
}

export interface MentorshipTrackImpactMetrics {
  tracks: MentorshipTrackImpactPoint[];
  topImpactTrack: MentorshipTrackImpactPoint | null;
  totalMentoredSprints: number;
  totalCompletedMentoredSprints: number;
  overallMentorLedSuccessRatePct: number;
  hasAnyTrackActivity: boolean;
  summaryText: string;
}

export type MentorshipSessionFilter = 'all' | 'mentor-led';

export interface BuildMentorshipVelocityInput {
  contributions: BriefSubmission[];
  mentorMessages?: MentorMessage[];
  mentorshipSessions?: MentorshipSession[];
  payouts?: ContractPayout[];
  sprintMilestonesByBrief?: Record<string, SprintMilestoneKey[]>;
  mentorPairings?: MentorPairingRequest[];
  sessionFilter?: MentorshipSessionFilter;
}

const UTC_MONTH_SHORT = [
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

function toUtcMonthKey(isoOrMs: string | number): string | null {
  const ms = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
  if (!Number.isFinite(ms) || Number.isNaN(ms)) return null;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Pure analytics builder correlating attended mentorship sessions and pod mentor
 * threads against sprint completion and milestone velocity.
 */
export function buildMentorshipVelocityMetrics(
  input: BuildMentorshipVelocityInput
): MentorshipVelocityMetrics {
  const {
    contributions = [],
    mentorMessages = [],
    mentorshipSessions = [],
    payouts = [],
    sprintMilestonesByBrief = {},
    sessionFilter = 'all',
  } = input;

  const totalStepCount = Math.max(1, SPRINT_MILESTONE_STEPS.length);

  interface SprintAggregate {
    sprintId: string;
    sprintTitle: string;
    domain: string;
    status: 'completed' | 'in-progress';
    hoursLogged: number;
    payoutUsd: number;
    milestonesCompleted: number;
    timestampMs: number;
    timestampIso: string;
  }

  const bySprint = new Map<string, SprintAggregate>();

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
      hoursLogged: Math.max(0, Number(contrib.hoursLogged || 0)),
      payoutUsd: Math.max(0, Number(contrib.payoutUsd || 0)),
      milestonesCompleted: doneKeys.length,
      timestampMs: ts,
      timestampIso: iso,
    });
  }

  for (const payout of payouts) {
    const existing = bySprint.get(payout.sprintId);
    const iso = payout.updatedAtIso || payout.createdAtIso || '';
    const ts = Date.parse(iso) || 0;
    const isReleased = payout.status === 'released';
    const amount = Math.max(0, Number(payout.amountUsd || 0));

    if (!existing) {
      bySprint.set(payout.sprintId, {
        sprintId: payout.sprintId,
        sprintTitle: payout.sprintTitle || 'Solution Sprint',
        domain: 'Partner Sprint',
        status: isReleased ? 'completed' : 'in-progress',
        hoursLogged: isReleased ? 5 : 2,
        payoutUsd: amount,
        milestonesCompleted: isReleased ? totalStepCount : 1,
        timestampMs: ts,
        timestampIso: iso,
      });
    } else {
      existing.payoutUsd = Math.max(existing.payoutUsd, amount);
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

  // Also include sprints that have logged mentorship sessions even if no contribution exists yet
  for (const sess of mentorshipSessions) {
    if (!bySprint.has(sess.sprintId)) {
      const iso = sess.attendedAtIso || sess.updatedAtIso || sess.createdAtIso || '';
      bySprint.set(sess.sprintId, {
        sprintId: sess.sprintId,
        sprintTitle: sess.sprintTitle || 'Mentored Sprint',
        domain: 'Pod Mentorship',
        status: 'in-progress',
        hoursLogged: Math.round((sess.durationMinutes / 60) * 10) / 10,
        payoutUsd: 0,
        milestonesCompleted: 0,
        timestampMs: Date.parse(iso) || 0,
        timestampIso: iso,
      });
    }
  }

  const ordered = Array.from(bySprint.values()).sort(
    (a, b) => a.timestampMs - b.timestampMs || a.sprintId.localeCompare(b.sprintId)
  );

  // Index sessions and messages by sprint
  const sessionsBySprint = new Map<string, MentorshipSession[]>();
  for (const sess of mentorshipSessions) {
    const list = sessionsBySprint.get(sess.sprintId) ?? [];
    list.push(sess);
    sessionsBySprint.set(sess.sprintId, list);
  }

  const practitionerMsgCountsBySprint = new Map<string, number>();
  for (const msg of mentorMessages) {
    if (msg.sender === 'practitioner') {
      practitionerMsgCountsBySprint.set(
        msg.sprintId,
        (practitionerMsgCountsBySprint.get(msg.sprintId) ?? 0) + 1
      );
    }
  }

  let sessionsCumulative = 0;
  let sprintsCompletedCumulative = 0;
  let totalMentorshipMinutes = 0;
  let scheduledSessionsCount = 0;
  let mentoredSprintsCount = 0;
  let unmentoredSprintsCount = 0;
  let mentoredVelocitySum = 0;
  let unmentoredVelocitySum = 0;

  const points: MentorshipVelocityPoint[] = ordered.map((rec, index) => {
    const sprintSessions = sessionsBySprint.get(rec.sprintId) ?? [];
    const attendedList = sprintSessions
      .filter((s) => s.status === 'attended')
      .sort((a, b) => b.attendedAtIso.localeCompare(a.attendedAtIso));
    const scheduledList = sprintSessions.filter((s) => s.status === 'scheduled');

    const asyncThreadMsgs =
      sessionFilter === 'mentor-led'
        ? 0
        : (practitionerMsgCountsBySprint.get(rec.sprintId) ?? 0);
    // Count explicit attended sessions; under 'all' scope fallback to 1 async pod check-in if practitioner engaged in live mentor thread
    const sessionsAttended =
      attendedList.length > 0 ? attendedList.length : asyncThreadMsgs > 0 ? 1 : 0;

    const loggedMinutes = attendedList.reduce((acc, s) => acc + s.durationMinutes, 0);
    totalMentorshipMinutes +=
      loggedMinutes > 0 ? loggedMinutes : sessionsAttended > 0 ? 15 : 0;
    scheduledSessionsCount += scheduledList.length;

    sessionsCumulative += sessionsAttended;
    if (rec.status === 'completed') {
      sprintsCompletedCumulative += 1;
    }

    const milestoneVelocityPct = Math.round(
      (rec.milestonesCompleted / totalStepCount) * 100
    );

    if (sessionsAttended > 0) {
      mentoredSprintsCount += 1;
      mentoredVelocitySum += milestoneVelocityPct;
    } else {
      unmentoredSprintsCount += 1;
      unmentoredVelocitySum += milestoneVelocityPct;
    }

    const parsedDate = rec.timestampIso ? new Date(rec.timestampIso) : null;
    const isValidDate = Boolean(parsedDate && !Number.isNaN(parsedDate.getTime()));
    const dateLabel =
      isValidDate && parsedDate
        ? parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : `S${index + 1}`;

    const assignedMentor = getAssignedMentorForSprint(rec.sprintId, rec.domain);
    const latestTakeaway =
      attendedList[0]?.takeawayNote ||
      (asyncThreadMsgs > 0
        ? `Async pod thread active (${asyncThreadMsgs} practitioner check-in${asyncThreadMsgs === 1 ? '' : 's'}).`
        : scheduledList[0]
          ? `Scheduled: ${MENTORSHIP_FOCUS_LABELS[scheduledList[0].focusTopic]}`
          : 'No mentorship session logged yet for this sprint.');

    return {
      sprintId: rec.sprintId,
      label: `S${index + 1}`,
      sprintTitle: rec.sprintTitle,
      domain: rec.domain,
      status: rec.status,
      mentorName: attendedList[0]?.mentorName ?? assignedMentor.name,
      sessionsAttended,
      sessionsScheduled: scheduledList.length,
      sessionsCumulative,
      sprintsCompletedCumulative,
      milestoneVelocityPct,
      hoursLogged: rec.hoursLogged,
      payoutUsd: rec.payoutUsd,
      dateLabel,
      latestTakeaway,
    };
  });

  const sessionsAttendedCount = sessionsCumulative;
  const completedSprintsCount = sprintsCompletedCumulative;
  const totalSprintsCount = ordered.length;

  const sessionToSprintRatio =
    completedSprintsCount > 0
      ? Math.round((sessionsAttendedCount / completedSprintsCount) * 10) / 10
      : sessionsAttendedCount;

  const sessionToSprintRatioLabel =
    completedSprintsCount > 0
      ? `${sessionToSprintRatio.toFixed(1)} : 1`
      : `${sessionsAttendedCount} : 0`;

  const mentoredSprintCoveragePct =
    totalSprintsCount > 0
      ? Math.round((mentoredSprintsCount / totalSprintsCount) * 100)
      : 0;

  const mentoredAvgVelocityPct =
    mentoredSprintsCount > 0
      ? Math.round(mentoredVelocitySum / mentoredSprintsCount)
      : 0;

  const unmentoredAvgVelocityPct =
    unmentoredSprintsCount > 0
      ? Math.round(unmentoredVelocitySum / unmentoredSprintsCount)
      : null;

  const velocityLiftPct =
    mentoredSprintsCount > 0 && unmentoredAvgVelocityPct !== null
      ? mentoredAvgVelocityPct - unmentoredAvgVelocityPct
      : null;

  return {
    points,
    sessionsAttendedCount,
    scheduledSessionsCount,
    totalMentorshipMinutes,
    completedSprintsCount,
    totalSprintsCount,
    mentoredSprintsCount,
    unmentoredSprintsCount,
    sessionToSprintRatio,
    sessionToSprintRatioLabel,
    mentoredSprintCoveragePct,
    mentoredAvgVelocityPct,
    unmentoredAvgVelocityPct,
    velocityLiftPct,
  };
}

/**
 * Builds a rolling 6-month series correlating mentorship session frequency
 * against sprint completion success rate (%) and milestone velocity (%).
 */
export function buildSixMonthMentorshipCorrelation(
  input: BuildMentorshipVelocityInput & { nowMs?: number }
): SixMonthCorrelationMetrics {
  const {
    contributions = [],
    mentorMessages = [],
    mentorshipSessions = [],
    payouts = [],
    sprintMilestonesByBrief = {},
    sessionFilter = 'all',
    nowMs = Date.now(),
  } = input;

  const totalStepCount = Math.max(1, SPRINT_MILESTONE_STEPS.length);
  const anchor = new Date(nowMs);
  const anchorYear = anchor.getUTCFullYear();
  const anchorMonth = anchor.getUTCMonth();

  interface MonthBucket {
    monthKey: string;
    monthLabel: string;
    sessionsAttended: number;
    scheduledSessions: number;
    mentorshipMinutes: number;
    sprintIds: Set<string>;
    completedSprintIds: Set<string>;
    velocityValues: number[];
  }

  const buckets: MonthBucket[] = [];
  const bucketByKey = new Map<string, MonthBucket>();

  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(Date.UTC(anchorYear, anchorMonth - offset, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = `${UTC_MONTH_SHORT[m]} '${String(y).slice(-2)}`;
    const bucket: MonthBucket = {
      monthKey: key,
      monthLabel: label,
      sessionsAttended: 0,
      scheduledSessions: 0,
      mentorshipMinutes: 0,
      sprintIds: new Set(),
      completedSprintIds: new Set(),
      velocityValues: [],
    };
    buckets.push(bucket);
    bucketByKey.set(key, bucket);
  }

  // Merge sprint completion & milestone velocity records
  interface SprintMonthlyInfo {
    sprintId: string;
    monthKey: string;
    isCompleted: boolean;
    velocityPct: number;
  }

  const sprintById = new Map<string, SprintMonthlyInfo>();

  for (const contrib of contributions) {
    const isCompleted = contrib.status === 'completed';
    const doneKeys = normalizeSprintMilestones(
      contrib.milestonesDone ?? sprintMilestonesByBrief[contrib.briefId],
      isCompleted
    );
    const monthKey = toUtcMonthKey(contrib.updatedAtIso || contrib.createdAtIso);
    if (!monthKey) continue;
    sprintById.set(contrib.briefId, {
      sprintId: contrib.briefId,
      monthKey,
      isCompleted,
      velocityPct: Math.round((doneKeys.length / totalStepCount) * 100),
    });
  }

  for (const payout of payouts) {
    const isReleased = payout.status === 'released';
    const monthKey = toUtcMonthKey(payout.updatedAtIso || payout.createdAtIso);
    if (!monthKey) continue;
    const existing = sprintById.get(payout.sprintId);
    if (!existing) {
      sprintById.set(payout.sprintId, {
        sprintId: payout.sprintId,
        monthKey,
        isCompleted: isReleased,
        velocityPct: isReleased ? 100 : 33,
      });
    } else if (isReleased) {
      existing.isCompleted = true;
      existing.velocityPct = 100;
    }
  }

  for (const info of sprintById.values()) {
    const bucket = bucketByKey.get(info.monthKey);
    if (!bucket) continue;
    bucket.sprintIds.add(info.sprintId);
    if (info.isCompleted) {
      bucket.completedSprintIds.add(info.sprintId);
    }
    bucket.velocityValues.push(info.velocityPct);
  }

  const sprintsWithExplicitSession = new Set<string>();
  for (const sess of mentorshipSessions) {
    const monthKey = toUtcMonthKey(sess.attendedAtIso || sess.updatedAtIso || sess.createdAtIso);
    if (!monthKey) continue;
    const bucket = bucketByKey.get(monthKey);
    if (!bucket) continue;
    if (sess.status === 'attended') {
      bucket.sessionsAttended += 1;
      bucket.mentorshipMinutes += Number(sess.durationMinutes || 0);
      sprintsWithExplicitSession.add(`${monthKey}::${sess.sprintId}`);
    } else {
      bucket.scheduledSessions += 1;
    }
  }

  // Count async practitioner threads in a month when scope is 'all' and no explicit session was logged for that sprint in that month
  if (sessionFilter === 'all') {
    const countedThreadMonths = new Set<string>();
    for (const msg of mentorMessages) {
      if (msg.sender !== 'practitioner') continue;
      const monthKey = toUtcMonthKey(msg.createdAtIso || msg.updatedAtIso);
      if (!monthKey) continue;
      const composite = `${monthKey}::${msg.sprintId}`;
      if (sprintsWithExplicitSession.has(composite) || countedThreadMonths.has(composite)) {
        continue;
      }
      const bucket = bucketByKey.get(monthKey);
      if (!bucket) continue;
      countedThreadMonths.add(composite);
      bucket.sessionsAttended += 1;
      bucket.mentorshipMinutes += 15;
    }
  }

  const months: SixMonthCorrelationPoint[] = buckets.map((b) => {
    const totalSprints = b.sprintIds.size;
    const completedSprints = b.completedSprintIds.size;
    const completionSuccessRatePct =
      totalSprints > 0 ? Math.round((completedSprints / totalSprints) * 100) : 0;
    const milestoneVelocityPct =
      b.velocityValues.length > 0
        ? Math.round(
            b.velocityValues.reduce((sum, v) => sum + v, 0) / b.velocityValues.length
          )
        : 0;
    const hasActivity =
      b.sessionsAttended > 0 || b.scheduledSessions > 0 || totalSprints > 0;

    return {
      monthKey: b.monthKey,
      monthLabel: b.monthLabel,
      sessionsAttended: b.sessionsAttended,
      scheduledSessions: b.scheduledSessions,
      mentorshipMinutes: b.mentorshipMinutes,
      totalSprints,
      completedSprints,
      completionSuccessRatePct,
      milestoneVelocityPct,
      hasActivity,
    };
  });

  const activeMonths = months.filter((m) => m.hasActivity);
  const totalSessions6M = months.reduce((sum, m) => sum + m.sessionsAttended, 0);
  const totalSprints6M = months.reduce((sum, m) => sum + m.totalSprints, 0);
  const totalCompletedSprints6M = months.reduce((sum, m) => sum + m.completedSprints, 0);

  const overallSuccessRatePct =
    totalSprints6M > 0
      ? Math.round((totalCompletedSprints6M / totalSprints6M) * 100)
      : 0;

  const monthsWithSprints = months.filter((m) => m.totalSprints > 0);
  const avgMilestoneVelocityPct =
    monthsWithSprints.length > 0
      ? Math.round(
          monthsWithSprints.reduce((sum, m) => sum + m.milestoneVelocityPct, 0) /
            monthsWithSprints.length
        )
      : 0;

  const mentoredMonths = monthsWithSprints.filter((m) => m.sessionsAttended > 0);
  const unmentoredMonths = monthsWithSprints.filter((m) => m.sessionsAttended === 0);

  let correlationSummary =
    'Log QA sessions alongside active sprints to track 6-month mentorship-to-completion correlation.';

  if (mentoredMonths.length > 0 && unmentoredMonths.length > 0) {
    const mentoredRate = Math.round(
      mentoredMonths.reduce((s, m) => s + m.completionSuccessRatePct, 0) / mentoredMonths.length
    );
    const unmentoredRate = Math.round(
      unmentoredMonths.reduce((s, m) => s + m.completionSuccessRatePct, 0) / unmentoredMonths.length
    );
    const delta = mentoredRate - unmentoredRate;
    correlationSummary =
      delta >= 0
        ? `6M Trend: Months with QA sessions average ${mentoredRate}% sprint completion vs. ${unmentoredRate}% without (+${delta} pts).`
        : `6M Trend: ${totalSessions6M} QA session${totalSessions6M === 1 ? '' : 's'} logged across ${activeMonths.length} active month${activeMonths.length === 1 ? '' : 's'} (${overallSuccessRatePct}% completion rate).`;
  } else if (totalSessions6M > 0 && totalSprints6M > 0) {
    correlationSummary = `6M Trend: ${totalSessions6M} QA session${totalSessions6M === 1 ? '' : 's'} paired with ${avgMilestoneVelocityPct}% average milestone velocity and ${overallSuccessRatePct}% sprint completion.`;
  }

  return {
    months,
    totalSessions6M,
    totalCompletedSprints6M,
    totalSprints6M,
    overallSuccessRatePct,
    avgMilestoneVelocityPct,
    correlationSummary,
    hasAnyActivity: activeMonths.length > 0,
  };
}

/**
 * Aggregates sprint outcomes and attended mentorship sessions by specialist mentoring track
 * so practitioners can compare which tracks drive the highest mentor-led sprint success rates.
 */
export function buildMentorshipTrackImpactMetrics(
  input: BuildMentorshipVelocityInput
): MentorshipTrackImpactMetrics {
  const {
    contributions = [],
    mentorMessages = [],
    mentorshipSessions = [],
    payouts = [],
    sprintMilestonesByBrief = {},
    mentorPairings = [],
    sessionFilter = 'all',
  } = input;

  const totalStepCount = Math.max(1, SPRINT_MILESTONE_STEPS.length);

  interface SprintTrackRecord {
    sprintId: string;
    domain: string;
    status: 'completed' | 'in-progress';
    milestoneVelocityPct: number;
  }

  const bySprint = new Map<string, SprintTrackRecord>();

  for (const contrib of contributions) {
    const isCompleted = contrib.status === 'completed';
    const doneKeys = normalizeSprintMilestones(
      contrib.milestonesDone ?? sprintMilestonesByBrief[contrib.briefId],
      isCompleted
    );
    bySprint.set(contrib.briefId, {
      sprintId: contrib.briefId,
      domain: contrib.domain || 'Green Energy',
      status: isCompleted ? 'completed' : 'in-progress',
      milestoneVelocityPct: Math.round((doneKeys.length / totalStepCount) * 100),
    });
  }

  for (const payout of payouts) {
    const isReleased = payout.status === 'released';
    const existing = bySprint.get(payout.sprintId);
    if (!existing) {
      const assignedMentor = getAssignedMentorForSprint(payout.sprintId);
      bySprint.set(payout.sprintId, {
        sprintId: payout.sprintId,
        domain: assignedMentor.domain,
        status: isReleased ? 'completed' : 'in-progress',
        milestoneVelocityPct: isReleased ? 100 : 33,
      });
    } else if (isReleased) {
      existing.status = 'completed';
      existing.milestoneVelocityPct = 100;
    }
  }

  for (const sess of mentorshipSessions) {
    if (!bySprint.has(sess.sprintId)) {
      const assignedMentor = getAssignedMentorForSprint(sess.sprintId);
      bySprint.set(sess.sprintId, {
        sprintId: sess.sprintId,
        domain: assignedMentor.domain,
        status: 'in-progress',
        milestoneVelocityPct: 0,
      });
    }
  }

  const attendedSessionsBySprint = new Map<string, MentorshipSession[]>();
  for (const sess of mentorshipSessions) {
    if (sess.status !== 'attended') continue;
    const list = attendedSessionsBySprint.get(sess.sprintId) ?? [];
    list.push(sess);
    attendedSessionsBySprint.set(sess.sprintId, list);
  }

  const practitionerMsgsBySprint = new Map<string, number>();
  for (const msg of mentorMessages) {
    if (msg.sender !== 'practitioner') continue;
    practitionerMsgsBySprint.set(
      msg.sprintId,
      (practitionerMsgsBySprint.get(msg.sprintId) ?? 0) + 1
    );
  }

  const pairingCountByTrack = new Map<string, number>();
  for (const pairing of mentorPairings) {
    const resolvedTrack =
      MENTORSHIP_TRACKS.find((t) => t.id === pairing.trackId) ??
      getMentorshipTrackForDomain(pairing.domain);
    pairingCountByTrack.set(
      resolvedTrack.id,
      (pairingCountByTrack.get(resolvedTrack.id) ?? 0) + 1
    );
  }

  const trackBuckets = new Map<
    string,
    {
      totalSprints: number;
      mentoredSprints: number;
      completedMentoredSprints: number;
      sessionsAttended: number;
      mentorshipMinutes: number;
      mentoredVelocities: number[];
      allVelocities: number[];
    }
  >();

  for (const track of MENTORSHIP_TRACKS) {
    trackBuckets.set(track.id, {
      totalSprints: 0,
      mentoredSprints: 0,
      completedMentoredSprints: 0,
      sessionsAttended: 0,
      mentorshipMinutes: 0,
      mentoredVelocities: [],
      allVelocities: [],
    });
  }

  for (const sprintRec of bySprint.values()) {
    const inferredMentor = getAssignedMentorForSprint(sprintRec.sprintId, sprintRec.domain);
    const track = getMentorshipTrackForDomain(sprintRec.domain || inferredMentor.domain);
    const bucket = trackBuckets.get(track.id)!;

    const attendedList = attendedSessionsBySprint.get(sprintRec.sprintId) ?? [];
    const asyncMsgs =
      sessionFilter === 'mentor-led'
        ? 0
        : (practitionerMsgsBySprint.get(sprintRec.sprintId) ?? 0);
    const sessionCount =
      attendedList.length > 0 ? attendedList.length : asyncMsgs > 0 ? 1 : 0;
    const loggedMinutes = attendedList.reduce((acc, s) => acc + s.durationMinutes, 0);
    const effectiveMinutes =
      loggedMinutes > 0 ? loggedMinutes : sessionCount > 0 ? 15 : 0;

    bucket.totalSprints += 1;
    bucket.allVelocities.push(sprintRec.milestoneVelocityPct);
    bucket.sessionsAttended += sessionCount;
    bucket.mentorshipMinutes += effectiveMinutes;

    if (sessionCount > 0) {
      bucket.mentoredSprints += 1;
      bucket.mentoredVelocities.push(sprintRec.milestoneVelocityPct);
      if (sprintRec.status === 'completed') {
        bucket.completedMentoredSprints += 1;
      }
    }
  }

  const tracks: MentorshipTrackImpactPoint[] = MENTORSHIP_TRACKS.map((track) => {
    const bucket = trackBuckets.get(track.id)!;
    const mentor = getAssignedMentorForSprint(track.domain, track.domain);
    const mentorLedSuccessRatePct =
      bucket.mentoredSprints > 0
        ? Math.round((bucket.completedMentoredSprints / bucket.mentoredSprints) * 100)
        : 0;
    const velocitySource =
      bucket.mentoredVelocities.length > 0
        ? bucket.mentoredVelocities
        : bucket.allVelocities;
    const avgMilestoneVelocityPct =
      velocitySource.length > 0
        ? Math.round(
            velocitySource.reduce((sum, v) => sum + v, 0) / velocitySource.length
          )
        : 0;

    return {
      trackId: track.id,
      trackTitle: track.title,
      shortTrackLabel: track.domain,
      domain: track.domain,
      mentorName: mentor.name,
      totalSprints: bucket.totalSprints,
      mentoredSprints: bucket.mentoredSprints,
      completedMentoredSprints: bucket.completedMentoredSprints,
      sessionsAttended: bucket.sessionsAttended,
      mentorshipMinutes: bucket.mentorshipMinutes,
      mentorLedSuccessRatePct,
      avgMilestoneVelocityPct,
      pairingRequestsCount: pairingCountByTrack.get(track.id) ?? 0,
    };
  });

  const totalMentoredSprints = tracks.reduce((sum, t) => sum + t.mentoredSprints, 0);
  const totalCompletedMentoredSprints = tracks.reduce(
    (sum, t) => sum + t.completedMentoredSprints,
    0
  );
  const overallMentorLedSuccessRatePct =
    totalMentoredSprints > 0
      ? Math.round((totalCompletedMentoredSprints / totalMentoredSprints) * 100)
      : 0;

  const activeTracks = tracks.filter(
    (t) => t.mentoredSprints > 0 || t.sessionsAttended > 0 || t.totalSprints > 0
  );
  const hasAnyTrackActivity = activeTracks.length > 0;

  const mentoredTracks = tracks.filter((t) => t.mentoredSprints > 0 || t.sessionsAttended > 0);
  const topImpactTrack =
    mentoredTracks.length > 0
      ? [...mentoredTracks].sort(
          (a, b) =>
            b.mentorLedSuccessRatePct - a.mentorLedSuccessRatePct ||
            b.completedMentoredSprints - a.completedMentoredSprints ||
            b.avgMilestoneVelocityPct - a.avgMilestoneVelocityPct ||
            b.sessionsAttended - a.sessionsAttended
        )[0]
      : null;

  const summaryText = topImpactTrack
    ? `Top Track: ${topImpactTrack.domain} leads at ${topImpactTrack.mentorLedSuccessRatePct}% mentor-led completion (${topImpactTrack.completedMentoredSprints}/${topImpactTrack.mentoredSprints} mentored sprints · ${topImpactTrack.sessionsAttended} QA sessions).`
    : 'Attend mentor QA sessions across domain tracks to compare which mentoring tracks drive the highest sprint completion rate.';

  return {
    tracks,
    topImpactTrack,
    totalMentoredSprints,
    totalCompletedMentoredSprints,
    overallMentorLedSuccessRatePct,
    hasAnyTrackActivity,
    summaryText,
  };
}

type ChartViewMode =
  | 'session-frequency'
  | 'track-success-rate'
  | 'per-sprint'
  | 'cumulative-ratio';

interface MentorshipTooltipPayloadItem {
  payload?: MentorshipVelocityPoint;
}

interface SixMonthTooltipPayloadItem {
  payload?: SixMonthCorrelationPoint;
}

interface TrackImpactTooltipPayloadItem {
  payload?: MentorshipTrackImpactPoint;
}

const SixMonthCorrelationTooltip: React.FC<{
  active?: boolean;
  payload?: SixMonthTooltipPayloadItem[];
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      data-testid="mentorship-6m-tooltip"
      className="max-w-xs rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 shadow-lg space-y-2 text-xs"
    >
      <div>
        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
          {point.monthLabel}
        </p>
        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] mt-0.5 font-mono-tabular tabular-nums">
          {point.completedSprints}/{point.totalSprints} sprints completed · {point.mentorshipMinutes}m QA
        </p>
      </div>

      <dl className="space-y-1 pt-1.5 border-t border-[#E8E3DB] dark:border-[#2C3037] font-mono-tabular tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#575B62] dark:text-[#A3A7AE]">Sessions Attended</dt>
          <dd className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
            {point.sessionsAttended}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#575B62] dark:text-[#A3A7AE]">Milestone Velocity</dt>
          <dd className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
            {point.milestoneVelocityPct}%
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#575B62] dark:text-[#A3A7AE]">Completion Success</dt>
          <dd className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            {point.completionSuccessRatePct}%
          </dd>
        </div>
      </dl>
    </div>
  );
};

const TrackImpactTooltip: React.FC<{
  active?: boolean;
  payload?: TrackImpactTooltipPayloadItem[];
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      data-testid="mentorship-track-tooltip"
      className="max-w-xs rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 shadow-lg space-y-2 text-xs"
    >
      <div>
        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
          {point.trackTitle}
        </p>
        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
          {point.domain} · Mentor: {point.mentorName}
        </p>
      </div>

      <dl className="space-y-1 pt-1.5 border-t border-[#E8E3DB] dark:border-[#2C3037] font-mono-tabular tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#575B62] dark:text-[#A3A7AE]">Mentor-Led Success Rate</dt>
          <dd className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
            {point.mentorLedSuccessRatePct}%
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#575B62] dark:text-[#A3A7AE]">Avg Milestone Velocity</dt>
          <dd className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
            {point.avgMilestoneVelocityPct}%
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#575B62] dark:text-[#A3A7AE]">Mentored Sprints</dt>
          <dd className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            {point.completedMentoredSprints}/{point.mentoredSprints} completed
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#575B62] dark:text-[#A3A7AE]">QA Sessions Attended</dt>
          <dd className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
            {point.sessionsAttended} ({point.mentorshipMinutes}m)
          </dd>
        </div>
      </dl>
    </div>
  );
};

const MentorshipVelocityTooltip: React.FC<{
  active?: boolean;
  payload?: MentorshipTooltipPayloadItem[];
  viewMode: 'per-sprint' | 'cumulative-ratio';
}> = ({ active, payload, viewMode }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      data-testid="mentorship-chart-tooltip"
      className="max-w-xs rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 shadow-lg space-y-2 text-xs"
    >
      <div>
        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
          {point.sprintTitle}
        </p>
        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
          {point.dateLabel} · Mentor: {point.mentorName}
        </p>
      </div>

      <dl className="space-y-1 pt-1.5 border-t border-[#E8E3DB] dark:border-[#2C3037] font-mono-tabular tabular-nums">
        {viewMode === 'per-sprint' ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Sessions Attended</dt>
              <dd className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                {point.sessionsAttended}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Milestone Velocity</dt>
              <dd className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                {point.milestoneVelocityPct}%
              </dd>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Cumulative Sessions</dt>
              <dd className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                {point.sessionsCumulative}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Sprints Completed</dt>
              <dd className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                {point.sprintsCompletedCumulative}
              </dd>
            </div>
          </>
        )}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#575B62] dark:text-[#A3A7AE]">Sprint Status</dt>
          <dd className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
            {point.status === 'completed' ? 'Completed' : 'In Progress'}
          </dd>
        </div>
      </dl>

      <p className="pt-1.5 border-t border-[#E8E3DB] dark:border-[#2C3037] text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
        {point.latestTakeaway}
      </p>
    </div>
  );
};

interface MentorshipImpactChartProps {
  contributions: BriefSubmission[];
  mentorMessages: MentorMessage[];
  mentorshipSessions: MentorshipSession[];
  payouts: ContractPayout[];
  sprintMilestonesByBrief?: Record<string, SprintMilestoneKey[]>;
  mentorPairings?: MentorPairingRequest[];
  onOpenMentorThread: (
    sprintId: string,
    sprintTitle: string,
    domain: string,
    options?: { contextNote?: string; initialPanel?: 'chat' | 'session' }
  ) => void;
  onMarkSessionAttended?: (sessionId: string) => void;
}

export const MentorshipImpactChart: React.FC<MentorshipImpactChartProps> = ({
  contributions,
  mentorMessages,
  mentorshipSessions,
  payouts,
  sprintMilestonesByBrief = {},
  mentorPairings = [],
  onOpenMentorThread,
  onMarkSessionAttended,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('session-frequency');
  const [sessionFilter, setSessionFilter] = useState<MentorshipSessionFilter>('all');

  const metrics = useMemo(
    () =>
      buildMentorshipVelocityMetrics({
        contributions,
        mentorMessages,
        mentorshipSessions,
        payouts,
        sprintMilestonesByBrief,
        sessionFilter,
      }),
    [
      contributions,
      mentorMessages,
      mentorshipSessions,
      payouts,
      sprintMilestonesByBrief,
      sessionFilter,
    ]
  );

  const sixMonthMetrics = useMemo(
    () =>
      buildSixMonthMentorshipCorrelation({
        contributions,
        mentorMessages,
        mentorshipSessions,
        payouts,
        sprintMilestonesByBrief,
        sessionFilter,
      }),
    [
      contributions,
      mentorMessages,
      mentorshipSessions,
      payouts,
      sprintMilestonesByBrief,
      sessionFilter,
    ]
  );

  const trackImpactMetrics = useMemo(
    () =>
      buildMentorshipTrackImpactMetrics({
        contributions,
        mentorMessages,
        mentorshipSessions,
        payouts,
        sprintMilestonesByBrief,
        mentorPairings,
        sessionFilter,
      }),
    [
      contributions,
      mentorMessages,
      mentorshipSessions,
      payouts,
      sprintMilestonesByBrief,
      mentorPairings,
      sessionFilter,
    ]
  );

  const defaultTargetSprint = useMemo(() => {
    const active = contributions.find((c) => c.status === 'in-progress');
    return active ?? contributions[0] ?? null;
  }, [contributions]);

  const recentSessions = useMemo(
    () =>
      [...mentorshipSessions]
        .filter((s) => (sessionFilter === 'mentor-led' ? s.status === 'attended' : true))
        .sort((a, b) => b.attendedAtIso.localeCompare(a.attendedAtIso))
        .slice(0, 4),
    [mentorshipSessions, sessionFilter]
  );

  const handleQuickLogSession = () => {
    const sprintId = defaultTargetSprint?.briefId ?? 'sprint-solar-coldchain-01';
    const sprintTitle =
      defaultTargetSprint?.briefTitle ?? '48V Cold-Storage & Solar Microgrid Diagnostics Sprint';
    const domain = defaultTargetSprint?.domain ?? 'Green Energy';
    onOpenMentorThread(sprintId, sprintTitle, domain, {
      initialPanel: 'session',
      contextNote: `Mentorship velocity ratio: ${metrics.sessionToSprintRatioLabel}`,
    });
  };

  const hasChartData =
    viewMode === 'session-frequency'
      ? sixMonthMetrics.hasAnyActivity
      : viewMode === 'track-success-rate'
        ? trackImpactMetrics.hasAnyTrackActivity
        : metrics.points.length > 0;

  return (
    <section
      aria-labelledby="mentorship-velocity-heading"
      data-testid="mentorship-velocity-section"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
            Mentorship &amp; Sprint Velocity
          </p>
          <h2
            id="mentorship-velocity-heading"
            className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Mentorship Sessions Attended vs. Sprint Completion &amp; Velocity
          </h2>
          <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
            {viewMode === 'track-success-rate'
              ? 'Compares mentor-led sprint completion success rates and milestone velocity across specialist domain tracks.'
              : 'Plots 6-month mentorship session frequency against milestone velocity and sprint completion success rates.'}
            {sessionFilter === 'mentor-led'
              ? ' Isolated to attended mentor-led QA sessions only.'
              : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <div
            role="group"
            aria-label="Filter mentorship session scope"
            data-testid="mentorship-session-scope-filter"
            className="inline-flex flex-wrap items-center p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
          >
            <button
              type="button"
              aria-pressed={sessionFilter === 'all'}
              data-testid="mentorship-filter-all-sessions"
              onClick={() => setSessionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                sessionFilter === 'all'
                  ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              All Sessions
            </button>
            <button
              type="button"
              aria-pressed={sessionFilter === 'mentor-led'}
              data-testid="mentorship-filter-mentor-led"
              onClick={() => setSessionFilter('mentor-led')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                sessionFilter === 'mentor-led'
                  ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Mentor-Led Sessions Only
            </button>
          </div>
          <div
            role="tablist"
            aria-label="Mentorship velocity chart view"
            className="inline-flex flex-wrap items-center p-1 rounded-xl bg-[#F2EEE8] dark:bg-[#121315]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'session-frequency'}
              data-testid="mentorship-view-6m"
              onClick={() => setViewMode('session-frequency')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'session-frequency'
                  ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Session Frequency
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'track-success-rate'}
              data-testid="mentorship-view-track-success"
              onClick={() => setViewMode('track-success-rate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'track-success-rate'
                  ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Mentor-Led Sprint Success Rate
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'per-sprint'}
              data-testid="mentorship-view-per-sprint"
              onClick={() => setViewMode('per-sprint')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'per-sprint'
                  ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Per-Sprint Velocity
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'cumulative-ratio'}
              data-testid="mentorship-view-cumulative"
              onClick={() => setViewMode('cumulative-ratio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'cumulative-ratio'
                  ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Cumulative Ratio
            </button>
          </div>

          <button
            type="button"
            data-testid="pulse-log-mentorship-session-btn"
            onClick={handleQuickLogSession}
            className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log QA Session</span>
          </button>
        </div>
      </div>

      {/* 4-Column Tabular KPI Strip (Single-Elevation Hairline Grid) */}
      <dl
        data-testid="mentorship-ratio-kpis"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]"
      >
        <div className="space-y-1">
          <dt className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Sessions : Completed Ratio
          </dt>
          <dd
            data-testid="mentorship-ratio-value"
            className="font-mono-tabular tabular-nums text-2xl sm:text-3xl font-semibold text-[#146C53] dark:text-[#2EB88B]"
          >
            {metrics.sessionToSprintRatioLabel}
          </dd>
          <p className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
            {metrics.sessionsAttendedCount} attended · {metrics.completedSprintsCount} completed
          </p>
        </div>

        <div className="space-y-1 lg:border-s lg:border-[#E8E3DB] lg:dark:border-[#2C3037] lg:ps-4">
          <dt className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            6M Sprint Success Rate
          </dt>
          <dd
            data-testid="mentorship-coverage-value"
            className="font-mono-tabular tabular-nums text-2xl sm:text-3xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            {sixMonthMetrics.overallSuccessRatePct}%
          </dd>
          <p className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
            {sixMonthMetrics.totalCompletedSprints6M} of {sixMonthMetrics.totalSprints6M} sprints · {metrics.mentoredSprintCoveragePct}% mentored
          </p>
        </div>

        <div className="space-y-1 lg:border-s lg:border-[#E8E3DB] lg:dark:border-[#2C3037] lg:ps-4">
          <dt className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Mentored Milestone Velocity
          </dt>
          <dd
            data-testid="mentorship-velocity-avg"
            className="font-mono-tabular tabular-nums text-2xl sm:text-3xl font-semibold text-[#C4622D] dark:text-[#E07B46]"
          >
            {metrics.mentoredAvgVelocityPct}%
          </dd>
          <p className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
            {metrics.velocityLiftPct !== null
              ? `${metrics.velocityLiftPct >= 0 ? '+' : ''}${metrics.velocityLiftPct}% vs. unmentored`
              : `${metrics.totalMentorshipMinutes}m QA guidance logged`}
          </p>
        </div>

        <div className="space-y-1 lg:border-s lg:border-[#E8E3DB] lg:dark:border-[#2C3037] lg:ps-4">
          <dt className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Pod QA Time &amp; Queue
          </dt>
          <dd className="font-mono-tabular tabular-nums text-2xl sm:text-3xl font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            {metrics.totalMentorshipMinutes}m
          </dd>
          <p className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
            {metrics.scheduledSessionsCount > 0
              ? `${metrics.scheduledSessionsCount} upcoming session${metrics.scheduledSessionsCount === 1 ? '' : 's'}`
              : 'All booked QA sessions attended'}
          </p>
        </div>
      </dl>

      {/* Chart Area or Empty State */}
      {!hasChartData ? (
        <div
          data-testid="mentorship-chart-empty"
          className="rounded-xl border border-dashed border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-8 text-center space-y-3"
        >
          <Users className="w-7 h-7 mx-auto text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
          <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
            No sprint mentorship metrics recorded yet
          </p>
          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] max-w-md mx-auto">
            Log a QA check-in session or message your pod mentor on any sprint to measure how mentorship accelerates milestone completion.
          </p>
          <button
            type="button"
            onClick={handleQuickLogSession}
            className="min-h-[38px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log First QA Session</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#146C53] dark:bg-[#2EB88B]" />
                <span>
                  {viewMode === 'session-frequency'
                    ? 'Session Frequency (Attended)'
                    : viewMode === 'track-success-rate'
                      ? 'Mentor-Led Success Rate (%)'
                      : viewMode === 'per-sprint'
                        ? 'Mentorship Sessions Attended'
                        : 'Cumulative Sessions Attended'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C4622D] dark:bg-[#E07B46]" />
                <span>
                  {viewMode === 'cumulative-ratio'
                    ? 'Cumulative Sprints Completed'
                    : 'Milestone Velocity (%)'}
                </span>
              </span>
              {(viewMode === 'session-frequency' || viewMode === 'track-success-rate') && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-[#17191C] dark:bg-[#F4F2EE]" />
                  <span>
                    {viewMode === 'track-success-rate'
                      ? 'QA Sessions Attended'
                      : 'Completion Success Rate (%)'}
                  </span>
                </span>
              )}
            </div>

            {viewMode === 'session-frequency' ? (
              <span
                data-testid="mentorship-6m-correlation-summary"
                className="inline-flex items-center gap-1 font-mono-tabular tabular-nums font-medium text-[#146C53] dark:text-[#2EB88B]"
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{sixMonthMetrics.correlationSummary}</span>
              </span>
            ) : viewMode === 'track-success-rate' ? (
              <span
                data-testid="mentorship-track-success-summary"
                className="inline-flex items-center gap-1 font-mono-tabular tabular-nums font-medium text-[#146C53] dark:text-[#2EB88B]"
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{trackImpactMetrics.summaryText}</span>
              </span>
            ) : (
              metrics.velocityLiftPct !== null && (
                <span className="inline-flex items-center gap-1 font-mono-tabular tabular-nums font-medium text-[#146C53] dark:text-[#2EB88B]">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Mentored sprints avg {metrics.mentoredAvgVelocityPct}% vs.{' '}
                    {metrics.unmentoredAvgVelocityPct}% unmentored
                  </span>
                </span>
              )
            )}
          </div>

          <div
            data-testid="mentorship-velocity-chart-container"
            className="h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'session-frequency' ? (
                <ComposedChart
                  data={sixMonthMetrics.months}
                  margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(138, 132, 122, 0.22)"
                  />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={{ stroke: 'rgba(138, 132, 122, 0.25)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<SixMonthCorrelationTooltip />} />
                  <Bar
                    yAxisId="left"
                    dataKey="sessionsAttended"
                    name="Sessions Attended"
                    fill="#146C53"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="milestoneVelocityPct"
                    name="Milestone Velocity (%)"
                    stroke="#C4622D"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#C4622D', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="completionSuccessRatePct"
                    name="Completion Success Rate (%)"
                    stroke="#17191C"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#17191C', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              ) : viewMode === 'track-success-rate' ? (
                <ComposedChart
                  data={trackImpactMetrics.tracks}
                  margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(138, 132, 122, 0.22)"
                  />
                  <XAxis
                    dataKey="shortTrackLabel"
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={{ stroke: 'rgba(138, 132, 122, 0.25)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TrackImpactTooltip />} />
                  <Bar
                    yAxisId="left"
                    dataKey="mentorLedSuccessRatePct"
                    name="Mentor-Led Success Rate (%)"
                    fill="#146C53"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgMilestoneVelocityPct"
                    name="Avg Milestone Velocity (%)"
                    stroke="#C4622D"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#C4622D', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sessionsAttended"
                    name="QA Sessions Attended"
                    stroke="#17191C"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#17191C', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart
                  data={metrics.points}
                  margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(138, 132, 122, 0.22)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={{ stroke: 'rgba(138, 132, 122, 0.25)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    domain={viewMode === 'per-sprint' ? [0, 100] : ['auto', 'auto']}
                    unit={viewMode === 'per-sprint' ? '%' : ''}
                    tick={{ fontSize: 11, fill: '#8A847A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<MentorshipVelocityTooltip viewMode={viewMode} />}
                  />
                  {viewMode === 'per-sprint' ? (
                    <>
                      <Bar
                        yAxisId="left"
                        dataKey="sessionsAttended"
                        name="Sessions Attended"
                        fill="#146C53"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="milestoneVelocityPct"
                        name="Milestone Velocity"
                        stroke="#C4622D"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#C4622D', strokeWidth: 2, stroke: '#FFFFFF' }}
                        activeDot={{ r: 6 }}
                      />
                    </>
                  ) : (
                    <>
                      <Bar
                        yAxisId="left"
                        dataKey="sessionsCumulative"
                        name="Cumulative Sessions"
                        fill="#146C53"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="sprintsCompletedCumulative"
                        name="Sprints Completed"
                        stroke="#C4622D"
                        fill="#C4622D"
                        fillOpacity={0.14}
                        strokeWidth={2.5}
                      />
                    </>
                  )}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          {viewMode === 'track-success-rate' && (
            <div
              data-testid="mentorship-track-breakdown-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2"
            >
              {trackImpactMetrics.tracks.map((track) => {
                const isTop =
                  trackImpactMetrics.topImpactTrack?.trackId === track.trackId &&
                  track.sessionsAttended > 0;
                return (
                  <div
                    key={track.trackId}
                    data-testid={`mentorship-track-card-${track.trackId}`}
                    className={`rounded-xl border p-3.5 space-y-1.5 ${
                      isTop
                        ? 'bg-[#E7F3EE]/55 dark:bg-[#142B24]/55 border-[#146C53]/40 dark:border-[#2EB88B]/40'
                        : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {track.domain}
                      </span>
                      <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                        {isTop ? 'Top Impact' : `${track.sessionsAttended} QA`}
                      </span>
                    </div>
                    <p className="font-mono-tabular tabular-nums text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {track.mentorLedSuccessRatePct}%{' '}
                      <span className="text-xs font-normal text-[#575B62] dark:text-[#A3A7AE]">
                        success
                      </span>
                    </p>
                    <p className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                      {track.completedMentoredSprints}/{track.mentoredSprints} mentored sprints ·{' '}
                      {track.avgMilestoneVelocityPct}% velocity
                    </p>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] truncate">
                      {track.mentorName}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Mentorship Sessions Log */}
      {recentSessions.length > 0 && (
        <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
              Recent Pod QA &amp; Mentoring Sessions
            </h3>
            <span className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
              {mentorshipSessions.length} total logged
            </span>
          </div>

          <div className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315]">
            {recentSessions.map((sess) => {
              const dateText = new Date(sess.attendedAtIso).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={sess.id}
                  data-testid={`mentorship-session-row-${sess.id}`}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`font-semibold ${
                          sess.status === 'attended'
                            ? 'text-[#146C53] dark:text-[#2EB88B]'
                            : 'text-[#C4622D] dark:text-[#E07B46]'
                        }`}
                      >
                        {sess.status === 'attended' ? 'Attended' : 'Scheduled'}
                      </span>
                      <span className="text-[#8A847A]" aria-hidden="true">·</span>
                      <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        {MENTORSHIP_FOCUS_LABELS[sess.focusTopic]}
                      </span>
                      <span className="text-[#8A847A]" aria-hidden="true">·</span>
                      <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                        {sess.durationMinutes}m · {dateText}
                      </span>
                    </div>
                    <p className="text-xs text-[#17191C] dark:text-[#F4F2EE] truncate">
                      {sess.sprintTitle} · <span className="text-[#575B62] dark:text-[#A3A7AE]">{sess.mentorName}</span>
                    </p>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] line-clamp-1">
                      {sess.takeawayNote}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sess.status === 'scheduled' && onMarkSessionAttended && (
                      <button
                        type="button"
                        data-testid={`mark-session-attended-${sess.id}`}
                        onClick={() => onMarkSessionAttended(sess.id)}
                        className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>Mark Attended</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onOpenMentorThread(sess.sprintId, sess.sprintTitle, 'Green Energy', {
                          initialPanel: 'chat',
                        })
                      }
                      className="min-h-[32px] px-2.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[11px] font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                      <span>Thread</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
