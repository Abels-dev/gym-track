"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit3, Play, Trash2, Dumbbell, Info } from "lucide-react";
import { apiClient } from "../../../lib/api";
import { PageLoader } from "../../../components/ui/Loader";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { ExerciseDetailModal } from "../../../components/routines/ExerciseDetailModal";

export default function RoutineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const routineId = params.id as string;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<any | null>(null);

  const { data: routine, isLoading } = useQuery({
    queryKey: ["routines", routineId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/routines/${routineId}`);
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/routines/${routineId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      router.push("/routines");
    },
  });

  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/workouts", {
        routineId: routine.id,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["activeWorkout"], data);
      queryClient.invalidateQueries({ queryKey: ["activeWorkout"] });
      router.push("/workout");
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleStartWorkout = () => {
    startWorkoutMutation.mutate();
  };

  if (isLoading) return <PageLoader />;
  if (!routine) return <div className="p-8 text-center">Routine not found.</div>;

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-6xl mx-auto w-full pb-28">
      <header className="flex items-center justify-between pb-6 border-b border-border mb-6 sticky top-0 bg-background z-10 pt-4">
        <div className="flex items-center gap-4">
          <Link href="/routines" className="p-2 -ml-2 rounded-md hover:bg-border/50 transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-tight">{routine.name}</h1>
            <p className="text-xs opacity-70 mt-1">
              {routine.exercises.length} Exercises
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/routines/${routine.id}/edit`}
            className="p-2 bg-surface border border-border rounded-md hover:border-primary/50 transition-colors"
          >
            <Edit3 size={18} />
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-tag-red-text bg-tag-red-bg border border-tag-red-text/20 rounded-md hover:opacity-80 transition-opacity"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {routine.description && (
        <p className="text-sm opacity-80 mb-8">{routine.description}</p>
      )}

      <div className="space-y-4">
        {routine.exercises.map((ex: any) => (
          <div key={ex.id} className="p-4 bg-surface border border-border rounded-xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-border/30 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                  {ex.exercise.imageUrl ? (
                    <img src={`/${ex.exercise.imageUrl}`} alt={ex.exercise.name} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                  ) : (
                    <Dumbbell size={16} className="opacity-50" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">{ex.exercise.name}</h3>
                  <p className="text-xs uppercase tracking-wider font-semibold opacity-50 mt-0.5">
                    {ex.exercise.primaryMuscle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailExercise(ex.exercise)}
                title="Exercise guide & video"
                className="p-2 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Info size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50 text-sm">
              <div className="flex flex-col">
                <span className="text-xs opacity-50 font-medium uppercase tracking-wider">Sets</span>
                <span className="font-medium">{ex.targetSets}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs opacity-50 font-medium uppercase tracking-wider">Reps</span>
                <span className="font-medium">
                  {ex.targetRepMin} - {ex.targetRepMax}
                </span>
              </div>
              {ex.restSeconds > 0 && (
                <div className="flex flex-col">
                  <span className="text-xs opacity-50 font-medium uppercase tracking-wider">Rest</span>
                  <span className="font-medium">{ex.restSeconds}s</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-20 md:bottom-8 left-0 md:left-64 right-0 flex justify-center px-4 z-20 pointer-events-none">
        <div className="w-full max-w-4xl pointer-events-auto">
          <button
            onClick={handleStartWorkout}
            disabled={startWorkoutMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-medium tracking-wide shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            <Play size={18} fill="currentColor" />
            <span>{startWorkoutMutation.isPending ? "Starting..." : "Start Workout"}</span>
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Routine"
          description={`Are you sure you want to delete "${routine.name}"? This action cannot be undone.`}
          confirmText="Delete"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {selectedDetailExercise && (
        <ExerciseDetailModal
          exercise={selectedDetailExercise}
          onClose={() => setSelectedDetailExercise(null)}
        />
      )}
    </div>
  );
}
