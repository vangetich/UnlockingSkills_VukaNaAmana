import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';
import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  PeerEndorsement,
  SkillCapability,
  SprintMilestoneKey,
  WorkReadyVault,
} from '../types/kora';
import {
  SPRINT_MILESTONE_STEPS,
  normalizeSprintMilestones,
} from '../utils/talentEngine';

export type ActivityEventKind = 'sprint' | 'capability' | 'endorsement' | 'payout';

export interface RecentActivityItem {
  id: string;
  kind: ActivityEventKind;
  kindLabel: string;
  stageTag: string;
  title: string;
  description: string;
  timestamp: string;
  highlightMeta?: string;
  actionTarget?: 'verify' | 'unlock' | 'solve';
}

export interface BuildRecentActivityInput {
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
  vault: WorkReadyVault;
  endorsements: PeerEndorsement[];
  payouts: ContractPayout[];
  sprintMilestonesByBrief?: Record<string, SprintMilestoneKey[]>;
  maxItems?: number;
}

export interface VirtualWindowParams {
  itemCount: number;
  scrollTop: number;
  viewportHeight: number;
  estimatedItemHeight: number;
  overscan?: number;
  getItemHeight?: (index: number) => number;
}

export interface VirtualRowPlacement {
  index: number;
  offsetTop: number;
  height: number;
}

export interface VirtualWindowResult {
  startIndex: number;
  endIndex: number;
  firstVisibleIndex: number;
  lastVisibleIndex: number;
  totalHeight: number;
  visibleRows: VirtualRowPlacement[];
}

/**
 * Pure virtual list window calculator supporting variable measured row heights
 * and O(log N) binary search over prefix offsets so long activity histories
 * scroll smoothly at 60fps on desktop and mobile viewports.
 */
export function computeVirtualWindow(
  params: VirtualWindowParams
): VirtualWindowResult {
  const {
    itemCount,
    scrollTop,
    viewportHeight,
    estimatedItemHeight,
    overscan = 5,
    getItemHeight,
  } = params;

  if (itemCount <= 0) {
    return {
      startIndex: 0,
      endIndex: -1,
      firstVisibleIndex: 0,
      lastVisibleIndex: -1,
      totalHeight: 0,
      visibleRows: [],
    };
  }

  const safeEstimated = Math.max(48, estimatedItemHeight);
  const safeViewport = Math.max(safeEstimated, viewportHeight);
  const safeScrollTop = Math.max(0, scrollTop);
  const safeOverscan = Math.max(1, overscan);

  const offsets = new Float64Array(itemCount + 1);
  const heights = new Float64Array(itemCount);

  for (let i = 0; i < itemCount; i++) {
    const measured = getItemHeight ? getItemHeight(i) : safeEstimated;
    const h = Number.isFinite(measured) && measured > 0 ? measured : safeEstimated;
    heights[i] = h;
    offsets[i + 1] = offsets[i] + h;
  }

  const totalHeight = offsets[itemCount];
  const clampedScrollTop = Math.min(safeScrollTop, Math.max(0, totalHeight - 1));
  const viewportBottom = clampedScrollTop + safeViewport;

  // Binary search for first index whose bottom edge exceeds clampedScrollTop
  let lo = 0;
  let hi = itemCount - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (offsets[mid + 1] <= clampedScrollTop) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  const firstVisibleIndex = lo;

  // Binary search for last index whose top edge is within viewportBottom
  let endLo = firstVisibleIndex;
  let endHi = itemCount - 1;
  while (endLo < endHi) {
    const mid = (endLo + endHi + 1) >>> 1;
    if (offsets[mid] < viewportBottom) {
      endLo = mid;
    } else {
      endHi = mid - 1;
    }
  }
  const lastVisibleIndex = endLo;

  const startIndex = Math.max(0, firstVisibleIndex - safeOverscan);
  const endIndex = Math.min(itemCount - 1, lastVisibleIndex + safeOverscan);

  const visibleRows: VirtualRowPlacement[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleRows.push({
      index: i,
      offsetTop: offsets[i],
      height: heights[i],
    });
  }

  return {
    startIndex,
    endIndex,
    firstVisibleIndex,
    lastVisibleIndex,
    totalHeight,
    visibleRows,
  };
}

