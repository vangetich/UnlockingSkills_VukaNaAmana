import React, { useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Compass, TrendingUp } from 'lucide-react';
import type {
  BriefSubmission,
  MentorshipTrackSpec,
  StudioDomain,
} from '../types/kora';

export interface GrowthRoadmapNode {
  id: string;
  stageIndex: number;
  weekLabel: string;
  stageLabel: string;
  shortLabel: string;
  projectedSkillPct: number;
  soloBaselinePct: number;
  skillUnlocked: string;
  sprintDeliverable: string;
}

const DOMAIN_SKILL_MILESTONES: Record<
  StudioDomain,
  Array<{ skillUnlocked: string; sprintDeliverable: string; projectedPct: number }>
> = {
  'Green Energy': [
    {
      skillUnlocked: 'Field Diagnostic Baseline',
      sprintDeliverable: 'Initial inverter & battery telemetry intake',
      projectedPct: 26,
    },
    {
      skillUnlocked: 'Scoped Fault Isolation',
      sprintDeliverable: '48V microgrid load & voltage-drop hypothesis map',
      projectedPct: 48,
    },
    {
      skillUnlocked: 'Hardware QA & Safety Gates',
      sprintDeliverable: 'Busbar thermal verification & breaker protection plan',
      projectedPct: 68,
    },
    {
      skillUnlocked: 'Peer-Reviewed Commissioning',
      sprintDeliverable: 'Pod sprint review with live maintenance handover logs',
      projectedPct: 86,
    },
    {
      skillUnlocked: 'Tier 3 Accredited Field Lead',
      sprintDeliverable: 'Verified Living Proof dossier & partner sign-off',
      projectedPct: 97,
    },
  ],
  'Healthcare Ops': [
    {
      skillUnlocked: 'Clinical Intake Baseline',
      sprintDeliverable: 'Baseline cold-chain & triage readiness audit',
      projectedPct: 28,
    },
    {
      skillUnlocked: 'Protocol & Risk Framing',
      sprintDeliverable: 'Excursion quarantine SOP & multilingual intake guide',
      projectedPct: 50,
    },
    {
      skillUnlocked: 'Compliance Verification',
      sprintDeliverable: 'WHO-aligned temperature log & escalation checklist',
      projectedPct: 71,
    },
    {
      skillUnlocked: 'Pod Operational Walkthrough',
      sprintDeliverable: 'Simulated clinic handoff & shift-change QA review',
      projectedPct: 88,
    },
    {
      skillUnlocked: 'Tier 3 Clinical Ops Specialist',
      sprintDeliverable: 'Audit-ready SOP package & mentor competency badge',
      projectedPct: 98,
    },
  ],
  Tech: [
    {
      skillUnlocked: 'Architecture Baseline',
      sprintDeliverable: 'Core API schema & low-bandwidth constraint mapping',
      projectedPct: 30,
    },
    {
      skillUnlocked: 'Resilient Systems Framing',
      sprintDeliverable: 'Offline-first queue specification & retry boundaries',
      projectedPct: 52,
    },
    {
      skillUnlocked: 'Deterministic Sync QA',
      sprintDeliverable: 'Idempotent replay & conflict-resolution test suite',
      projectedPct: 74,
    },
    {
      skillUnlocked: 'Production Pod Code Review',
      sprintDeliverable: 'Latency audit & security hardening sign-off',
      projectedPct: 90,
    },
    {
      skillUnlocked: 'Tier 3 Distributed Systems Lead',
      sprintDeliverable: 'Deployed Living Proof artifact & partner endorsement',
      projectedPct: 98,
    },
  ],
  'SME Finance': [
    {
      skillUnlocked: 'Bookkeeping Baseline',
      sprintDeliverable: 'Opening cooperative cash-flow & inventory audit',
      projectedPct: 27,
    },
    {
      skillUnlocked: 'Working Capital Framing',
      sprintDeliverable: '13-week rolling forecast & supplier terms schedule',
      projectedPct: 49,
    },
    {
      skillUnlocked: 'Reconciliation Controls',
      sprintDeliverable: 'Invoice aging guardrails & unit-margin sensitivity model',
      projectedPct: 70,
    },
    {
      skillUnlocked: 'Partner Audit Walkthrough',
      sprintDeliverable: 'Pod review of treasury dashboard & variance alerts',
      projectedPct: 87,
    },
    {
      skillUnlocked: 'Tier 3 Financial Governance Lead',
      sprintDeliverable: 'Lender-ready dossier & accredited mentor endorsement',
      projectedPct: 97,
    },
  ],
};

