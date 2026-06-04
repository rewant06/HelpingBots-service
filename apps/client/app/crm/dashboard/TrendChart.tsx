'use client';

import { useMemo } from 'react';
import type { AnalyticsTrendPoint } from '@/lib/crm/types';

// ─── Chart constants ──────────────────────────────────────────────────────────

const W = 560;
const H = 180;
const PAD = { top: 10, right: 10, bottom: 32, left: 28 };

interface TrendChartProps {
  data: AnalyticsTrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const computed = useMemo(() => {
    const iW = W - PAD.left - PAD.right;
    const iH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(...data.map((d) => d.leads), 1);

    const xAt = (i: number) =>
      data.length > 1 ? (i / (data.length - 1)) * iW : iW / 2;
    const yAt = (v: number) => iH - (v / maxVal) * iH;

    const makeLine = (vals: number[]) =>
      vals
        .map(
          (v, i) =>
            `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`,
        )
        .join(' ');

    const makeArea = (vals: number[]) => {
      const line = makeLine(vals);
      const lastX = xAt(vals.length - 1).toFixed(1);
      return `${line} L${lastX},${iH} L0,${iH} Z`;
    };

    const yTicks = [
      0,
      Math.round(maxVal / 2),
      maxVal,
    ].filter((v, i, arr) => arr.indexOf(v) === i);

    return {
      iW,
      iH,
      maxVal,
      yTicks,
      yAt,
      leadsLine: makeLine(data.map((d) => d.leads)),
      enrolledLine: makeLine(data.map((d) => d.enrolled)),
      leadsArea: makeArea(data.map((d) => d.leads)),
      enrolledArea: makeArea(data.map((d) => d.enrolled)),
      dots: data.map((d, i) => ({
        x: xAt(i),
        leadsY: yAt(d.leads),
        enrolledY: yAt(d.enrolled),
        label: d.label,
      })),
    };
  }, [data]);

  const { iW, iH, maxVal, yTicks, yAt, leadsLine, enrolledLine, leadsArea, enrolledArea, dots } =
    computed;

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-72"
          role="img"
          aria-label="Weekly lead and enrollment trend"
        >
          <defs>
            <linearGradient id="hb-leads-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hb-enrolled-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {/* Horizontal grid lines + Y-axis labels */}
            {yTicks.map((tick) => {
              const y = iH - (tick / maxVal) * iH;
              return (
                <g key={tick}>
                  <line
                    x1={0}
                    y1={y}
                    x2={iW}
                    y2={y}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                    strokeDasharray={tick === 0 ? undefined : '4 3'}
                  />
                  <text
                    x={-5}
                    y={y + 4}
                    textAnchor="end"
                    fill="hsl(var(--muted-foreground))"
                    fontSize={9}
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Gradient fill areas */}
            <path d={leadsArea} fill="url(#hb-leads-grad)" />
            <path d={enrolledArea} fill="url(#hb-enrolled-grad)" />

            {/* Lines */}
            <path
              d={leadsLine}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={enrolledLine}
              fill="none"
              stroke="#10b981"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data point dots */}
            {dots.map((d, i) => (
              <g key={i}>
                <circle
                  cx={d.x}
                  cy={d.leadsY}
                  r={3.5}
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--background))"
                  strokeWidth={1.5}
                />
                <circle
                  cx={d.x}
                  cy={d.enrolledY}
                  r={3.5}
                  fill="#10b981"
                  stroke="hsl(var(--background))"
                  strokeWidth={1.5}
                />
              </g>
            ))}

            {/* X-axis week labels */}
            {dots.map((d, i) => (
              <text
                key={i}
                x={d.x}
                y={iH + 20}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={9}
              >
                {d.label}
              </text>
            ))}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-5 px-1">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Total Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-5 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Enrolled</span>
        </div>
      </div>
    </div>
  );
}