export function buildRecentActivityTimeline(
  input: BuildRecentActivityInput
): RecentActivityItem[] {
  const {
    capabilities = [],
    contributions = [],
    passport,
    vault,
    endorsements = [],
    payouts = [],
    sprintMilestonesByBrief = {},
    maxItems,
  } = input;

  const items: RecentActivityItem[] = [];

  // 1. Living Competency Passport issuance
  if (passport) {
    items.push({
      id: `act-passport-${passport.id}`,
      kind: 'capability',
      kindLabel: 'Capability Update',
      stageTag: '1. Verify',
      title: 'Living Competency Passport Issued',
      description: `${passport.studioDomain} · Verifiable ID ${passport.verifiableId ?? 'VNA-2026-8412'} · Tier ${passport.trustTier ?? 3} Trust`,
      timestamp: passport.generatedAtIso || new Date().toISOString(),
      highlightMeta: `Tier ${passport.trustTier ?? 3} Verified`,
      actionTarget: 'verify',
    });
  }

  // 2. Capability Updates (verified, master-endorsed, or logged)
  for (const cap of capabilities) {
    const isFieldVerified = cap.verificationStatus === 'field-verified';
    const isMasterEndorsed = cap.verificationStatus === 'master-endorsed';
    const statusText = isFieldVerified
      ? 'Field-Verified'
      : isMasterEndorsed
        ? 'Master-Endorsed'
        : 'Logged';

    items.push({
      id: `act-cap-${cap.id}`,
      kind: 'capability',
      kindLabel: 'Capability Update',
      stageTag: '1. Verify',
      title: isFieldVerified
        ? `${cap.title} — Verified`
        : isMasterEndorsed
          ? `${cap.title} — Master-Endorsed`
          : `Capability Updated: ${cap.title}`,
      description: `${cap.domain} · ${cap.proofSummary || 'Portfolio competency recorded in Verify'}`,
      timestamp: cap.updatedAtIso || cap.createdAtIso || new Date().toISOString(),
      highlightMeta: statusText,
      actionTarget: 'verify',
    });
  }

  // 3. Sprint Completions & Delivery Milestones
  for (const contrib of contributions) {
    const isCompleted = contrib.status === 'completed';
    const doneKeys = normalizeSprintMilestones(
      contrib.milestonesDone ?? sprintMilestonesByBrief[contrib.briefId],
      isCompleted
    );

    items.push({
      id: `act-contrib-${contrib.id}`,
      kind: 'sprint',
      kindLabel: isCompleted ? 'Sprint Completion' : 'Active Sprint',
      stageTag: '3. Solve',
      title: isCompleted
        ? `Sprint Completed: ${contrib.briefTitle || 'Solution Sprint'}`
        : `Sprint In Progress: ${contrib.briefTitle || 'Solution Sprint'}`,
      description: `${contrib.domain} · ${contrib.hoursLogged}h applied · ${doneKeys.length}/${SPRINT_MILESTONE_STEPS.length} milestones checked`,
      timestamp: contrib.updatedAtIso || contrib.createdAtIso || new Date().toISOString(),
      highlightMeta: isCompleted
        ? `+$${Number(contrib.payoutUsd || 0).toLocaleString()} USD`
        : `$${Number(contrib.payoutUsd || 0).toLocaleString()} Escrow`,
      actionTarget: 'solve',
    });

    for (const mKey of doneKeys) {
      const step = SPRINT_MILESTONE_STEPS.find((s) => s.key === mKey);
      const stepLabel = step ? step.label : mKey;
      items.push({
        id: `act-milestone-${contrib.id}-${mKey}`,
        kind: 'sprint',
        kindLabel: 'Sprint Milestone',
        stageTag: '3. Solve',
        title: `Milestone Verified: ${stepLabel}`,
        description: `${contrib.briefTitle || 'Solution Sprint'} · Pod delivery checkpoint logged`,
        timestamp: contrib.updatedAtIso || contrib.createdAtIso || new Date().toISOString(),
        highlightMeta: 'Checkpoint',
        actionTarget: 'solve',
      });
    }
  }

  // 4. Peer Endorsement Receipts (both verified receipts and requested receipts)
  for (const end of endorsements) {
    const isVerified = end.status === 'verified';
    items.push({
      id: `act-end-${end.id}`,
      kind: 'endorsement',
      kindLabel: 'Endorsement Receipt',
      stageTag: '1. Verify',
      title: isVerified
        ? `Endorsement Received: ${end.capabilityTitle}`
        : `Endorsement Requested: ${end.capabilityTitle}`,
      description: `${end.collaboratorName} (${end.organization || 'Peer Assessor'})${
        end.endorsementText ? ` — "${end.endorsementText}"` : ''
      }`,
      timestamp: end.updatedAtIso || end.createdAtIso || new Date().toISOString(),
      highlightMeta: isVerified ? 'Verified Receipt' : 'Awaiting Confirmation',
      actionTarget: 'verify',
    });
  }

  // 5. Work-Ready Vault & Stipend Payout Releases
  if (vault && (vault.identityCompleted || vault.contractCompleted || vault.payoutCompleted)) {
    items.push({
      id: `act-vault-${vault.ownerUid || vault.id}`,
      kind: 'payout',
      kindLabel: 'Compliance Clearance',
      stageTag: '2. Unlock',
      title: 'Work-Ready Compliance Vault Updated',
      description: `Pathway: ${vault.identityPathway || 'Compliant Identity'} · Payout rail: ${vault.payoutRail || 'Selected'}`,
      timestamp: vault.updatedAtIso || new Date().toISOString(),
      highlightMeta: 'Pre-Cleared',
      actionTarget: 'unlock',
    });
  }

  for (const payout of payouts) {
    const isReleased = payout.status === 'released';
    items.push({
      id: `act-payout-${payout.id}`,
      kind: 'payout',
      kindLabel: 'Stipend Disbursement',
      stageTag: '2. Unlock',
      title: isReleased
        ? `Stipend Released: ${payout.sprintTitle}`
        : `Escrow Held: ${payout.sprintTitle}`,
      description: `${payout.partnerOrg} · Rail: ${payout.payoutRail}`,
      timestamp: payout.updatedAtIso || payout.createdAtIso || new Date().toISOString(),
      highlightMeta: `$${Number(payout.amountUsd || 0).toLocaleString()} USD`,
      actionTarget: 'unlock',
    });
  }

  const sorted = items.sort((a, b) => {
    const tb = Date.parse(b.timestamp) || 0;
    const ta = Date.parse(a.timestamp) || 0;
    return tb - ta;
  });

  return typeof maxItems === 'number' && maxItems > 0
    ? sorted.slice(0, maxItems)
    : sorted;
}

