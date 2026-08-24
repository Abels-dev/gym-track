"use client";

import { Trophy, Clock, Dumbbell, CheckCircle2, ArrowRight } from "lucide-react";

interface WorkoutSummaryModalProps {
  durationSeconds: number;
  totalVolume: number;
  completedSetsCount: number;
  totalExercisesCount: number;
  preferredUnit: string;
  onDone: () => void;
}

export function WorkoutSummaryModal({
  durationSeconds,
  totalVolume,
  completedSetsCount,
  totalExercisesCount,
  preferredUnit,
  onDone,
}: WorkoutSummaryModalProps) {
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remMins}m`;
    }
    return `${mins}m ${secs % 60}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Celebration Badge */}
        <div className="w-16 h-16 bg-tag-green-bg text-tag-green-text border border-tag-green-text/20 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
          <Trophy size={32} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-light tracking-tight mb-2">
          Workout Complete!
        </h2>
        <p className="text-sm opacity-70 mb-6">
          Great job! Your session and workout metrics have been logged successfully.
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8">
          <div className="bg-background border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 opacity-60 text-xs font-semibold uppercase tracking-wider mb-1">
              <Clock size={14} />
              <span>Duration</span>
            </div>
            <span className="text-xl font-semibold">
              {formatDuration(durationSeconds)}
            </span>
          </div>

          <div className="bg-background border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 opacity-60 text-xs font-semibold uppercase tracking-wider mb-1">
              <Dumbbell size={14} />
              <span>Volume</span>
            </div>
            <span className="text-xl font-semibold">
              {totalVolume.toLocaleString()} {preferredUnit}
            </span>
          </div>

          <div className="bg-background border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 opacity-60 text-xs font-semibold uppercase tracking-wider mb-1">
              <CheckCircle2 size={14} />
              <span>Sets Done</span>
            </div>
            <span className="text-xl font-semibold">{completedSetsCount}</span>
          </div>

          <div className="bg-background border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 opacity-60 text-xs font-semibold uppercase tracking-wider mb-1">
              <Dumbbell size={14} />
              <span>Exercises</span>
            </div>
            <span className="text-xl font-semibold">
              {totalExercisesCount}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onDone}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-medium tracking-wide shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          <span>View Dashboard</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
