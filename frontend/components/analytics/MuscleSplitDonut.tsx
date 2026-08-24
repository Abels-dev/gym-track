"use client";

import { Activity } from "lucide-react";

interface MuscleSplitDonutProps {
  distribution: Record<string, number>;
}

export function MuscleSplitDonut({
  distribution = {},
}: MuscleSplitDonutProps) {
  const entries = Object.entries(distribution).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  );

  const totalSets = entries.reduce((acc, [, count]) => acc + count, 0);

  const colors = [
    { bg: "bg-tag-blue-bg", text: "text-tag-blue-text", bar: "bg-blue-500", hex: "#3A5B8C" },
    { bg: "bg-tag-green-bg", text: "text-tag-green-text", bar: "bg-emerald-500", hex: "#2D5A3F" },
    { bg: "bg-tag-red-bg", text: "text-tag-red-text", bar: "bg-rose-500", hex: "#8B3A3A" },
    { bg: "bg-tag-yellow-bg", text: "text-tag-yellow-text", bar: "bg-amber-500", hex: "#8F6B1E" },
  ];

  return (
    <div className="p-5 sm:p-6 bg-surface border border-border rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary opacity-70" />
          <h3 className="font-medium text-base">Muscle Split & Focus</h3>
        </div>
        <span className="text-xs opacity-50 font-medium">
          {totalSets} total sets
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-xs opacity-60">
          Complete your first workout to see your muscle split analysis.
        </div>
      ) : (
        <div>
          {/* Multi-Segment Stacked Progress Bar */}
          <div className="w-full h-3 bg-border/30 rounded-full overflow-hidden flex mb-6 p-0.5 gap-0.5">
            {entries.map(([muscle, count], idx) => {
              const pct = Math.max(2, Math.round((count / totalSets) * 100));
              const color = colors[idx % colors.length];
              return (
                <div
                  key={muscle}
                  style={{ width: `${pct}%` }}
                  title={`${muscle}: ${pct}% (${count} sets)`}
                  className={`h-full rounded-full transition-all duration-700 ${color.bar}`}
                />
              );
            })}
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {entries.map(([muscle, count], idx) => {
              const pct = Math.round((count / totalSets) * 100);
              const color = colors[idx % colors.length];

              return (
                <div
                  key={muscle}
                  className="p-3 bg-background border border-border rounded-2xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider opacity-70 truncate">
                      {muscle}
                    </span>
                    <span className="text-xs font-mono font-bold">
                      {pct}%
                    </span>
                  </div>
                  <span className="text-[10px] opacity-50">
                    {count} {count === 1 ? "set" : "sets"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
