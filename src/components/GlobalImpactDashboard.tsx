import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface StageTelemetryDatum {
  stage: string;
  shortLabel: string;
  count: number;
  sdg: string;
}

export interface GlobalImpactDashboardProps {
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

type DashboardViewFocus = 'all' | 'builders' | 'capital';

interface StipendSliceDatum {
  id: 'disbursed' | 'escrow';
  label: string;
  valueUsd: number;
  colorLight: string;
  colorDark: string;
  note: string;
}

/**
 * GlobalImpactDashboard — D3-powered platform SDG impact telemetry dashboard
 * visualizing total verified builders across the 5 Crossing stages, active
 * solution sprints, and disbursed stipends inside PulseView.
 */
export const GlobalImpactDashboard: React.FC<GlobalImpactDashboardProps> = ({
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
  const donutSvgRef = useRef<SVGSVGElement | null>(null);
  const momentumContainerRef = useRef<HTMLDivElement | null>(null);
  const momentumSvgRef = useRef<SVGSVGElement | null>(null);

  const [viewFocus, setViewFocus] = useState<DashboardViewFocus>('all');
  const [stageWidth, setStageWidth] = useState(540);
  const [momentumWidth, setMomentumWidth] = useState(380);
  const [hoveredStage, setHoveredStage] = useState<StageTelemetryDatum | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<StipendSliceDatum | null>(null);
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

  // Measure responsive chart containers whenever layout or viewFocus changes
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observers: ResizeObserver[] = [];

    if (stageContainerRef.current) {
      const initialW = stageContainerRef.current.getBoundingClientRect().width;
      if (initialW > 120) setStageWidth(Math.floor(initialW));
      const obs = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (w && w > 120) setStageWidth(Math.floor(w));
      });
      obs.observe(stageContainerRef.current);
      observers.push(obs);
    }