const STAGE_HEADERS = [
  { id: 'stage-baseline', weekLabel: 'Wk 1', stageLabel: 'Baseline', shortLabel: 'Start' },
  { id: 'stage-framing', weekLabel: 'Wk 2', stageLabel: 'Problem Framing', shortLabel: 'Framing' },
  { id: 'stage-build', weekLabel: 'Wk 3–4', stageLabel: 'Active Execution', shortLabel: 'Build' },
  { id: 'stage-qa', weekLabel: 'Wk 5', stageLabel: 'Pod QA Review', shortLabel: 'QA Review' },
  { id: 'stage-mastery', weekLabel: 'Wk 6', stageLabel: 'Accredited Mastery', shortLabel: 'Mastery' },
];

const SOLO_BASELINE_CURVE = [24, 33, 45, 58, 69];

export function buildGrowthRoadmapNodes(params: {
  track: Pick<MentorshipTrackSpec, 'id' | 'domain' | 'title'>;
  linkedSprint: BriefSubmission | null;
  syncedCompletionPct: number;
  mode: 'sprint-focus' | 'full-track';
}): GrowthRoadmapNode[] {
  const { track, linkedSprint, syncedCompletionPct, mode } = params;
  const domainSteps =
    DOMAIN_SKILL_MILESTONES[track.domain] ?? DOMAIN_SKILL_MILESTONES['Green Energy'];

  const hasAlignedSprint = Boolean(
    linkedSprint &&
      linkedSprint.domain.toLowerCase() === track.domain.toLowerCase()
  );
  const sprintBoost = mode === 'sprint-focus' ? (hasAlignedSprint ? 5 : 2) : 0;
  const momentumLift = Math.round((Math.min(100, Math.max(0, syncedCompletionPct)) / 100) * 4);

  return STAGE_HEADERS.map((header, idx) => {
    const spec = domainSteps[idx];
    const baseProjected = spec.projectedPct;
    const adjustedProjected = Math.min(
      99,
      idx === 0
        ? Math.max(baseProjected, Math.min(40, Math.round(24 + syncedCompletionPct * 0.16)))
        : baseProjected + (idx >= 1 ? sprintBoost : 0) + (idx >= 2 ? Math.min(2, momentumLift) : 0)
    );

    const deliverable =
      mode === 'sprint-focus' && linkedSprint && idx === 2
        ? `Sprint Focus: ${linkedSprint.briefTitle}`
        : spec.sprintDeliverable;

    return {
      id: `${track.id}-${header.id}`,
      stageIndex: idx,
      weekLabel: header.weekLabel,
      stageLabel: header.stageLabel,
      shortLabel: header.shortLabel,
      projectedSkillPct: adjustedProjected,
      soloBaselinePct: SOLO_BASELINE_CURVE[idx],
      skillUnlocked: spec.skillUnlocked,
      sprintDeliverable: deliverable,
    };
  });
}

interface MentorshipGrowthRoadmapProps {
  track: MentorshipTrackSpec;
  linkedSprint: BriefSubmission | null;
  syncedCompletionPct: number;
  completedObjectivesCount: number;
  totalObjectivesCount: number;
}

const VIEWBOX_WIDTH = 640;
const VIEWBOX_HEIGHT = 216;
const MARGIN = { top: 20, right: 28, bottom: 38, left: 42 };

