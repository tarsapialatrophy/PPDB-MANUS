import { useState } from "react";
import { TrendDay } from "../types";

interface DailyTrendChartProps {
  data: TrendDay[];
}

export default function DailyTrendChart({ data }: DailyTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Fallback if data is empty or loading
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Memuat data tren...
      </div>
    );
  }

  // Get max values to normalize scale
  const maxVal = Math.max(...data.map((d) => d.jumlah), 5);

  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const points = data.map((d, idx) => {
    const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
    // Invert Y direction
    const y = paddingTop + chartHeight - (d.jumlah / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  // Create SVG path string for the line
  const linePath = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  // Create SVG path string for the gradient area under line
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : "";

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="relative flex-1">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const yVal = paddingTop + chartHeight * ratio;
            const labelVal = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={yVal}
                  x2={width - paddingRight}
                  y2={yVal}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={yVal + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          {areaPath && (
            <path d={areaPath} fill="url(#gradient-area)" />
          )}

          {/* Connecting Line */}
          {linePath && (
            <path
              d={linePath}
              className="stroke-emerald-500 dark:stroke-emerald-400"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx}>
                {/* Invisible larger hover trigger area */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="14"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                
                {/* Actual visual dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "6" : "4"}
                  className="fill-white stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-150"
                  strokeWidth={isHovered ? "3" : "2"}
                  pointerEvents="none"
                />
              </g>
            );
          })}

          {/* Horizontal Bottom Labels (Dates) */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-medium"
            >
              {p.tanggal}
            </text>
          ))}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {hoveredIdx !== null && (
          <div
            className="absolute z-10 p-2.5 bg-slate-900 border border-slate-800 text-white rounded-lg shadow-xl text-xs flex flex-col gap-0.5 pointer-events-none transition-all duration-150"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100 - 32}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <span className="text-slate-400 font-medium">
              {points[hoveredIdx].tanggal} (Tren)
            </span>
            <span className="font-bold text-emerald-400">
              {points[hoveredIdx].jumlah} Pendaftar Baru
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
