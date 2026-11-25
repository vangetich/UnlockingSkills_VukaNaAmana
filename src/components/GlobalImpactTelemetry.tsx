import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface StageTelemetryDatum {
  stage: string;
  shortLabel: string;
  count: number;
  sdg: string;
}

export interface GlobalImpactTelemetryProps {
  activeSprintsTotal: number;
  userActiveSprints: number;
  userCompletedSprints: number;
  totalBuildersVerified5Stages: number;
  stageBreakdown: StageTelemetryDatum[];
  totalDisbursedStipendsUsd: number;
  userTotalDisbursedUsd: number;
  escrowPipelineUsd: number;
  isOnline: boolean;
}

export const GlobalImpactTelemetry: React.FC<GlobalImpactTelemetryProps> = ({
  activeSprintsTotal,
  userActiveSprints,
  userCompletedSprints,
  totalBuildersVerified5Stages,
  stageBreakdown,
  totalDisbursedStipendsUsd,
  userTotalDisbursedUsd,
  escrowPipelineUsd,
  isOnline,
}) => {
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const stageSvgRef = useRef<SVGSVGElement | null>(null);
  const momentumContainerRef = useRef<HTMLDivElement | null>(null);
  const momentumSvgRef = useRef<SVGSVGElement | null>(null);

  const [stageWidth, setStageWidth] = useState(520);
  const [momentumWidth, setMomentumWidth] = useState(440);
  const [hoveredStage, setHoveredStage] = useState<StageTelemetryDatum | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  // Sync D3 palette immediately on Light/Dark mode toggles
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Measure both responsive chart containers with ResizeObserver
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observers: ResizeObserver[] = [];

    if (stageContainerRef.current) {
      const obs = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (w && w > 120) setStageWidth(Math.floor(w));
      });
      obs.observe(stageContainerRef.current);
      observers.push(obs);
    }

    if (momentumContainerRef.current) {
      const obs = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (w && w > 120) setMomentumWidth(Math.floor(w));
      });
      obs.observe(momentumContainerRef.current);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const momentumSeries = useMemo(() => {
    const cohortBaselineUsd = Math.max(0, totalDisbursedStipendsUsd - userTotalDisbursedUsd);
    const totalStipendEnvelope = Math.max(1, totalDisbursedStipendsUsd + escrowPipelineUsd);
    const totalSprintPool = Math.max(1, activeSprintsTotal + userCompletedSprints);

    return [
      {
        id: 'stipends-disbursed',
        label: 'Cleared Stipends',
        displayValue: `$${totalDisbursedStipendsUsd.toLocaleString()}`,
        subValue:
          userTotalDisbursedUsd > 0
            ? `$${cohortBaselineUsd.toLocaleString()} cohort + $${userTotalDisbursedUsd.toLocaleString()} yours`
            : 'FATF Tiered KYC rails',
        ratio: Math.min(1, totalDisbursedStipendsUsd / totalStipendEnvelope),
        colorLight: '#C4622D',
        colorDark: '#E07B46',
      },
      {
        id: 'escrow-pipeline',
        label: 'Active Escrow Pipeline',
        displayValue: `$${escrowPipelineUsd.toLocaleString()}`,
        subValue: 'Locked in milestone contracts',
        ratio: Math.min(1, escrowPipelineUsd / totalStipendEnvelope),
        colorLight: '#146C53',
        colorDark: '#2EB88B',
      },
      {
        id: 'active-sprints',
        label: 'Active Solution Sprints',
        displayValue: `${activeSprintsTotal} pods`,
        subValue: `${userActiveSprints} in-progress · ${userCompletedSprints} delivered`,
        ratio: Math.min(1, activeSprintsTotal / Math.max(totalSprintPool, activeSprintsTotal + 2)),
        colorLight: '#1D4ED8',
        colorDark: '#60A5FA',
      },
    ];
  }, [
    totalDisbursedStipendsUsd,
    userTotalDisbursedUsd,
    escrowPipelineUsd,
    activeSprintsTotal,
    userActiveSprints,
    userCompletedSprints,
  ]);

  // D3 Visualization 1: 5-Stage Verified Builders Pipeline Bar Chart
  useEffect(() => {
    const svgEl = stageSvgRef.current;
    if (!svgEl || stageBreakdown.length === 0) return;

    const height = 228;
    const margin = { top: 24, right: 14, bottom: 44, left: 38 };
    const innerWidth = Math.max(140, stageWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const colors = {
      emerald: isDark ? '#2EB88B' : '#146C53',
      emeraldSoft: isDark ? '#19372E' : '#E7F3EE',
      terracotta: isDark ? '#E07B46' : '#C4622D',
      grid: isDark ? '#2C3037' : '#E8E3DB',
      axisText: isDark ? '#A3A7AE' : '#575B62',
      valueText: isDark ? '#F4F2EE' : '#17191C',
      track: isDark ? '#121315' : '#FAF8F5',
    };

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg
      .attr('viewBox', `0 0 ${stageWidth} ${height}`)
      .attr('width', stageWidth)
      .attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand<string>()
      .domain(stageBreakdown.map((d) => d.stage))
      .range([0, innerWidth])
      .padding(0.32);

    const maxCount = Math.max(d3.max(stageBreakdown, (d) => d.count) ?? 10, 10);
    const y = d3
      .scaleLinear()
      .domain([0, Math.ceil(maxCount * 1.16)])
      .nice(4)
      .range([innerHeight, 0]);

    // Horizontal hairline gridlines
    const yTicks = y.ticks(4);
    g.append('g')
      .attr('class', 'd3-grid')
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', colors.grid)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', (d) => (d === 0 ? 'none' : '3 3'));

    // Y axis
    const yAxis = d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(8);
    g.append('g')
      .call(yAxis)
      .call((sel) => sel.select('.domain').remove())
      .selectAll('text')
      .attr('fill', colors.axisText)
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace');

    // Subtle background column tracks
    g.selectAll('rect.stage-track')
      .data(stageBreakdown)
      .join('rect')
      .attr('class', 'stage-track')
      .attr('x', (d) => x(d.stage) ?? 0)
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', innerHeight)
      .attr('rx', 6)
      .attr('fill', colors.track);

    // Animated D3 data bars
    const bars = g
      .selectAll<SVGRectElement, StageTelemetryDatum>('rect.stage-bar')
      .data(stageBreakdown, (d) => d.stage)
      .join('rect')
      .attr('class', 'stage-bar')
      .attr('x', (d) => x(d.stage) ?? 0)
      .attr('width', x.bandwidth())
      .attr('rx', 6)
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', (_, i) => (i === 4 ? colors.terracotta : colors.emerald))
      .style('cursor', 'pointer')
      .on('mouseenter', function (_, d) {
        d3.select(this).attr('opacity', 0.88);
        setHoveredStage(d);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        setHoveredStage(null);
      });

    bars
      .transition()
      .duration(520)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.count))
      .attr('height', (d) => Math.max(4, innerHeight - y(d.count)));

    // Direct numeric value labels above each bar
    g.selectAll('text.bar-value')
      .data(stageBreakdown)
      .join('text')
      .attr('class', 'bar-value')
      .attr('x', (d) => (x(d.stage) ?? 0) + x.bandwidth() / 2)
      .attr('y', (d) => Math.max(10, y(d.count) - 7))
      .attr('text-anchor', 'middle')
      .attr('fill', colors.valueText)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .text((d) => d.count.toLocaleString());

    // X-axis stage labels + SDG sub-labels
    const xLabels = g
      .selectAll('g.x-stage-label')
      .data(stageBreakdown)
      .join('g')
      .attr('class', 'x-stage-label')
      .attr(
        'transform',
        (d) => `translate(${(x(d.stage) ?? 0) + x.bandwidth() / 2},${innerHeight + 16})`
      );

    xLabels
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', colors.valueText)
      .attr('font-size', stageWidth < 380 ? '10px' : '11px')
      .attr('font-weight', '600')
      .text((d) => (stageWidth < 380 ? d.shortLabel : d.stage));

    xLabels
      .append('text')
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.axisText)
      .attr('font-size', '9.5px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .text((d) => d.sdg);
  }, [stageBreakdown, stageWidth, isDark]);

  // D3 Visualization 2: Stipend Disbursement & Sprint Velocity Bars
  useEffect(() => {
    const svgEl = momentumSvgRef.current;
    if (!svgEl) return;

    const rowHeight = 62;
    const height = momentumSeries.length * rowHeight + 12;
    const margin = { top: 8, right: 8, bottom: 8, left: 8 };
    const innerWidth = Math.max(160, momentumWidth - margin.left - margin.right);

    const colors = {
      track: isDark ? '#121315' : '#FAF8F5',
      border: isDark ? '#2C3037' : '#E8E3DB',
      label: isDark ? '#F4F2EE' : '#17191C',
      muted: isDark ? '#A3A7AE' : '#575B62',
    };

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg
      .attr('viewBox', `0 0 ${momentumWidth} ${height}`)
      .attr('width', momentumWidth)
      .attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);

    const rows = g
      .selectAll('g.momentum-row')
      .data(momentumSeries)
      .join('g')
      .attr('class', 'momentum-row')
      .attr('transform', (_, i) => `translate(0,${i * rowHeight})`);

    // Left metric title
    rows
      .append('text')
      .attr('x', 0)
      .attr('y', 14)
      .attr('fill', colors.label)
      .attr('font-size', '11.5px')
      .attr('font-weight', '600')
      .text((d) => d.label);

    // Right tabular value
    rows
      .append('text')
      .attr('x', innerWidth)
      .attr('y', 14)
      .attr('text-anchor', 'end')
      .attr('fill', (d) => (isDark ? d.colorDark : d.colorLight))
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .text((d) => d.displayValue);

    // Track bar
    rows
      .append('rect')
      .attr('x', 0)
      .attr('y', 23)
      .attr('width', innerWidth)
      .attr('height', 10)
      .attr('rx', 5)
      .attr('fill', colors.track)
      .attr('stroke', colors.border)
      .attr('stroke-width', 1);

    // Animated progress bar
    rows
      .append('rect')
      .attr('x', 0)
      .attr('y', 23)
      .attr('height', 10)
      .attr('rx', 5)
      .attr('width', 0)
      .attr('fill', (d) => (isDark ? d.colorDark : d.colorLight))
      .transition()
      .duration(560)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => Math.max(12, x(d.ratio)));

    // Sub-label beneath bar
    rows
      .append('text')
      .attr('x', 0)
      .attr('y', 48)
      .attr('fill', colors.muted)
      .attr('font-size', '10.5px')
      .text((d) => d.subValue);
  }, [momentumSeries, momentumWidth, isDark]);

  const activeStageHighlight = hoveredStage ?? stageBreakdown[0] ?? null;

  return (
    <section
      aria-labelledby="impact-telemetry-heading"
      data-testid="pulse-impact-telemetry-board"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
            Real-Time SDG Ledger · Live Platform Telemetry
          </p>
          <h2
            id="impact-telemetry-heading"
            className="mt-0.5 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Global Impact Telemetry
          </h2>
        </div>
        <div className="text-xs text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-2 font-mono-tabular tabular-nums">
          <span>SDGs 4 · 8 · 10 · 16 · 17</span>
          <span aria-hidden="true">/</span>
          <span>{isOnline ? 'Live sync active' : 'Local PWA ledger'}</span>
        </div>
      </div>

      {/* Primary 3-Metric Real-Time Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E3DB] dark:divide-[#2C3037] border-y border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="py-4 md:py-5 md:pr-6" data-testid="telemetry-verified-builders">
          <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
            Verified Builders (5 Stages)
          </p>
          <p className="mt-1.5 font-mono-tabular tabular-nums text-3xl sm:text-4xl font-semibold tracking-tight text-[#146C53] dark:text-[#2EB88B]">
            {totalBuildersVerified5Stages.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Cumulative verifications across Verify → Cleared
          </p>
        </div>

        <div className="py-4 md:py-5 md:px-6" data-testid="telemetry-active-sprints">
          <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
            Active Solution Sprints
          </p>
          <p className="mt-1.5 font-mono-tabular tabular-nums text-3xl sm:text-4xl font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
            {activeSprintsTotal}
          </p>
          <p className="mt-1.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            <span className="font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
              {userActiveSprints} in-progress
            </span>{' '}
            in your workspace · {userCompletedSprints} completed
          </p>
        </div>

        <div className="py-4 md:py-5 md:pl-6" data-testid="telemetry-disbursed-stipends">
          <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
            Total Disbursed Stipends
          </p>
          <p className="mt-1.5 font-mono-tabular tabular-nums text-3xl sm:text-4xl font-semibold tracking-tight text-[#C4622D] dark:text-[#E07B46]">
            ${totalDisbursedStipendsUsd.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            USD cleared via FATF-compliant rails ·{' '}
            <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              ${userTotalDisbursedUsd.toLocaleString()}
            </span>{' '}
            yours
          </p>
        </div>
      </div>

      {/* D3 Responsive Visualizations Grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        data-testid="telemetry-five-stage-breakdown"
      >
        {/* Left 7 cols: D3 5-Stage Crossing Verification Pipeline */}
        <div className="lg:col-span-7 space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              5-Stage Verification Pipeline
            </span>
            {activeStageHighlight && (
              <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                {hoveredStage ? 'Inspecting: ' : 'Lead stage: '}
                <strong className="text-[#146C53] dark:text-[#2EB88B]">
                  {activeStageHighlight.stage}
                </strong>{' '}
                ({activeStageHighlight.count.toLocaleString()} · {activeStageHighlight.sdg})
              </span>
            )}
          </div>

          <div ref={stageContainerRef} className="w-full overflow-hidden">
            <svg
              ref={stageSvgRef}
              role="img"
              aria-label="D3 bar chart of verified builders across the five Crossing Over stages"
              data-testid="d3-stage-pipeline-svg"
              className="block w-full"
            />
          </div>
        </div>

        {/* Right 5 cols: D3 Stipend Disbursement & Active Sprint Momentum */}
        <div className="lg:col-span-5 lg:border-l lg:border-[#E8E3DB] dark:lg:border-[#2C3037] lg:pl-6 space-y-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Stipend &amp; Sprint Allocation
            </span>
            <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              Live reactive ledger
            </span>
          </div>

          <div ref={momentumContainerRef} className="w-full overflow-hidden pt-1">
            <svg
              ref={momentumSvgRef}
              role="img"
              aria-label="D3 horizontal allocation chart of disbursed stipends, escrow pipeline, and active solution sprints"
              data-testid="d3-stipend-sprint-svg"
              className="block w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
