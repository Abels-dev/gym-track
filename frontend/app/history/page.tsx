"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Dumbbell,
  Trophy,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../lib/api";
import { PageLoader } from "../../components/ui/Loader";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

export default function HistoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"history" | "prs">("history");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [prSearch, setPrSearch] = useState("");

  // 1. Fetch User Profile (for Unit)
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/profile");
      return data;
    },
  });

  const preferredUnit = profile?.preferredUnit || "kg";

  // 2. Fetch Workout History
  const {
    data: historyLogs,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ["workoutHistory"],
    queryFn: async () => {
      const { data } = await apiClient.get("/workouts");
      return data;
    },
  });

  // 3. Fetch PRs
  const { data: prs, isLoading: isLoadingPrs } = useQuery<
    { exerciseName: string; maxWeight: number }[]
  >({
    queryKey: ["prs"],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/prs");
      return data;
    },
  });

  // 4. Delete Log Mutation
  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/workouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutHistory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["prs"] });
      setDeleteTargetId(null);
    },
  });

  // 5. Repeat Workout Mutation
  const repeatWorkoutMutation = useMutation({
    mutationFn: async (routineId?: string) => {
      const { data } = await apiClient.post("/workouts", {
        routineId: routineId || undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeWorkout"] });
      router.push("/workout");
    },
  });

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "--";
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}h ${remMins}m`;
    return `${mins} min`;
  };

  const calculateVolume = (log: any) => {
    let total = 0;
    log.exercises?.forEach((ex: any) => {
      ex.sets?.forEach((s: any) => {
        if (s.isCompleted) {
          total += (s.weight || 0) * (s.reps || 0);
        }
      });
    });
    return total;
  };

  const countCompletedSets = (log: any) => {
    let count = 0;
    log.exercises?.forEach((ex: any) => {
      ex.sets?.forEach((s: any) => {
        if (s.isCompleted) count += 1;
      });
    });
    return count;
  };

  const filteredPrs = prs?.filter((p) =>
    p.exerciseName.toLowerCase().includes(prSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight">History & PRs</h1>
          <p className="text-sm opacity-70 mt-1">
            Review past workouts and lifetime achievements
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-surface border border-border p-1 rounded-xl gap-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground opacity-60 hover:opacity-100"
            }`}
          >
            Workout Logs
          </button>
          <button
            onClick={() => setActiveTab("prs")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "prs"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground opacity-60 hover:opacity-100"
            }`}
          >
            <Trophy size={14} />
            <span>Personal Records</span>
          </button>
        </div>
      </header>

      {/* ---------------- TAB 1: WORKOUT LOGS ---------------- */}
      {activeTab === "history" && (
        <div>
          {isLoadingHistory ? (
            <PageLoader />
          ) : historyLogs?.length === 0 ? (
            <div className="p-12 border border-dashed border-border rounded-3xl text-center bg-surface/50 flex flex-col items-center justify-center">
              <Dumbbell size={36} className="opacity-30 mb-3" />
              <h3 className="font-medium text-lg mb-1">No completed workouts yet</h3>
              <p className="text-sm opacity-60 max-w-xs mb-6">
                Start your first live workout to start building your training history.
              </p>
              <Link
                href="/workout"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Play size={16} fill="currentColor" />
                <span>Start a Workout</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {historyLogs?.map((log: any) => {
                const isExpanded = expandedLogId === log.id;
                const volume = calculateVolume(log);
                const setsCount = countCompletedSets(log);
                const dateObj = new Date(log.startedAt);

                return (
                  <div
                    key={log.id}
                    className="bg-surface border border-border hover:border-primary/30 rounded-2xl p-5 shadow-sm transition-all"
                  >
                    {/* Log Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-tag-blue-text bg-tag-blue-bg border border-tag-blue-text/20 px-2 py-0.5 rounded-md">
                            {log.routine?.name || "Quick Session"}
                          </span>
                        </div>
                        <h3 className="font-medium text-base sm:text-lg">
                          {dateObj.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            repeatWorkoutMutation.mutate(log.routineId || undefined)
                          }
                          disabled={repeatWorkoutMutation.isPending}
                          title="Repeat this workout"
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-lg text-xs font-medium transition-all"
                        >
                          <Play size={12} fill="currentColor" />
                          <span className="hidden sm:inline">Repeat</span>
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(log.id)}
                          title="Delete workout log"
                          className="p-1.5 text-foreground/30 hover:text-tag-red-text hover:bg-tag-red-bg rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-background border border-border rounded-xl text-xs mb-3">
                      <div className="flex flex-col">
                        <span className="opacity-50 font-medium uppercase tracking-wider text-[10px]">
                          Duration
                        </span>
                        <span className="font-semibold text-sm">
                          {formatDuration(log.durationSeconds)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="opacity-50 font-medium uppercase tracking-wider text-[10px]">
                          Volume
                        </span>
                        <span className="font-semibold text-sm">
                          {volume.toLocaleString()} {preferredUnit}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="opacity-50 font-medium uppercase tracking-wider text-[10px]">
                          Sets
                        </span>
                        <span className="font-semibold text-sm">
                          {setsCount} sets ({log.exercises?.length || 0} ex)
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    <button
                      onClick={() =>
                        setExpandedLogId(isExpanded ? null : log.id)
                      }
                      className="w-full flex items-center justify-between text-xs font-medium opacity-70 hover:opacity-100 pt-1"
                    >
                      <span>
                        {isExpanded
                          ? "Hide exercise breakdown"
                          : `View ${log.exercises?.length || 0} exercises`}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in fade-in duration-200">
                        {log.exercises?.map((item: any) => (
                          <div
                            key={item.id}
                            className="bg-background/60 p-3.5 rounded-xl border border-border/60"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">
                                {item.exercise.name}
                              </h4>
                              <span className="text-[10px] uppercase font-semibold opacity-60 bg-border/40 px-2 py-0.5 rounded">
                                {item.exercise.primaryMuscle}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs">
                              {item.sets
                                ?.filter((s: any) => s.isCompleted)
                                .map((s: any, sIdx: number) => (
                                  <span
                                    key={s.id}
                                    className="px-2 py-1 bg-surface border border-border rounded-md font-mono text-[11px]"
                                  >
                                    Set {sIdx + 1}:{" "}
                                    <strong>
                                      {s.weight} {preferredUnit}
                                    </strong>{" "}
                                    × {s.reps}
                                  </span>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: PERSONAL RECORDS (PRS) ---------------- */}
      {activeTab === "prs" && (
        <div>
          {/* Search */}
          <div className="relative mb-6">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"
            />
            <input
              type="text"
              placeholder="Search exercise PRs..."
              value={prSearch}
              onChange={(e) => setPrSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {isLoadingPrs ? (
            <PageLoader />
          ) : filteredPrs?.length === 0 ? (
            <div className="p-12 border border-dashed border-border rounded-3xl text-center bg-surface/50 flex flex-col items-center justify-center">
              <Trophy size={36} className="opacity-30 mb-3" />
              <h3 className="font-medium text-lg mb-1">
                {prSearch ? "No matching PRs found" : "No PRs recorded yet"}
              </h3>
              <p className="text-sm opacity-60 max-w-xs mb-6">
                Log completed workouts with weights to automatically generate your personal records showcase.
              </p>
              <Link
                href="/workout"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Log a Workout
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPrs?.map((pr) => (
                <div
                  key={pr.exerciseName}
                  className="p-5 bg-surface border border-border rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-tag-yellow-bg text-tag-yellow-text border border-tag-yellow-text/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <Trophy size={22} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm sm:text-base line-clamp-1">
                        {pr.exerciseName}
                      </h3>
                      <span className="text-xs opacity-50 font-medium uppercase tracking-wider">
                        All-Time Best
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold font-mono tracking-tight text-primary">
                      {pr.maxWeight}
                    </span>
                    <span className="text-xs font-semibold opacity-60 ml-1">
                      {preferredUnit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <ConfirmModal
          title="Delete Workout Log"
          description="Are you sure you want to permanently delete this workout session from your history? This will also update your volume and analytics."
          confirmText="Delete Log"
          isDestructive={true}
          onConfirm={() => deleteLogMutation.mutate(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
