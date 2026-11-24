import React, { useId, useState } from 'react';
import { TrendingUp, Wallet } from 'lucide-react';
import type { SprintPerformanceData } from '../types/kora';

interface SprintPerformanceWidgetProps {
  data: SprintPerformanceData;
}

interface SparklinePointCoord {
  x: number;
  y: number;
  label: string;
  value: number;
}

function buildSparklineCoords(
  values: Array<{ label: string; value: number }>,
  width: number,
  topPad: number,
  plotHeight: number,
  horizontalPad: number
): SparklinePointCoord[] {
  if (values.length === 0) return [];
  const rawMin = Math.min(...values.map((v) => v.value));
  const rawMax = Math.max(...values.map((v) => v.value));
  const spread = Math.max(1, rawMax - rawMin);
  const minVal = rawMin - spread * 0.14;
  const maxVal = rawMax + spread * 0.12;
  const range = Math.max(1, maxVal - minVal);
  const usableW = width - horizontalPad * 2;

  return values.map((item, idx) => {
    const x =
      values.length === 1
        ? width / 2
        : horizontalPad + (idx / (values.length - 1)) * usableW;
    const norm = (item.value - minVal) / range;
    const y = topPad + (1 - norm) * plotHeight;
    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      label: item.label,
      value: item.value,
    };
  });
}

