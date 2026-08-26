"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Play,
  Dumbbell,
  Flame,
  TrendingUp,
  ArrowRight,
  List,
  Activity,
  Plus,
} from "lucide-react";
import { apiClient } from "../lib/api";
import { PageLoader } from "../components/ui/Loader";
import { useAuthStore } from "../store/authStore";
import { WeeklyConsistencyRing } from "../components/analytics/WeeklyConsistencyRing";
import { VolumeTrendChart } from "../components/analytics/VolumeTrendChart";
import { MuscleSplitDonut } from "../components/analytics/MuscleSplitDonut";
import { CoachInsightsCard } from "../components/analytics/CoachInsightsCard";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // 1. Fetch Analytics Summary
  const { data: summary, isLoading: isLoadingSummary, isRefetching: isRefetchingSummary } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/summary");
      return data;
    },
    refetchOnMount: "always",
  });

  // 2. Fetch Muscle Distribution
  const { data: muscleDist } = useQuery<Record<string, number>>({
    queryKey: ["analytics", "muscle-distribution"],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/muscle-distribution");
      return data;
    },
    refetchOnMount: "always",
  });

  // 3. Fetch User Profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/profile");
      return data;
    },
  });

  // 4. Check Active Workout (Immediate freshness)
  const { data: activeWorkout, isRefetching: isRefetchingActive } = useQuery({
    queryKey: ["activeWorkout"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/workouts/active");
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  const preferredUnit = profile?.preferredUnit || "kg";
  const isRefreshing = isRefetchingSummary || isRefetchingActive;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["activeWorkout"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["workoutHistory"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full pb-28">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
            Welcome back
          </span>
          <h1 className="text-3xl font-light tracking-tight capitalize">
            {user?.fullName || "Dashboard"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Refresh dashboard data"
            className="p-2.5 bg-surface border border-border hover:bg-border/30 rounded-xl text-foreground/70 hover:text-foreground transition-colors"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-primary" : ""} />
          </button>
          <Link
            href="/workout"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm shadow-md shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Start Workout</span>
          </Link>
        </div>
      </header>

      {/* Active Workout In Progress Banner */}
      {activeWorkout && (
        <div className="mb-6 p-4 sm:p-5 bg-surface border-2 border-primary rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-3 h-3 rounded-full bg-tag-green-text animate-ping" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-tag-green-text">
                Live Workout In Progress
              </span>
              <h3 className="font-medium text-lg">
                {activeWorkout.routine?.name || "Active Session"}
              </h3>
              <p className="text-xs opacity-70 mt-0.5">
                {activeWorkout.exercises?.length || 0} exercises in progress
              </p>
            </div>
          </div>

          <Link
            href="/workout"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <span>Resume Workout</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Weekly Consistency Ring & Quick Launcher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <WeeklyConsistencyRing
          currentWorkouts={summary?.currentWeekWorkoutsCount ?? 0}
          targetDays={summary?.targetDaysPerWeek ?? 4}
          daysWithWorkout={summary?.currentWeekDaysWithWorkout ?? []}
        />

        {/* Quick Launch Cards Stack */}
        <div className="flex flex-col gap-3 justify-between">
          <Link
            href="/workout"
            className="p-5 bg-surface border border-border rounded-3xl hover:border-primary/50 transition-all flex items-center justify-between group shadow-sm flex-1"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:scale-105 transition-transform">
                <Play size={20} fill="currentColor" />
              </div>
              <div>
                <h3 className="font-medium text-base">Quick Session</h3>
                <p className="text-xs opacity-70">Log an on-the-go workout</p>
              </div>
            </div>
            <ChevronRight className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/routines"
            className="p-5 bg-surface border border-border rounded-3xl hover:border-primary/50 transition-all flex items-center justify-between group shadow-sm flex-1"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:scale-105 transition-transform">
                <List size={20} />
              </div>
              <div>
                <h3 className="font-medium text-base">My Routines</h3>
                <p className="text-xs opacity-70">Manage training splits</p>
              </div>
            </div>
            <ChevronRight className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* Smart Coach Recommendations */}
      <CoachInsightsCard />

      {/* Lifetime Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="border border-border bg-surface p-5 rounded-3xl flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 opacity-70 mb-1">
            <Dumbbell size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Workouts
            </span>
          </div>
          <span className="text-3xl font-semibold tracking-tight">
            {isLoadingSummary ? "--" : summary?.totalWorkouts ?? 0}
          </span>
        </div>

        <div className="border border-border bg-surface p-5 rounded-3xl flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 opacity-70 mb-1">
            <Flame size={16} className="text-tag-red-text" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Weekly Streak
            </span>
          </div>
          <span className="text-3xl font-semibold tracking-tight">
            {isLoadingSummary
              ? "--"
              : `${summary?.currentWeeklyStreak ?? 0} ${
                  summary?.currentWeeklyStreak === 1 ? "week" : "weeks"
                }`}
          </span>
        </div>

        <div className="border border-border bg-surface p-5 rounded-3xl flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 opacity-70 mb-1">
            <TrendingUp size={16} className="text-tag-green-text" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Volume
            </span>
          </div>
          <span className="text-3xl font-semibold tracking-tight">
            {isLoadingSummary
              ? "--"
              : `${(summary?.totalVolume ?? 0).toLocaleString()} ${preferredUnit}`}
          </span>
        </div>
      </div>

      {/* Volume & Frequency Trends Chart */}
      <div className="mb-6">
        <VolumeTrendChart
          trends={summary?.weeklyTrends ?? []}
          preferredUnit={preferredUnit}
        />
      </div>

      {/* Muscle Focus & Split Analysis */}
      <div>
        <MuscleSplitDonut distribution={muscleDist ?? {}} />
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