interface RecentActivityFeedProps extends BuildRecentActivityInput {
  onGoToVerify?: () => void;
  onGoToUnlock?: () => void;
  onGoToSolve?: () => void;
}

type FeedFilter = 'all' | ActivityEventKind;

const DEFAULT_VIEWPORT_HEIGHT = 420;
const DESKTOP_ROW_ESTIMATE = 108;
const MOBILE_ROW_ESTIMATE = 148;
const MOBILE_BREAKPOINT_PX = 640;
const VIRTUAL_OVERSCAN = 5;

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  capabilities,
  contributions,
  passport,
  vault,
  endorsements,
  payouts,
  sprintMilestonesByBrief,
  onGoToVerify,
  onGoToUnlock,
  onGoToSolve,
}) => {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportSize, setViewportSize] = useState<{ height: number; width: number }>({
    height: DEFAULT_VIEWPORT_HEIGHT,
    width: 768,
  });
  const [measureRevision, setMeasureRevision] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const measureRafRef = useRef<number | null>(null);
  const measuredHeightsRef = useRef<Map<string, number>>(new Map());
  const rowElementsRef = useRef<Map<string, HTMLLIElement>>(new Map());
  const rowObserverRef = useRef<ResizeObserver | null>(null);

  const timeline = useMemo(
    () =>
      buildRecentActivityTimeline({
        capabilities,
        contributions,
        passport,
        vault,
        endorsements,
        payouts,
        sprintMilestonesByBrief,
      }),
    [
      capabilities,
      contributions,
      passport,
      vault,
      endorsements,
      payouts,
      sprintMilestonesByBrief,
    ]
  );

  const counts = useMemo(
    () => ({
      all: timeline.length,
      sprint: timeline.filter((e) => e.kind === 'sprint').length,
      capability: timeline.filter((e) => e.kind === 'capability').length,
      endorsement: timeline.filter((e) => e.kind === 'endorsement').length,
      payout: timeline.filter((e) => e.kind === 'payout').length,
    }),
    [timeline]
  );

  const visibleItems = useMemo(() => {
    if (activeFilter === 'all') return timeline;
    return timeline.filter((item) => item.kind === activeFilter);
  }, [timeline, activeFilter]);

  const scheduleMeasureFlush = useCallback(() => {
    if (measureRafRef.current !== null) return;
    measureRafRef.current = window.requestAnimationFrame(() => {
      measureRafRef.current = null;
      setMeasureRevision((prev) => prev + 1);
    });
  }, []);

  // Track scroll container dimensions (adapts seamlessly on viewport resize / device rotation)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const nextHeight = el.clientHeight || DEFAULT_VIEWPORT_HEIGHT;
      const nextWidth = el.clientWidth || 768;
      setViewportSize((prev) => {
        if (prev.width !== nextWidth) {
          // Width changed (e.g. mobile portrait <-> landscape): clear stale row measurements
          measuredHeightsRef.current.clear();
        }
        if (prev.height === nextHeight && prev.width === nextWidth) {
          return prev;
        }
        return { height: nextHeight, width: nextWidth };
      });
    };

    updateDimensions();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleItems.length]);

  // Shared ResizeObserver for rendered virtual rows so wrapped multi-line content never clips
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const node = entry.target as HTMLLIElement;
        const itemId = node.dataset.activityId;
        if (!itemId) continue;
        const measured = Math.ceil(node.getBoundingClientRect().height);
        if (measured > 0) {
          const previous = measuredHeightsRef.current.get(itemId);
          if (previous === undefined || Math.abs(previous - measured) > 1) {
            measuredHeightsRef.current.set(itemId, measured);
            changed = true;
          }
        }
      }
      if (changed) {
        scheduleMeasureFlush();
      }
    });

    rowObserverRef.current = observer;
    for (const node of rowElementsRef.current.values()) {
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
      rowObserverRef.current = null;
    };
  }, [scheduleMeasureFlush]);

  // Clean up pending RAF handles on unmount
  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
      if (measureRafRef.current !== null) {
        window.cancelAnimationFrame(measureRafRef.current);
      }
    };
  }, []);

  // Reset scroll offset cleanly when switching filters
  const handleSelectFilter = useCallback((nextFilter: FeedFilter) => {
    setActiveFilter(nextFilter);
    setScrollTop(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Coalesce scroll events to one state update per animation frame
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const nextTop = event.currentTarget.scrollTop;
    if (scrollRafRef.current !== null) {
      window.cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      setScrollTop(nextTop);
    });
  }, []);

  // Attach/detach callback ref for dynamic row height measurement
  const bindRowRef = useCallback(
    (itemId: string) => (node: HTMLLIElement | null) => {
      const existing = rowElementsRef.current.get(itemId);
      if (existing && existing !== node && rowObserverRef.current) {
        rowObserverRef.current.unobserve(existing);
      }

      if (!node) {
        rowElementsRef.current.delete(itemId);
        return;
      }

      rowElementsRef.current.set(itemId, node);
      rowObserverRef.current?.observe(node);

      const measured = Math.ceil(node.getBoundingClientRect().height);
      if (measured > 0) {
        const previous = measuredHeightsRef.current.get(itemId);
        if (previous === undefined || Math.abs(previous - measured) > 1) {
          measuredHeightsRef.current.set(itemId, measured);
          scheduleMeasureFlush();
        }
      }
    },
    [scheduleMeasureFlush]
  );

  const estimatedItemHeight =
    viewportSize.width < MOBILE_BREAKPOINT_PX
      ? MOBILE_ROW_ESTIMATE
      : DESKTOP_ROW_ESTIMATE;

  const virtualWindow = useMemo(() => {
    // Reference measureRevision so memo recalculates cleanly after row measurements
    void measureRevision;
    return computeVirtualWindow({
      itemCount: visibleItems.length,
      scrollTop,
      viewportHeight: viewportSize.height,
      estimatedItemHeight,
      overscan: VIRTUAL_OVERSCAN,
      getItemHeight: (index) => {
        const item = visibleItems[index];
        if (!item) return estimatedItemHeight;
        return measuredHeightsRef.current.get(item.id) ?? estimatedItemHeight;
      },
    });
  }, [
    visibleItems,
    scrollTop,
    viewportSize.height,
    estimatedItemHeight,
    measureRevision,
  ]);

  const handleJump = (target?: 'verify' | 'unlock' | 'solve') => {
    if (target === 'verify') onGoToVerify?.();
    else if (target === 'unlock') onGoToUnlock?.();
    else if (target === 'solve') onGoToSolve?.();
  };

  const renderIcon = (kind: ActivityEventKind) => {
    if (kind === 'sprint') return <Award className="w-4 h-4 shrink-0" aria-hidden="true" />;
    if (kind === 'capability')
      return <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />;
    if (kind === 'endorsement')
      return <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />;
    if (kind === 'payout') return <Wallet className="w-4 h-4 shrink-0" aria-hidden="true" />;
    return <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />;
  };

  const formatTimestamp = (iso: string) => {
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return 'Recent';
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section
      aria-labelledby="recent-activity-heading"
      data-testid="recent-activity-widget"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 space-y-5"
    >
      {/* Header + Segmented Filter Bar */}
      <div
        data-testid="recent-activity-feed"
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]"
      >
        <div>
          <p className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
            Chronological Progress Timeline · Audit Trail
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2
              id="recent-activity-heading"
              className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Recent Activity Feed
            </h2>
            {visibleItems.length > 0 && (
              <span
                data-testid="recent-activity-window-summary"
                className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]"
              >
                Showing {virtualWindow.firstVisibleIndex + 1}–
                {virtualWindow.lastVisibleIndex + 1} of {visibleItems.length}
              </span>
            )}
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter recent activity timeline"
          data-testid="recent-activity-filter-bar"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
        >
          {(
            [
              { id: 'all', label: 'All', count: counts.all },
              { id: 'sprint', label: 'Sprints', count: counts.sprint },
              { id: 'capability', label: 'Capabilities', count: counts.capability },
              { id: 'endorsement', label: 'Endorsements', count: counts.endorsement },
              { id: 'payout', label: 'Payouts', count: counts.payout },
            ] as Array<{ id: FeedFilter; label: string; count: number }>
          ).map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                data-testid={`activity-filter-${tab.id}`}
                onClick={() => handleSelectFilter(tab.id)}
                className={`min-h-[38px] sm:min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#1F2329] text-[#17191C] dark:text-[#F4F2EE] shadow-xs font-semibold'
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
      </div>

      {/* Virtualized Chronological Timeline Viewport */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        data-testid="recent-activity-scroll-list"
        data-virtualized="true"
        data-total-items={visibleItems.length}
        data-rendered-items={virtualWindow.visibleRows.length}
        className="max-h-[420px] overflow-y-auto overscroll-y-contain touch-pan-y pr-1 no-scrollbar"
      >
        {visibleItems.length === 0 ? (
          <div
            data-testid="recent-activity-empty-state"
            className="py-8 px-4 text-center space-y-3"
          >
            <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
              No timeline entries match this filter yet.
            </p>
            <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] max-w-md mx-auto leading-relaxed">
              Log a verified capability, receive a peer endorsement, or complete a solution sprint to see your live chronological history here.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {onGoToVerify && (
                <button
                  type="button"
                  onClick={onGoToVerify}
                  className="min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Open 1. Verify
                </button>
              )}
              {onGoToSolve && (
                <button
                  type="button"
                  onClick={onGoToSolve}
                  className="min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] transition-colors cursor-pointer"
                >
                  Explore 3. Solve
                </button>
              )}
            </div>
          </div>
        ) : (
          <ol
            role="list"
            aria-label="Recent platform activity timeline"
            className="relative border-s border-[#E8E3DB] dark:border-[#2C3037] ms-4"
            style={{ height: `${virtualWindow.totalHeight}px` }}
          >
            {virtualWindow.visibleRows.map(({ index, offsetTop }) => {
              const item = visibleItems[index];
              if (!item) return null;

              const isFirst = index === 0;
              const isLast = index === visibleItems.length - 1;

              const accentClass =
                item.kind === 'sprint'
                  ? 'text-[#C4622D] dark:text-[#E07B46] bg-[#F9ECE5] dark:bg-[#2D1E17] border-[#C4622D]/25 dark:border-[#E07B46]/30'
                  : item.kind === 'endorsement'
                    ? 'text-[#146C53] dark:text-[#5EEAD4] bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/25 dark:border-[#2EB88B]/30'
                    : 'text-[#146C53] dark:text-[#2EB88B] bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/25 dark:border-[#2EB88B]/30';

              const canJump =
                (item.actionTarget === 'verify' && Boolean(onGoToVerify)) ||
                (item.actionTarget === 'unlock' && Boolean(onGoToUnlock)) ||
                (item.actionTarget === 'solve' && Boolean(onGoToSolve));

              return (
                <li
                  key={item.id}
                  ref={bindRowRef(item.id)}
                  aria-posinset={index + 1}
                  aria-setsize={visibleItems.length}
                  data-testid="recent-activity-item"
                  data-activity-id={item.id}
                  data-activity-kind={item.kind}
                  data-virtual-index={index}
                  className={`absolute inset-x-0 top-0 ps-7 will-change-transform ${
                    isFirst ? 'pt-1 pb-4' : isLast ? 'pt-4 pb-1' : 'py-4'
                  } ${
                    !isLast
                      ? 'border-b border-[#E8E3DB]/70 dark:border-[#2C3037]/80'
                      : ''
                  }`}
                  style={{ transform: `translate3d(0, ${offsetTop}px, 0)` }}
                >
                  {/* Timeline node icon */}
                  <span
                    className={`absolute -start-4 ${
                      isFirst ? 'top-1' : 'top-4'
                    } w-8 h-8 rounded-lg border flex items-center justify-center ${accentClass}`}
                  >
                    {renderIcon(item.kind)}
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        <span
                          className={`font-semibold ${
                            item.kind === 'sprint'
                              ? 'text-[#C4622D] dark:text-[#E07B46]'
                              : 'text-[#146C53] dark:text-[#2EB88B]'
                          }`}
                        >
                          {item.kindLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.stageTag}</span>
                        {item.highlightMeta && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                              {item.highlightMeta}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug break-words">
                        {item.title}
                      </p>

                      <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed break-words">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0 pt-0.5">
                      <time
                        dateTime={item.timestamp}
                        className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap"
                      >
                        {formatTimestamp(item.timestamp)}
                      </time>

                      {canJump && (
                        <button
                          type="button"
                          onClick={() => handleJump(item.actionTarget)}
                          className="min-h-[36px] sm:min-h-0 px-1 sm:px-0 text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B] hover:underline inline-flex items-center gap-0.5 whitespace-nowrap cursor-pointer"
                        >
                          <span>View in {item.stageTag.split('. ')[1]}</span>
                          <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};