function buildSmoothLinePath(coords: SparklinePointCoord[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i];
    const next = coords[i + 1];
    const midX = Math.round(((curr.x + next.x) / 2) * 10) / 10;
    path += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function buildAreaPath(coords: SparklinePointCoord[], baselineY: number): string {
  if (coords.length === 0) return '';
  const line = buildSmoothLinePath(coords);
  const first = coords[0];
  const last = coords[coords.length - 1];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export const SprintPerformanceWidget: React.FC<SprintPerformanceWidgetProps> = ({ data }) => {
  const idPrefix = useId().replace(/:/g, '');
  const [hoveredAcceptanceIdx, setHoveredAcceptanceIdx] = useState<number | null>(null);
  const [hoveredPayoutIdx, setHoveredPayoutIdx] = useState<number | null>(null);

  const svgWidth = 280;
  const topPad = 12;
  const plotHeight = 52;
  const baselineY = topPad + plotHeight;
  const horizontalPad = 14;

  const acceptanceCoords = buildSparklineCoords(
    data.points.map((p) => ({ label: p.label, value: p.acceptanceRatePct })),
    svgWidth,
    topPad,
    plotHeight,
    horizontalPad
  );

  const payoutCoords = buildSparklineCoords(
    data.points.map((p) => ({ label: p.label, value: p.payoutUsd })),
    svgWidth,
    topPad,
    plotHeight,
    horizontalPad
  );

  const activeAcceptanceIdx =
    hoveredAcceptanceIdx !== null ? hoveredAcceptanceIdx : acceptanceCoords.length - 1;
  const activePayoutIdx =
    hoveredPayoutIdx !== null ? hoveredPayoutIdx : payoutCoords.length - 1;

  const activeAcceptancePoint = acceptanceCoords[activeAcceptanceIdx];
  const activePayoutPoint = payoutCoords[activePayoutIdx];

  return (
    <section
      aria-labelledby="sprint-performance-heading"
      data-testid="sprint-performance-widget"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
            Sprint Performance · Live Trajectory
          </p>
          <h2
            id="sprint-performance-heading"
            className="mt-1 font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Acceptance Reliability &amp; Payout Earnings Over Time
          </h2>
        </div>
        <div className="text-start sm:text-end">
          <p className="text-xs font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE] font-medium">
            {data.completedCount} accepted · {data.totalPodsCount} tracked sprint{data.totalPodsCount === 1 ? '' : 's'}
          </p>
          <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
            Live from Proof Ledger contributions &amp; payout records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sparkline 1: Solution Sprint Acceptance Rate */}
        <div
          data-testid="sparkline-acceptance-panel"
          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                <TrendingUp className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                <span>Solution Sprint Acceptance Rate</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span
                  data-testid="sparkline-acceptance-value"
                  className="font-mono-tabular tabular-nums text-2xl sm:text-3xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                >
                  {activeAcceptancePoint ? `${activeAcceptancePoint.value}%` : `${data.currentAcceptanceRatePct}%`}
                </span>
                <span className="text-xs font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  {data.acceptanceDeltaPct >= 0 ? `+${data.acceptanceDeltaPct}%` : `${data.acceptanceDeltaPct}%`} vs prior
                </span>
              </div>
            </div>

            <span className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
              {activeAcceptancePoint?.label ?? 'Live'}
            </span>
          </div>

          <div className="w-full">
            <svg
              viewBox={`0 0 ${svgWidth} 86`}
              className="w-full h-24 overflow-visible"
              role="img"
              aria-label={`Solution sprint acceptance rate sparkline reaching ${data.currentAcceptanceRatePct} percent`}
            >
              <defs>
                <linearGradient id={`${idPrefix}-accept-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#146C53" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#146C53" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Subtle horizontal reference hairlines */}
              <line
                x1={horizontalPad}
                y1={topPad}
                x2={svgWidth - horizontalPad}
                y2={topPad}
                className="stroke-[#E8E3DB] dark:stroke-[#2C3037]"
                strokeWidth="0.75"
                strokeDasharray="3 4"
              />
              <line
                x1={horizontalPad}
                y1={baselineY}
                x2={svgWidth - horizontalPad}
                y2={baselineY}
                className="stroke-[#E8E3DB] dark:stroke-[#2C3037]"
                strokeWidth="0.85"
              />

              {/* Soft emerald area wash */}
              <path
                d={buildAreaPath(acceptanceCoords, baselineY)}
                fill={`url(#${idPrefix}-accept-fill)`}
              />

              {/* Smooth emerald sparkline stroke */}
              <path
                d={buildSmoothLinePath(acceptanceCoords)}
                fill="none"
                className="stroke-[#146C53] dark:stroke-[#2EB88B]"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive nodes & x-axis labels */}
              {acceptanceCoords.map((pt, idx) => {
                const isSelected = idx === activeAcceptanceIdx;
                return (
                  <g
                    key={pt.label}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredAcceptanceIdx(idx)}
                    onMouseLeave={() => setHoveredAcceptanceIdx(null)}
                    onClick={() => setHoveredAcceptanceIdx(idx)}
                  >
                    <rect
                      x={pt.x - 16}
                      y={0}
                      width={32}
                      height={84}
                      fill="transparent"
                    />
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="7"
                        className="fill-[#146C53]/15 dark:fill-[#2EB88B]/20"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 3.8 : 2.3}
                      className={
                        isSelected
                          ? 'fill-[#146C53] dark:fill-[#2EB88B] stroke-white dark:stroke-[#121315]'
                          : 'fill-white dark:fill-[#1A1C20] stroke-[#146C53] dark:stroke-[#2EB88B]'
                      }
                      strokeWidth="1.5"
                    />
                    <text
                      x={pt.x}
                      y={81}
                      textAnchor="middle"
                      className={
                        isSelected
                          ? 'fill-[#146C53] dark:fill-[#2EB88B]'
                          : 'fill-[#575B62] dark:fill-[#A3A7AE]'
                      }
                      style={{ fontSize: '10px', fontWeight: isSelected ? 600 : 500 }}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Sparkline 2: Historical Payout Earnings Over Time */}
        <div
          data-testid="sparkline-earnings-panel"
          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                <Wallet className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46]" />
                <span>Historical Payout Earnings (USD)</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span
                  data-testid="sparkline-earnings-value"
                  className="font-mono-tabular tabular-nums text-2xl sm:text-3xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                >
                  $
                  {(activePayoutPoint
                    ? activePayoutPoint.value
                    : data.totalHistoricalEarningsUsd
                  ).toLocaleString()}
                </span>
                <span className="text-xs font-mono-tabular tabular-nums font-semibold text-[#C4622D] dark:text-[#E07B46]">
                  +${data.latestPayoutUsd.toLocaleString()} latest
                </span>
              </div>
            </div>

            <span className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
              {activePayoutPoint?.label ?? 'Live'}
            </span>
          </div>

          <div className="w-full">
            <svg
              viewBox={`0 0 ${svgWidth} 86`}
              className="w-full h-24 overflow-visible"
              role="img"
              aria-label={`Historical payout earnings sparkline reaching ${data.totalHistoricalEarningsUsd} US dollars`}
            >
              <defs>
                <linearGradient id={`${idPrefix}-payout-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C4622D" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#C4622D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line
                x1={horizontalPad}
                y1={topPad}
                x2={svgWidth - horizontalPad}
                y2={topPad}
                className="stroke-[#E8E3DB] dark:stroke-[#2C3037]"
                strokeWidth="0.75"
                strokeDasharray="3 4"
              />
              <line
                x1={horizontalPad}
                y1={baselineY}
                x2={svgWidth - horizontalPad}
                y2={baselineY}
                className="stroke-[#E8E3DB] dark:stroke-[#2C3037]"
                strokeWidth="0.85"
              />

              <path
                d={buildAreaPath(payoutCoords, baselineY)}
                fill={`url(#${idPrefix}-payout-fill)`}
              />

              <path
                d={buildSmoothLinePath(payoutCoords)}
                fill="none"
                className="stroke-[#C4622D] dark:stroke-[#E07B46]"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {payoutCoords.map((pt, idx) => {
                const isSelected = idx === activePayoutIdx;
                return (
                  <g
                    key={pt.label}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPayoutIdx(idx)}
                    onMouseLeave={() => setHoveredPayoutIdx(null)}
                    onClick={() => setHoveredPayoutIdx(idx)}
                  >
                    <rect
                      x={pt.x - 16}
                      y={0}
                      width={32}
                      height={84}
                      fill="transparent"
                    />
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="7"
                        className="fill-[#C4622D]/15 dark:fill-[#E07B46]/20"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 3.8 : 2.3}
                      className={
                        isSelected
                          ? 'fill-[#C4622D] dark:fill-[#E07B46] stroke-white dark:stroke-[#121315]'
                          : 'fill-white dark:fill-[#1A1C20] stroke-[#C4622D] dark:stroke-[#E07B46]'
                      }
                      strokeWidth="1.5"
                    />
                    <text
                      x={pt.x}
                      y={81}
                      textAnchor="middle"
                      className={
                        isSelected
                          ? 'fill-[#C4622D] dark:fill-[#E07B46]'
                          : 'fill-[#575B62] dark:fill-[#A3A7AE]'
                      }
                      style={{ fontSize: '10px', fontWeight: isSelected ? 600 : 500 }}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