    if (momentumContainerRef.current) {
      const initialW = momentumContainerRef.current.getBoundingClientRect().width;
      if (initialW > 120) setMomentumWidth(Math.floor(initialW));
      const obs = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (w && w > 120) setMomentumWidth(Math.floor(w));
      });
      obs.observe(momentumContainerRef.current);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [viewFocus]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const stipendSlices = useMemo<StipendSliceDatum[]>(() => {
    const cohortBaselineUsd = Math.max(0, totalDisbursedStipendsUsd - userTotalDisbursedUsd);
    return [
      {
        id: 'disbursed',
        label: 'Disbursed Stipends',
        valueUsd: Math.max(0, totalDisbursedStipendsUsd),
        colorLight: '#C4622D',
        colorDark: '#E07B46',
        note:
          userTotalDisbursedUsd > 0
            ? `$${cohortBaselineUsd.toLocaleString()} cohort · $${userTotalDisbursedUsd.toLocaleString()} yours`
            : 'Cleared via FATF Tiered KYC rails',
      },
      {
        id: 'escrow',
        label: 'Active Escrow Pipeline',
        valueUsd: Math.max(0, escrowPipelineUsd),
        colorLight: '#146C53',
        colorDark: '#2EB88B',
        note: 'Locked for in-progress milestone contracts',
      },
    ];
  }, [totalDisbursedStipendsUsd, userTotalDisbursedUsd, escrowPipelineUsd]);

  const totalStipendPoolUsd = Math.max(1, totalDisbursedStipendsUsd + escrowPipelineUsd);
  const disbursedSharePct = Math.round((totalDisbursedStipendsUsd / totalStipendPoolUsd) * 100);

  const stage1Count = stageBreakdown[0]?.count ?? 1;
  const stage5Count = stageBreakdown[stageBreakdown.length - 1]?.count ?? 0;
  const clearedConversionPct = Math.min(100, Math.round((stage5Count / Math.max(1, stage1Count)) * 100));

  const momentumSeries = useMemo(() => {
    const cohortBaselineUsd = Math.max(0, totalDisbursedStipendsUsd - userTotalDisbursedUsd);
    const totalSprintPool = Math.max(1, activeSprintsTotal + userCompletedSprints);

    return [
      {
        id: 'stipends-disbursed',
        label: 'Cleared Stipends',
        displayValue: `$${totalDisbursedStipendsUsd.toLocaleString()}`,
        subValue:
          userTotalDisbursedUsd > 0
            ? `$${cohortBaselineUsd.toLocaleString()} cohort · $${userTotalDisbursedUsd.toLocaleString()} yours`
            : 'FATF Tiered KYC rails',
        ratio: Math.min(1, totalDisbursedStipendsUsd / totalStipendPoolUsd),
        colorLight: '#C4622D',
        colorDark: '#E07B46',
      },
      {
        id: 'escrow-pipeline',
        label: 'Active Escrow Pipeline',
        displayValue: `$${escrowPipelineUsd.toLocaleString()}`,
        subValue: 'Locked in milestone contracts',
        ratio: Math.min(1, escrowPipelineUsd / totalStipendPoolUsd),
        colorLight: '#146C53',
        colorDark: '#2EB88B',
      },
      {
        id: 'active-sprints',
        label: 'Active Solution Sprints',
        displayValue: `${activeSprintsTotal} pods`,
        subValue: `${userActiveSprints} in-progress · ${userCompletedSprints} delivered`,
        ratio: Math.min(1, activeSprintsTotal / Math.max(totalSprintPool, activeSprintsTotal + 2)),
        colorLight: '#2563EB',
        colorDark: '#60A5FA',
      },
    ];
  }, [
    totalDisbursedStipendsUsd,
    userTotalDisbursedUsd,
    totalStipendPoolUsd,
    escrowPipelineUsd,
    activeSprintsTotal,
    userActiveSprints,
    userCompletedSprints,
  ]);

  // D3 Visualization 1: 5-Stage Verified Builders Pipeline Bar Chart + Progression Curve
  useEffect(() => {
    if (viewFocus === 'capital') return;
    const svgEl = stageSvgRef.current;
    if (!svgEl || stageBreakdown.length === 0) return;

    const height = viewFocus === 'builders' ? 256 : 236;
    const margin = { top: 26, right: 16, bottom: 46, left: 40 };
    const innerWidth = Math.max(160, stageWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;
    const animDuration = prefersReducedMotion ? 0 : 480;

    const colors = {
      emerald: isDark ? '#2EB88B' : '#146C53',
      terracotta: isDark ? '#E07B46' : '#C4622D',
      curve: isDark ? '#F59E6C' : '#9A481E',
      grid: isDark ? '#2C3037' : '#E8E3DB',
      axisText: isDark ? '#A3A7AE' : '#575B62',
      valueText: isDark ? '#F4F2EE' : '#17191C',
      track: isDark ? '#121315' : '#FAF8F5',
      surface: isDark ? '#1A1C20' : '#FFFFFF',
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
      .domain([0, Math.ceil(maxCount * 1.18)])
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

    // Subtle column tracks
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
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${d.stage}: ${d.count.toLocaleString()} verified builders (${d.sdg})`)
      .style('cursor', 'pointer')
      .on('mouseenter focus', function (_, d) {
        d3.select(this).attr('opacity', 0.86);
        setHoveredStage(d);
      })
      .on('mouseleave blur', function () {
        d3.select(this).attr('opacity', 1);
        setHoveredStage(null);
      });

    bars
      .transition()
      .duration(animDuration)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.count))
      .attr('height', (d) => Math.max(4, innerHeight - y(d.count)));

    // Subtle D3 progression curve connecting stage peaks
    const progressionLine = d3
      .line<StageTelemetryDatum>()
      .x((d) => (x(d.stage) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(stageBreakdown)
      .attr('fill', 'none')
      .attr('stroke', colors.curve)
      .attr('stroke-width', 1.75)
      .attr('stroke-opacity', 0.72)
      .attr('pointer-events', 'none')
      .attr('d', progressionLine);

    g.selectAll('circle.stage-node')
      .data(stageBreakdown)
      .join('circle')
      .attr('class', 'stage-node')
      .attr('cx', (d) => (x(d.stage) ?? 0) + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.count))
      .attr('r', 3.25)
      .attr('fill', colors.surface)
      .attr('stroke', colors.curve)
      .attr('stroke-width', 1.75)
      .attr('pointer-events', 'none');

    // Direct numeric value labels above each bar
    g.selectAll('text.bar-value')
      .data(stageBreakdown)
      .join('text')
      .attr('class', 'bar-value')
      .attr('x', (d) => (x(d.stage) ?? 0) + x.bandwidth() / 2)
      .attr('y', (d) => Math.max(10, y(d.count) - 9))
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
        (d) => `translate(${(x(d.stage) ?? 0) + x.bandwidth() / 2},${innerHeight + 17})`
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
  }, [stageBreakdown, stageWidth, isDark, viewFocus, prefersReducedMotion]);

  // D3 Visualization 2: Stipend Capital Allocation Donut Ring (d3.pie + d3.arc)
  useEffect(() => {
    if (viewFocus === 'builders') return;
    const svgEl = donutSvgRef.current;
    if (!svgEl) return;

    const size = 132;
    const radius = size / 2;
    const innerRadius = radius - 18;
    const outerRadius = radius - 4;
    const animDuration = prefersReducedMotion ? 0 : 520;

    const colors = {
      valueText: isDark ? '#F4F2EE' : '#17191C',
      mutedText: isDark ? '#A3A7AE' : '#575B62',
      surface: isDark ? '#1A1C20' : '#FFFFFF',
    };

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${size} ${size}`).attr('width', size).attr('height', size);

    const g = svg.append('g').attr('transform', `translate(${radius},${radius})`);

    const pie = d3
      .pie<StipendSliceDatum>()
      .value((d) => Math.max(1, d.valueUsd))
      .sort(null)
      .padAngle(0.035);

    const arc = d3
      .arc<d3.PieArcDatum<StipendSliceDatum>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(4);

    const arcs = g
      .selectAll<SVGPathElement, d3.PieArcDatum<StipendSliceDatum>>('path.stipend-arc')
      .data(pie(stipendSlices))
      .join('path')
      .attr('class', 'stipend-arc')
      .attr('fill', (d) => (isDark ? d.data.colorDark : d.data.colorLight))
      .attr('stroke', colors.surface)
      .attr('stroke-width', 1.5)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${d.data.label}: $${d.data.valueUsd.toLocaleString()} USD`)
      .style('cursor', 'pointer')
      .on('mouseenter focus', function (_, d) {
        d3.select(this).attr('opacity', 0.85);
        setHoveredSlice(d.data);
      })
      .on('mouseleave blur', function () {
        d3.select(this).attr('opacity', 1);
        setHoveredSlice(null);
      });

    if (animDuration > 0) {
      arcs
        .transition()
        .duration(animDuration)
        .ease(d3.easeCubicOut)
        .attrTween('d', (d) => {
          const interp = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
          return (t) => arc(interp(t)) ?? '';
        });
    } else {
      arcs.attr('d', arc);
    }

    // Center tabular summary inside ring
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -3)
      .attr('fill', colors.valueText)
      .attr('font-size', '16px')
      .attr('font-weight', '700')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .text(`${disbursedSharePct}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 13)
      .attr('fill', colors.mutedText)
      .attr('font-size', '9.5px')
      .attr('font-weight', '500')
      .text('cleared');
  }, [stipendSlices, disbursedSharePct, isDark, viewFocus, prefersReducedMotion]);

  // D3 Visualization 3: Stipend Disbursement & Sprint Velocity Bars
  useEffect(() => {
    if (viewFocus === 'builders') return;
    const svgEl = momentumSvgRef.current;
    if (!svgEl) return;

    const rowHeight = 56;
    const height = momentumSeries.length * rowHeight + 6;
    const margin = { top: 4, right: 4, bottom: 4, left: 4 };
    const innerWidth = Math.max(150, momentumWidth - margin.left - margin.right);
    const animDuration = prefersReducedMotion ? 0 : 520;

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

    rows
      .append('text')
      .attr('x', 0)
      .attr('y', 13)
      .attr('fill', colors.label)
      .attr('font-size', '11.5px')
      .attr('font-weight', '600')
      .text((d) => d.label);

    rows
      .append('text')
      .attr('x', innerWidth)
      .attr('y', 13)
      .attr('text-anchor', 'end')
      .attr('fill', (d) => (isDark ? d.colorDark : d.colorLight))
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .text((d) => d.displayValue);

    rows
      .append('rect')
      .attr('x', 0)
      .attr('y', 21)
      .attr('width', innerWidth)
      .attr('height', 9)
      .attr('rx', 4.5)
      .attr('fill', colors.track)
      .attr('stroke', colors.border)
      .attr('stroke-width', 1);

    rows
      .append('rect')
      .attr('x', 0)
      .attr('y', 21)
      .attr('height', 9)
      .attr('rx', 4.5)
      .attr('width', 0)
      .attr('fill', (d) => (isDark ? d.colorDark : d.colorLight))
      .transition()
      .duration(animDuration)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => Math.max(12, x(d.ratio)));

    rows
      .append('text')
      .attr('x', 0)
      .attr('y', 44)
      .attr('fill', colors.muted)
      .attr('font-size', '10.5px')
      .text((d) => d.subValue);
  }, [momentumSeries, momentumWidth, isDark, viewFocus, prefersReducedMotion]);

  const activeStageHighlight = hoveredStage ?? stageBreakdown[0] ?? null;
  const activeStageSharePct = activeStageHighlight
    ? Math.round((activeStageHighlight.count / Math.max(1, totalBuildersVerified5Stages)) * 100)
    : 0;

  return (
    <section
      aria-labelledby="impact-telemetry-heading"
      data-testid="pulse-impact-telemetry-board"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 space-y-6"
    >
      {/* Header + Segmented View Filter */}
      <div
        data-testid="global-impact-dashboard"
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        <div>
          <p className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
            Real-Time SDG Ledger · Live Platform Telemetry
          </p>
          <h2
            id="impact-telemetry-heading"
            className="mt-0.5 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Global Impact Dashboard
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
          <div className="text-xs text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-2 font-mono-tabular tabular-nums">
            <span>SDGs 4 · 8 · 10 · 16 · 17</span>
            <span aria-hidden="true">/</span>
            <span>{isOnline ? 'Live Firebase sync' : 'Offline PWA ledger'}</span>
          </div>

          <div
            role="group"
            aria-label="Filter Global Impact Dashboard visualization"
            data-testid="global-impact-view-filter"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
          >
            {(
              [
                { id: 'all', label: 'All Metrics' },
                { id: 'builders', label: '5-Stage Builders' },
                { id: 'capital', label: 'Sprints & Stipends' },
              ] as Array<{ id: DashboardViewFocus; label: string }>
            ).map((opt) => {
              const active = viewFocus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  data-testid={`impact-filter-${opt.id}`}
                  onClick={() => setViewFocus(opt.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-[#1F2329] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary 3-Metric Real-Time Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E3DB] dark:divide-[#2C3037] border-y border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="py-4 md:py-5 md:pr-6" data-testid="telemetry-verified-builders">
          <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
            Total Verified Builders (5 Stages)
          </p>
          <p className="mt-1.5 font-mono-tabular tabular-nums text-3xl sm:text-4xl font-semibold tracking-tight text-[#146C53] dark:text-[#2EB88B]">
            {totalBuildersVerified5Stages.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Verify → Cleared pipeline ·{' '}
            <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              {clearedConversionPct}%
            </span>{' '}
            stage-5 clearance rate
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
            in your studio · {userCompletedSprints} completed
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
            USD cleared via FATF rails ·{' '}
            <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              ${userTotalDisbursedUsd.toLocaleString()}
            </span>{' '}
            yours
          </p>
        </div>
      </div>

      {/* D3 Responsive Visualizations Grid */}
      <div
        className={`grid grid-cols-1 gap-6 items-start ${
          viewFocus === 'all' ? 'lg:grid-cols-12' : ''
        }`}
        data-testid="telemetry-five-stage-breakdown"
      >
        {/* D3 Chart 1: 5-Stage Crossing Verification Pipeline + Progression Curve */}
        {viewFocus !== 'capital' && (
          <div
            className={`${viewFocus === 'all' ? 'lg:col-span-7' : 'w-full'} space-y-2.5 min-w-0`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                5-Stage Verified Builders Pipeline
              </span>
              {activeStageHighlight && (
                <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                  {hoveredStage ? 'Inspecting: ' : 'Lead stage: '}
                  <strong className="text-[#146C53] dark:text-[#2EB88B]">
                    {activeStageHighlight.stage}
                  </strong>{' '}
                  · {activeStageHighlight.count.toLocaleString()} ({activeStageSharePct}% ·{' '}
                  {activeStageHighlight.sdg})
                </span>
              )}
            </div>

            <div ref={stageContainerRef} className="w-full overflow-hidden">
              <svg
                ref={stageSvgRef}
                role="img"
                aria-label="D3 bar and progression chart of verified builders across the five Crossing Over stages"
                data-testid="d3-stage-pipeline-svg"
                className="block w-full"
              />
            </div>
          </div>
        )}

        {/* D3 Charts 2 & 3: Stipend Allocation Donut + Sprint & Capital Momentum Bars */}
        {viewFocus !== 'builders' && (
          <div
            className={`${
              viewFocus === 'all'
                ? 'lg:col-span-5 lg:border-l lg:border-[#E8E3DB] dark:lg:border-[#2C3037] lg:pl-6'
                : 'w-full'
            } space-y-4 min-w-0`}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Stipend Capital &amp; Sprint Allocation
              </span>
              <span className="font-mono-tabular tabular-nums text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                ${totalStipendPoolUsd.toLocaleString()} total pool
              </span>
            </div>

            {/* Compact D3 Donut + Unboxed Legend */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-3 border-b border-[#E8E3DB] dark:border-[#2C3037]">
              <svg
                ref={donutSvgRef}
                role="img"
                aria-label={`D3 donut chart showing ${disbursedSharePct}% of total stipend capital cleared and disbursed`}
                data-testid="d3-stipend-donut-svg"
                className="shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-2.5 text-xs w-full">
                {stipendSlices.map((slice) => {
                  const pct = Math.round((slice.valueUsd / totalStipendPoolUsd) * 100);
                  const isHighlighted = hoveredSlice?.id === slice.id;
                  return (
                    <div
                      key={slice.id}
                      className={`transition-opacity ${
                        hoveredSlice && !isHighlighted ? 'opacity-55' : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 font-medium text-[#17191C] dark:text-[#F4F2EE]">
                          <span
                            aria-hidden="true"
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{
                              backgroundColor: isDark ? slice.colorDark : slice.colorLight,
                            }}
                          />
                          <span>{slice.label}</span>
                        </span>
                        <span className="font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          ${slice.valueUsd.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <p className="mt-0.5 pl-4.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        {slice.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Horizontal D3 Allocation Bars */}
            <div ref={momentumContainerRef} className="w-full overflow-hidden">
              <svg
                ref={momentumSvgRef}
                role="img"
                aria-label="D3 horizontal allocation chart of disbursed stipends, escrow pipeline, and active solution sprints"
                data-testid="d3-stipend-sprint-svg"
                className="block w-full"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
