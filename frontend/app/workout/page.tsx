"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Plus,
  Clock,
  X,
  Dumbbell,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../lib/api";
import { PageLoader } from "../../components/ui/Loader";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ExercisePicker } from "../../components/routines/ExercisePicker";
import { useRestTimerStore } from "../../store/restTimerStore";
import {
  WorkoutExerciseCard,
  WorkoutExerciseItem,
} from "../../components/workout/WorkoutExerciseCard";
import { WorkoutSummaryModal } from "../../components/workout/WorkoutSummaryModal";

function WorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const routineIdFromUrl = searchParams.get("routineId");

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<any | null>(null);

  // 1. Fetch User Profile (for Unit)
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/profile");
      return data;
    },
  });

  const preferredUnit = profile?.preferredUnit || "kg";

  // 2. Fetch Active Workout
  const {
    data: activeWorkout,
    isLoading: isLoadingActive,
    error: activeError,
  } = useQuery({
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
    retry: false,
  });

  // 3. Fetch User Routines (for launcher screen)
  const { data: routines, isLoading: isLoadingRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data } = await apiClient.get("/routines");
      return data;
    },
    enabled: !activeWorkout,
  });

  // 4. Start Workout Mutation
  const startWorkoutMutation = useMutation({
    mutationFn: async (routineId?: string) => {
      const { data } = await apiClient.post("/workouts", {
        routineId: routineId || undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["activeWorkout"], data);
      queryClient.invalidateQueries({ queryKey: ["activeWorkout"] });
    },
  });

  // 5. Add Exercise to Active Workout Mutation
  const addExerciseMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      if (!activeWorkout) return;
      await apiClient.post(`/workouts/${activeWorkout.id}/exercises`, {
        exerciseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeWorkout"] });
      setIsPickerOpen(false);
    },
  });

  // 6. Finish Workout Mutation
  const finishWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkout) return;
      const { data } = await apiClient.patch(
        `/workouts/${activeWorkout.id}/finish`
      );
      return data;
    },
    onSuccess: (data) => {
      // Calculate summary metrics
      let totalVol = 0;
      let completedSets = 0;
      data.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((s: any) => {
          if (s.isCompleted) {
            completedSets += 1;
            totalVol += (s.weight || 0) * (s.reps || 0);
          }
        });
      });

      setCompletedSummary({
        durationSeconds: data.durationSeconds || elapsedSeconds,
        totalVolume: totalVol,
        completedSetsCount: completedSets,
        totalExercisesCount: data.exercises?.length || 0,
      });

      queryClient.invalidateQueries({ queryKey: ["activeWorkout"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  // 7. Cancel Workout Mutation
  const cancelWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkout) return;
      await apiClient.delete(`/workouts/${activeWorkout.id}`);
    },
    onSuccess: () => {
      queryClient.setQueryData(["activeWorkout"], null);
      queryClient.invalidateQueries({ queryKey: ["activeWorkout"] });
      setShowCancelModal(false);
      useRestTimerStore.getState().stopTimer();
    },
  });

  // Automatically start routine if passed via URL and no workout is active
  useEffect(() => {
    if (routineIdFromUrl && !isLoadingActive && !activeWorkout && !startWorkoutMutation.isPending) {
      startWorkoutMutation.mutate(routineIdFromUrl);
    }
  }, [routineIdFromUrl, isLoadingActive, activeWorkout]);

  // Live Timer computation
  useEffect(() => {
    if (!activeWorkout?.startedAt) return;

    const startTime = new Date(activeWorkout.startedAt).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) {
      return `${hours}:${remMins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSetCompleted = (restSeconds: number) => {
    useRestTimerStore.getState().startTimer(restSeconds || 90);
  };

  if (isLoadingActive) return <PageLoader />;

  // -------------------------------------------------------------
  // VIEW 1: NO ACTIVE WORKOUT -> WORKOUT LAUNCHER SCREEN
  // -------------------------------------------------------------
  if (!activeWorkout) {
    return (
      <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full pb-24">
        {/* Header */}
        <header className="pb-6 mb-6 border-b border-border">
          <h1 className="text-3xl font-light tracking-tight">Workout</h1>
          <p className="text-sm opacity-70 mt-1">
            Start logging your live gym session
          </p>
        </header>

        {/* Quick Empty Workout Option */}
        <div className="mb-8">
          <button
            onClick={() => startWorkoutMutation.mutate(undefined)}
            disabled={startWorkoutMutation.isPending}
            className="w-full flex items-center justify-between p-6 bg-surface border border-border hover:border-primary/50 rounded-2xl transition-all group shadow-sm text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <Play size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Quick Start Workout</h3>
                <p className="text-xs sm:text-sm opacity-70 mt-0.5">
                  Start an empty session and add exercises on the go
                </p>
              </div>
            </div>
            <ChevronRight className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Routines Launcher */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Start from Routine</h2>
            <Link
              href="/routines/new"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Create Routine</span>
            </Link>
          </div>

          {isLoadingRoutines ? (
            <div className="py-8 text-center text-sm opacity-60">
              Loading routines...
            </div>
          ) : routines?.length === 0 ? (
            <div className="p-8 border border-dashed border-border rounded-2xl text-center bg-surface/50">
              <Dumbbell size={32} className="mx-auto opacity-30 mb-3" />
              <h3 className="font-medium text-base mb-1">No routines saved</h3>
              <p className="text-xs opacity-60 max-w-xs mx-auto mb-4">
                Build routine splits to quickly launch pre-configured workouts
                with your target rep ranges.
              </p>
              <Link
                href="/routines/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-medium hover:bg-border/30 transition-colors"
              >
                <Plus size={14} />
                Create New Routine
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {routines?.map((routine: any) => (
                <div
                  key={routine.id}
                  className="p-5 bg-surface border border-border rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-base">{routine.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-border/40 rounded-md font-medium text-foreground/70">
                        {routine.exercises.length} Ex
                      </span>
                    </div>
                    {routine.description && (
                      <p className="text-xs opacity-70 line-clamp-2">
                        {routine.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => startWorkoutMutation.mutate(routine.id)}
                    disabled={startWorkoutMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 hover:border-primary rounded-xl text-xs font-medium transition-all"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Start Routine</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE LIVE WORKOUT SESSION
  // -------------------------------------------------------------
  const exercises = activeWorkout.exercises || [];
  const routineName = activeWorkout.routine?.name || "Active Workout";

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full pb-32 relative">
      {/* Sticky Active Session Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-md z-30 pt-2 pb-4 mb-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-tag-green-text flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tag-green-text animate-ping inline-block" />
              Live Session
            </span>
            <h1 className="text-xl sm:text-2xl font-light tracking-tight truncate max-w-[200px] sm:max-w-md">
              {routineName}
            </h1>
          </div>
        </div>

        {/* Live Elapsed Duration Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-xl font-mono text-sm font-semibold tracking-tight shadow-sm">
            <Clock size={15} className="text-primary" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            onClick={() => setShowCancelModal(true)}
            title="Discard workout"
            className="p-2 text-foreground/40 hover:text-tag-red-text hover:bg-tag-red-bg rounded-xl border border-transparent hover:border-tag-red-text/20 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Exercise Cards List */}
      <div className="space-y-6 mb-8">
        {exercises.length === 0 ? (
          <div className="p-12 border border-dashed border-border rounded-3xl text-center bg-surface/50 flex flex-col items-center justify-center">
            <Dumbbell size={36} className="opacity-30 mb-3" />
            <h3 className="font-medium text-lg mb-1">No exercises added</h3>
            <p className="text-sm opacity-60 max-w-xs mb-6">
              Add your first exercise to start recording sets, weights, and reps.
            </p>
            <button
              onClick={() => setIsPickerOpen(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + Add Exercise
            </button>
          </div>
        ) : (
          exercises.map((item: WorkoutExerciseItem) => (
            <WorkoutExerciseCard
              key={item.id}
              workoutExercise={item}
              preferredUnit={preferredUnit}
              onSetCompleted={handleSetCompleted}
            />
          ))
        )}
      </div>

      {/* Add Exercise Action */}
      {exercises.length > 0 && (
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="w-full py-4 border-2 border-dashed border-border hover:border-primary/50 hover:bg-border/20 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center gap-2 opacity-80 hover:opacity-100 mb-8"
        >
          <Plus size={18} />
          Add Another Exercise
        </button>
      )}

      {/* Bottom Floating Bar: Finish Workout */}
      <div className="fixed bottom-20 md:bottom-6 left-0 md:left-64 right-0 flex justify-center px-4 z-30 pointer-events-none">
        <div className="w-full max-w-4xl bg-surface/90 backdrop-blur-md border border-border p-2 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => finishWorkoutMutation.mutate()}
            disabled={finishWorkoutMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium tracking-wide shadow-md shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            <CheckCircle size={18} />
            <span>
              {finishWorkoutMutation.isPending
                ? "Saving Workout..."
                : "Finish Workout"}
            </span>
          </button>
        </div>
      </div>


      {/* Exercise Picker Modal */}
      {isPickerOpen && (
        <ExercisePicker
          onClose={() => setIsPickerOpen(false)}
          onSelect={(exercise) => addExerciseMutation.mutate(exercise.id)}
          selectedIds={exercises.map((e: any) => e.exerciseId)}
        />
      )}

      {/* Cancel Workout Confirmation Modal */}
      {showCancelModal && (
        <ConfirmModal
          title="Discard Workout"
          description="Are you sure you want to discard this live session? All logged sets from this workout will be erased."
          confirmText="Discard Workout"
          isDestructive={true}
          onConfirm={() => cancelWorkoutMutation.mutate()}
          onCancel={() => setShowCancelModal(false)}
        />
      )}

      {/* Workout Completion Ceremony Summary */}
      {completedSummary && (
        <WorkoutSummaryModal
          durationSeconds={completedSummary.durationSeconds}
          totalVolume={completedSummary.totalVolume}
          completedSetsCount={completedSummary.completedSetsCount}
          totalExercisesCount={completedSummary.totalExercisesCount}
          preferredUnit={preferredUnit}
          onDone={() => {
            setCompletedSummary(null);
            router.push("/");
          }}
        />
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <WorkoutContent />
    </Suspense>
  );
}
