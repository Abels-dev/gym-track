"use client";

import { Check, Flame, Target, Trophy } from "lucide-react";

interface WeeklyConsistencyRingProps {
  currentWorkouts: number;
  targetDays: number;
  daysWithWorkout: number[]; // 1=Mon ... 7=Sun
}

export function WeeklyConsistencyRing({
  currentWorkouts,
  targetDays,
  daysWithWorkout = [],
}: WeeklyConsistencyRingProps) {
  const target = Math.max(1, targetDays);
  const percentage = Math.min(100, Math.round((currentWorkouts / target) * 100));

  // SVG Ring calculation
  const size = 130;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const days = [
    { day: "M", index: 1 },
    { day: "T", index: 2 },
    { day: "W", index: 3 },
    { day: "T", index: 4 },
    { day: "F", index: 5 },
    { day: "S", index: 6 },
    { day: "S", index: 7 },
  ];

  const isCompleted = currentWorkouts >= target;
  const remaining = Math.max(0, target - currentWorkouts);

  return (
    <div className="p-5 sm:p-6 bg-surface border border-border rounded-3xl shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={18} className="opacity-70 text-primary" />
          <h3 className="font-medium text-base">Weekly Target</h3>
        </div>
        <span
          className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
            isCompleted
              ? "bg-tag-green-bg text-tag-green-text border-tag-green-text/20"
              : "bg-tag-yellow-bg text-tag-yellow-text border-tag-yellow-text/20"
          }`}
        >
          {isCompleted ? "Goal Achieved" : `${percentage}%`}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-2">
        {/* Circular Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-border/40"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${
                isCompleted ? "text-tag-green-text" : "text-primary"
              }`}
              fill="transparent"
            />
          </svg>

          {/* Center Info */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-mono tracking-tight">
              {currentWorkouts}
              <span className="text-sm font-normal opacity-50">/{target}</span>
            </span>
            <span className="text-[10px] uppercase font-semibold opacity-50 tracking-wider">
              Workouts
            </span>
          </div>
        </div>

        {/* Days of Week Tracker */}
        <div className="flex-1 w-full flex flex-col justify-center">
          <div className="text-xs font-medium opacity-70 mb-3 text-center sm:text-left">
            {isCompleted ? (
              <span className="text-tag-green-text font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                <Trophy size={14} /> Weekly goal accomplished!
              </span>
            ) : (
              <span>
                {remaining} {remaining === 1 ? "workout" : "workouts"} left this week
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1.5 bg-background p-2.5 rounded-2xl border border-border">
            {days.map(({ day, index }) => {
              const active = daysWithWorkout.includes(index);
              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <span className="text-[10px] font-semibold opacity-50">
                    {day}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-medium transition-all ${
                      active
                        ? "bg-tag-green-bg text-tag-green-text border border-tag-green-text/30 shadow-sm"
                        : "bg-surface border border-border/60 text-foreground/30"
                    }`}
                  >
                    {active ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