export const MentorshipGrowthRoadmap: React.FC<MentorshipGrowthRoadmapProps> = ({
  track,
  linkedSprint,
  syncedCompletionPct,
  completedObjectivesCount,
  totalObjectivesCount,
}) => {
  const [projectionMode, setProjectionMode] = useState<'sprint-focus' | 'full-track'>(
    linkedSprint ? 'sprint-focus' : 'full-track'
  );
  const [selectedStageIdx, setSelectedStageIdx] = useState<number | null>(null);

  useEffect(() => {
    setSelectedStageIdx(null);
  }, [track.id]);

  const nodes = useMemo(
    () =>
      buildGrowthRoadmapNodes({
        track,
        linkedSprint,
        syncedCompletionPct,
        mode: projectionMode,
      }),
    [track, linkedSprint, syncedCompletionPct, projectionMode]
  );

  // Determine the practitioner's current achieved stage index (0..4)
  const currentStageIndex = useMemo(() => {
    if (syncedCompletionPct >= 95) return 4;
    if (syncedCompletionPct >= 70) return 3;
    if (syncedCompletionPct >= 42) return 2;
    if (syncedCompletionPct >= 15) return 1;
    return 0;
  }, [syncedCompletionPct]);

  const activeNodeIdx = selectedStageIdx ?? Math.min(nodes.length - 1, currentStageIndex + 1);
  const activeNode = nodes[activeNodeIdx] ?? nodes[0];

  // D3 scales and SVG path generators
  const chartGeometry = useMemo(() => {
    const innerWidth = VIEWBOX_WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = VIEWBOX_HEIGHT - MARGIN.top - MARGIN.bottom;

    const xScale = d3
      .scalePoint<number>()
      .domain(nodes.map((n) => n.stageIndex))
      .range([MARGIN.left, MARGIN.left + innerWidth])
      .padding(0.12);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([MARGIN.top + innerHeight, MARGIN.top]);

    const projectedLineGenerator = d3
      .line<GrowthRoadmapNode>()
      .x((d) => xScale(d.stageIndex) ?? MARGIN.left)
      .y((d) => yScale(d.projectedSkillPct))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const soloBaselineGenerator = d3
      .line<GrowthRoadmapNode>()
      .x((d) => xScale(d.stageIndex) ?? MARGIN.left)
      .y((d) => yScale(d.soloBaselinePct))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area<GrowthRoadmapNode>()
      .x((d) => xScale(d.stageIndex) ?? MARGIN.left)
      .y0(MARGIN.top + innerHeight)
      .y1((d) => yScale(d.projectedSkillPct))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const achievedNodes = nodes.slice(0, Math.max(1, currentStageIndex + 1));

    return {
      projectedPath: projectedLineGenerator(nodes) ?? '',
      achievedPath: achievedNodes.length > 1 ? projectedLineGenerator(achievedNodes) ?? '' : '',
      soloBaselinePath: soloBaselineGenerator(nodes) ?? '',
      areaPath: areaGenerator(nodes) ?? '',
      yTicks: [25, 50, 75, 100],
      coords: nodes.map((n) => ({
        node: n,
        cx: xScale(n.stageIndex) ?? MARGIN.left,
        cy: yScale(n.projectedSkillPct),
        baselineCy: yScale(n.soloBaselinePct),
      })),
      getY: (val: number) => yScale(val),
      plotBottom: MARGIN.top + innerHeight,
    };
  }, [nodes, currentStageIndex]);

  const skillDelta =
    nodes[nodes.length - 1].projectedSkillPct - nodes[nodes.length - 1].soloBaselinePct;

  return (
    <section
      aria-labelledby="mentorship-growth-roadmap-heading"
      data-testid="mentorship-growth-roadmap"
      className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-3.5"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
              Mentorship Growth Roadmap
            </span>
            <span className="text-[#8A847A]" aria-hidden="true">·</span>
            <span className="text-[#575B62] dark:text-[#A3A7AE]">
              {track.domain} · D3 Projected Skill Evolution
            </span>
          </div>
          <h3
            id="mentorship-growth-roadmap-heading"
            className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            {linkedSprint
              ? `Projected Competency Curve — ${linkedSprint.briefTitle}`
              : `Projected 6-Week Skill Curve — ${track.title}`}
          </h3>
        </div>

        {/* Interactive Scope Switcher */}
        <div
          role="group"
          aria-label="Roadmap projection scope"
          className="inline-flex items-center p-0.5 rounded-lg bg-[#EFECE6] dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shrink-0 self-start"
        >
          <button
            type="button"
            data-testid="roadmap-mode-sprint"
            aria-pressed={projectionMode === 'sprint-focus'}
            onClick={() => setProjectionMode('sprint-focus')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              projectionMode === 'sprint-focus'
                ? 'bg-white dark:bg-[#24272D] text-[#146C53] dark:text-[#2EB88B] font-semibold shadow-xs'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
            }`}
          >
            Current Sprint Focus
          </button>
          <button
            type="button"
            data-testid="roadmap-mode-track"
            aria-pressed={projectionMode === 'full-track'}
            onClick={() => setProjectionMode('full-track')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              projectionMode === 'full-track'
                ? 'bg-white dark:bg-[#24272D] text-[#146C53] dark:text-[#2EB88B] font-semibold shadow-xs'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
            }`}
          >
            Full Domain Track
          </button>
        </div>
      </div>

      {/* D3 Path Visualization Canvas */}
      <div className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] p-3 sm:p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#146C53] dark:bg-[#2EB88B] inline-block" aria-hidden="true" />
              <span>Mentored Trajectory</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t border-dashed border-[#8A847A] inline-block" aria-hidden="true" />
              <span>Solo Pace Baseline</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>+{skillDelta}% projected acceleration</span>
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            role="img"
            aria-label={`D3 Mentorship Growth Roadmap for ${track.title}`}
            data-testid="mentorship-growth-roadmap-svg"
            className="w-full min-w-[460px] h-auto block select-none"
          >
            <defs>
              <linearGradient
                id={`roadmapAreaGrad-${track.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
                className="text-[#146C53] dark:text-[#2EB88B]"
              >
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Ticks */}
            {chartGeometry.yTicks.map((tick) => {
              const y = chartGeometry.getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={MARGIN.left}
                    x2={VIEWBOX_WIDTH - MARGIN.right}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={MARGIN.left - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-[#787C84] dark:fill-[#8A8F98] text-[10px] font-mono-tabular"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill Under Mentored Curve */}
            <path
              d={chartGeometry.areaPath}
              fill={`url(#roadmapAreaGrad-${track.id})`}
            />

            {/* Solo Baseline Dashed D3 Path */}
            <path
              d={chartGeometry.soloBaselinePath}
              fill="none"
              stroke="#8A847A"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.7"
            />

            {/* Full Projected Mentored Curve (Dashed beyond achieved progress) */}
            <path
              d={chartGeometry.projectedPath}
              data-testid="roadmap-projected-path"
              fill="none"
              stroke="#146C53"
              strokeWidth="2.25"
              strokeDasharray="5 4"
              strokeOpacity="0.65"
              className="dark:stroke-[#2EB88B]"
            />

            {/* Solid Achieved Portion of D3 Path */}
            {chartGeometry.achievedPath && (
              <path
                d={chartGeometry.achievedPath}
                data-testid="roadmap-achieved-path"
                fill="none"
                stroke="#146C53"
                strokeWidth="3"
                strokeLinecap="round"
                className="dark:stroke-[#2EB88B]"
              />
            )}

            {/* Interactive Milestone Nodes */}
            {chartGeometry.coords.map(({ node, cx, cy }) => {
              const isAchieved = node.stageIndex <= currentStageIndex;
              const isSelected = node.stageIndex === activeNode.stageIndex;

              return (
                <g
                  key={node.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.stageLabel} (${node.weekLabel}): ${node.projectedSkillPct}% projected mastery — ${node.skillUnlocked}`}
                  data-testid={`roadmap-node-${node.stageIndex}`}
                  onClick={() => setSelectedStageIdx(node.stageIndex)}
                  onMouseEnter={() => setSelectedStageIdx(node.stageIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedStageIdx(node.stageIndex);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {/* Vertical drop guide for selected node */}
                  {isSelected && (
                    <line
                      x1={cx}
                      x2={cx}
                      y1={cy + 8}
                      y2={chartGeometry.plotBottom}
                      stroke="#146C53"
                      strokeOpacity="0.35"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      className="dark:stroke-[#2EB88B]"
                    />
                  )}

                  {/* Outer selection halo */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={10}
                      fill="#146C53"
                      fillOpacity="0.16"
                      className="dark:fill-[#2EB88B]"
                    />
                  )}

                  {/* Node point */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 5.5 : 4.5}
                    className={
                      isAchieved
                        ? 'fill-[#146C53] dark:fill-[#2EB88B] stroke-white dark:stroke-[#1A1C20]'
                        : isSelected
                          ? 'fill-[#C4622D] dark:fill-[#E07B46] stroke-white dark:stroke-[#1A1C20]'
                          : 'fill-white dark:fill-[#1A1C20] stroke-[#146C53] dark:stroke-[#2EB88B]'
                    }
                    strokeWidth="2"
                  />

                  {/* Value callout above node */}
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    className={`text-[10px] font-mono-tabular font-semibold ${
                      isSelected
                        ? 'fill-[#146C53] dark:fill-[#2EB88B]'
                        : 'fill-[#575B62] dark:fill-[#A3A7AE]'
                    }`}
                  >
                    {node.projectedSkillPct}%
                  </text>

                  {/* X-Axis labels */}
                  <text
                    x={cx}
                    y={chartGeometry.plotBottom + 15}
                    textAnchor="middle"
                    className={`text-[10px] font-semibold ${
                      isSelected
                        ? 'fill-[#17191C] dark:fill-[#F4F2EE]'
                        : 'fill-[#575B62] dark:fill-[#A3A7AE]'
                    }`}
                  >
                    {node.shortLabel}
                  </text>
                  <text
                    x={cx}
                    y={chartGeometry.plotBottom + 28}
                    textAnchor="middle"
                    className="fill-[#787C84] dark:fill-[#8A8F98] text-[9px] font-mono-tabular"
                  >
                    {node.weekLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Detail Readout */}
        <div
          data-testid="roadmap-selected-stage-detail"
          className="pt-2.5 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
        >
          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" aria-hidden="true" />
              <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {activeNode.weekLabel} · {activeNode.stageLabel}
              </span>
              <span className="text-[#8A847A]" aria-hidden="true">—</span>
              <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                {activeNode.skillUnlocked}
              </span>
            </div>
            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] pl-5">
              Deliverable focus: {activeNode.sprintDeliverable}
            </p>
          </div>

          <div className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE] shrink-0 pl-5 sm:pl-0">
            <span>
              Projected <strong className="text-[#17191C] dark:text-[#F4F2EE]">{activeNode.projectedSkillPct}%</strong>
            </span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>
              {completedObjectivesCount}/{totalObjectivesCount} milestones mastered
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
