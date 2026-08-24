"use client";

import { useState } from "react";
import { TrendingUp, BarChart3, Dumbbell } from "lucide-react";

interface WeeklyTrendItem {
  timestamp: number;
  label: string;
  volume: number;
  workoutsCount: number;
}

interface VolumeTrendChartProps {
  trends: WeeklyTrendItem[];
  preferredUnit: string;
}

export function VolumeTrendChart({
  trends = [],
  preferredUnit,
}: VolumeTrendChartProps) {
  const [metric, setMetric] = useState<"volume" | "count">("volume");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVolume = Math.max(1, ...trends.map((t) => t.volume));
  const maxCount = Math.max(1, ...trends.map((t) => t.workoutsCount));

  const totalVolumeInPeriod = trends.reduce((acc, t) => acc + t.volume, 0);
  const avgWeeklyVolume = Math.round(totalVolumeInPeriod / Math.max(1, trends.length));

  return (
    <div className="p-5 sm:p-6 bg-surface border border-border rounded-3xl shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary opacity-70" />
            <h3 className="font-medium text-base">Progress Trends</h3>
          </div>
          <p className="text-xs opacity-60 mt-0.5">
            Avg {avgWeeklyVolume.toLocaleString()} {preferredUnit} / week
          </p>
        </div>

        {/* Metric Toggle */}
        <div className="flex bg-background border border-border p-1 rounded-xl gap-1 self-start sm:self-auto">
          <button
            onClick={() => setMetric("volume")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              metric === "volume"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground opacity-60 hover:opacity-100"
            }`}
          >
            Volume
          </button>
          <button
            onClick={() => setMetric("count")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              metric === "count"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground opacity-60 hover:opacity-100"
            }`}
          >
            Workouts
          </button>
        </div>
      </div>

      {/* Chart Bars */}
      <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-1 relative">
        {trends.map((item, idx) => {
          const val = metric === "volume" ? item.volume : item.workoutsCount;
          const maxVal = metric === "volume" ? maxVolume : maxCount;
          const heightPercent = Math.max(8, Math.round((val / maxVal) * 100));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.timestamp}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 z-20 bg-foreground text-background text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                  {metric === "volume"
                    ? `${item.volume.toLocaleString()} ${preferredUnit}`
                    : `${item.workoutsCount} workouts`}
                </div>
              )}

              {/* Bar */}
              <div className="w-full max-w-[42px] bg-border/40 rounded-xl overflow-hidden h-full flex flex-col justify-end p-0.5">
                <div
                  className={`w-full rounded-lg transition-all duration-500 ease-out ${
                    isHovered
                      ? "bg-primary shadow-md"
                      : val > 0
                      ? "bg-primary/80 group-hover:bg-primary"
                      : "bg-transparent"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* X-Axis Label */}
              <span className="text-[10px] font-medium opacity-50 mt-2 truncate max-w-full text-center">
                {item.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
