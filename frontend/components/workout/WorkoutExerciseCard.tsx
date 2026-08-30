"use client";

import { useState, useEffect } from "react";
import { Check, CheckCheck, Plus, Trash2, Dumbbell, Info, AlertCircle } from "lucide-react";
import { apiClient } from "../../lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "../ui/ConfirmModal";
import { ExerciseDetailModal } from "../routines/ExerciseDetailModal";

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  isCompleted: boolean;
}

export interface WorkoutExerciseItem {
  id: string;
  workoutLogId: string;
  exerciseId: string;
  order: number;
  plannedSets?: number | null;
  plannedRepMin?: number | null;
  plannedRepMax?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
  exercise: {
    id: string;
    name: string;
    primaryMuscle: string;
    category: string;
    equipment: string;
    imageUrl?: string | null;
  };
  sets: WorkoutSet[];
}

interface WorkoutExerciseCardProps {
  workoutExercise: WorkoutExerciseItem;
  preferredUnit: string;
  onSetCompleted: (restSeconds: number) => void;
}

export function WorkoutExerciseCard({
  workoutExercise,
  preferredUnit,
  onSetCompleted,
}: WorkoutExerciseCardProps) {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localSets, setLocalSets] = useState<WorkoutSet[]>(workoutExercise.sets);

  const hasSets = localSets.length > 0;
  const allCompleted = hasSets && localSets.every((s) => s.isCompleted);
  const completedCount = localSets.filter((s) => s.isCompleted).length;

  // Fetch previous session performance for this exercise
  const { data: previousSets } = useQuery<
    { setNumber: number; weight: number; reps: number }[]
  >({
    queryKey: ["previousPerformance", workoutExercise.exerciseId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/workouts/exercises/${workoutExercise.exerciseId}/previous-performance`
      );
      return data;
    },
  });

  // Sync local sets when props update
  useEffect(() => {
    setLocalSets(workoutExercise.sets);
  }, [workoutExercise.sets]);

  const updateSetMutation = useMutation({
    mutationFn: async ({
      setId,
      data,
    }: {
      setId: string;
      data: { weight?: number; reps?: number; isCompleted?: boolean };
    }) => {
      await apiClient.patch(`/workouts/sets/${setId}`, data);
    },
    onMutate: async ({ setId, data }) => {
      // Optimistically update React Query cache immediately for offline resilience
      queryClient.setQueryData(["activeWorkout"], (oldWorkout: any) => {
        if (!oldWorkout?.exercises) return oldWorkout;
        return {
          ...oldWorkout,
          exercises: oldWorkout.exercises.map((ex: any) => {
            if (ex.id !== workoutExercise.id) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s: any) =>
                s.id === setId ? { ...s, ...data } : s
              ),
            };
          }),
        };
      });
    },
  });

  const completeExerciseMutation = useMutation({
    mutationFn: async () => {
      if (localSets.length === 0) {
        throw new Error("No sets to complete");
      }
      const { data } = await apiClient.patch(
        `/workouts/exercises/${workoutExercise.id}/complete-all`
      );
      return data;
    },
    onMutate: async () => {
      // 1. Optimistically mark all sets completed locally
      setLocalSets((prev) => prev.map((s) => ({ ...s, isCompleted: true })));

      // 2. Optimistically update React Query active workout cache
      queryClient.setQueryData(["activeWorkout"], (oldWorkout: any) => {
        if (!oldWorkout?.exercises) return oldWorkout;
        return {
          ...oldWorkout,
          exercises: oldWorkout.exercises.map((ex: any) => {
            if (ex.id !== workoutExercise.id) return ex;
            return {
              ...ex,
              sets: (ex.sets || []).map((s: any) => ({
                ...s,
                isCompleted: true,
              })),
            };
          }),
        };
      });

      // 3. Start the rest timer for seamless inter-exercise flow
      onSetCompleted(workoutExercise.restSeconds || 90);
    },
    onError: (err: any) => {
      console.warn("Complete all sets error", err);
    },
  });

  const handleCompleteAll = () => {
    if (localSets.length === 0) {
      setErrorMessage("Cannot complete exercise: Please add at least one set first.");
      setTimeout(() => {
        setErrorMessage((prev) =>
          prev === "Cannot complete exercise: Please add at least one set first." ? null : prev
        );
      }, 4500);
      return;
    }

    setErrorMessage(null);
    completeExerciseMutation.mutate();
  };

  const addSetMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(
        `/workouts/exercises/${workoutExercise.id}/sets`
      );
      return data;
    },
    onMutate: async () => {
      const tempId = crypto.randomUUID();
      const nextSetNumber = localSets.length + 1;
      const lastWeight = localSets[localSets.length - 1]?.weight || 0;
      const lastReps = localSets[localSets.length - 1]?.reps || 0;
      const newSet: WorkoutSet = {
        id: tempId,
        setNumber: nextSetNumber,
        weight: lastWeight,
        reps: lastReps,
        isCompleted: false,
      };

      setLocalSets((prev) => [...prev, newSet]);

      queryClient.setQueryData(["activeWorkout"], (oldWorkout: any) => {
        if (!oldWorkout?.exercises) return oldWorkout;
        return {
          ...oldWorkout,
          exercises: oldWorkout.exercises.map((ex: any) => {
            if (ex.id !== workoutExercise.id) return ex;
            return {
              ...ex,
              sets: [...(ex.sets || []), newSet],
            };
          }),
        };
      });
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData(["activeWorkout"], (oldWorkout: any) => {
          if (!oldWorkout?.exercises) return oldWorkout;
          return {
            ...oldWorkout,
            exercises: oldWorkout.exercises.map((ex: any) => {
              if (ex.id !== workoutExercise.id) return ex;
              return {
                ...ex,
                sets: ex.sets.map((s: any, idx: number) =>
                  idx === ex.sets.length - 1 ? { ...s, id: data.id } : s
                ),
              };
            }),
          };
        });
      }
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: async (setId: string) => {
      await apiClient.delete(`/workouts/sets/${setId}`);
    },
    onMutate: async (setId: string) => {
      setLocalSets((prev) => prev.filter((s) => s.id !== setId));

      queryClient.setQueryData(["activeWorkout"], (oldWorkout: any) => {
        if (!oldWorkout?.exercises) return oldWorkout;
        return {
          ...oldWorkout,
          exercises: oldWorkout.exercises.map((ex: any) => {
            if (ex.id !== workoutExercise.id) return ex;
            return {
              ...ex,
              sets: ex.sets.filter((s: any) => s.id !== setId),
            };
          }),
        };
      });
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/workouts/exercises/${workoutExercise.id}`);
    },
    onMutate: async () => {
      queryClient.setQueryData(["activeWorkout"], (oldWorkout: any) => {
        if (!oldWorkout?.exercises) return oldWorkout;
        return {
          ...oldWorkout,
          exercises: oldWorkout.exercises.filter(
            (ex: any) => ex.id !== workoutExercise.id
          ),
        };
      });
    },
  });

  const handleSetChange = (
    setId: string,
    field: keyof WorkoutSet,
    value: any
  ) => {
    setLocalSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, [field]: value } : s))
    );

    // Save directly to query cache so tab-switching while offline preserves unsaved input
    queryClient.setQueryData(["activeWorkout"], (oldWorkout: any) => {
      if (!oldWorkout?.exercises) return oldWorkout;
      return {
        ...oldWorkout,
        exercises: oldWorkout.exercises.map((ex: any) => {
          if (ex.id !== workoutExercise.id) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s: any) =>
              s.id === setId ? { ...s, [field]: value } : s
            ),
          };
        }),
      };
    });
  };

  const handleSetBlur = (setId: string, field: keyof WorkoutSet, value: any) => {
    updateSetMutation.mutate({
      setId,
      data: { [field]: value },
    });
  };

  const handleToggleCompleted = (set: WorkoutSet) => {
    const nextCompleted = !set.isCompleted;
    handleSetChange(set.id, "isCompleted", nextCompleted);

    // Trigger rest timer immediately and synchronously for zero perceived latency
    if (nextCompleted) {
      onSetCompleted(workoutExercise.restSeconds || 90);
    }

    updateSetMutation.mutate({
      setId: set.id,
      data: {
        weight: set.weight,
        reps: set.reps,
        isCompleted: nextCompleted,
      },
    });
  };

  return (
    <div
      className={`bg-surface border transition-all duration-300 rounded-2xl p-4 sm:p-5 shadow-sm ${
        allCompleted
          ? "border-tag-green-text/40 bg-tag-green-bg/[0.04] shadow-tag-green-text/5"
          : "border-border"
      }`}
    >
      {/* Exercise Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-background border border-border rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
            {workoutExercise.exercise.imageUrl ? (
              <img
                src={`/${workoutExercise.exercise.imageUrl}`}
                alt={workoutExercise.exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Dumbbell size={20} className="opacity-50" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-base sm:text-lg">
              {workoutExercise.exercise.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-border/40 px-2 py-0.5 rounded-md text-foreground/70">
                {workoutExercise.exercise.primaryMuscle}
              </span>
              {workoutExercise.plannedRepMin && workoutExercise.plannedRepMax && (
                <span className="text-xs opacity-60">
                  Target: {workoutExercise.plannedSets} × {workoutExercise.plannedRepMin}-{workoutExercise.plannedRepMax} reps
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Complete Exercise Button */}
          {hasSets ? (
            <button
              type="button"
              onClick={handleCompleteAll}
              disabled={allCompleted || completeExerciseMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                allCompleted
                  ? "bg-tag-green-bg text-tag-green-text border border-tag-green-text/30 shadow-sm cursor-default"
                  : "bg-surface border border-border hover:border-primary/50 text-foreground/80 hover:text-primary active:scale-95 shadow-sm"
              }`}
              title={
                allCompleted
                  ? "All sets completed"
                  : "Complete all remaining sets for this exercise"
              }
            >
              {allCompleted ? (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <CheckCheck size={15} className="text-primary" />
                  <span>
                    Complete All ({completedCount}/{localSets.length})
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface border border-dashed border-border text-foreground/50 hover:border-tag-red-text/40 hover:text-tag-red-text transition-colors"
              title="Complete exercise"
            >
              <CheckCheck size={15} />
              <span>Complete Exercise</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            title="Exercise guide & technique video"
            className="p-2 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Info size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            title="Remove exercise"
            className="p-2 text-foreground/40 hover:text-tag-red-text hover:bg-tag-red-bg rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Error Alert Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-tag-red-bg/80 text-tag-red-text border border-tag-red-text/30 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:opacity-70 font-bold transition-opacity"
          >
            ×
          </button>
        </div>
      )}

      {/* Sets Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider opacity-60 border-b border-border/50">
              <th className="py-2.5 px-2 w-12 text-center">Set</th>
              <th className="py-2.5 px-2 min-w-[90px] text-xs">Previous</th>
              <th className="py-2.5 px-2 min-w-[80px]">
                {preferredUnit.toUpperCase()}
              </th>
              <th className="py-2.5 px-2 min-w-[80px]">Reps</th>
              <th className="py-2.5 px-2 w-14 text-center">Done</th>
              <th className="py-2.5 px-1 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {localSets.map((set, idx) => {
              const isDone = set.isCompleted;
              const prevSet = previousSets?.find(
                (p) => p.setNumber === idx + 1
              );

              return (
                <tr
                  key={set.id}
                  className={`transition-colors ${
                    isDone ? "bg-tag-green-bg/20 opacity-90" : "hover:bg-border/10"
                  }`}
                >
                  {/* Set Number */}
                  <td className="py-2.5 px-2 text-center font-semibold text-xs opacity-60">
                    {idx + 1}
                  </td>

                  {/* Previous Performance */}
                  <td className="py-2.5 px-2 text-xs font-mono opacity-60">
                    {prevSet ? (
                      <span className="bg-border/30 px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap">
                        {prevSet.weight} {preferredUnit} × {prevSet.reps}
                      </span>
                    ) : (
                      <span className="opacity-40">—</span>
                    )}
                  </td>

                  {/* Weight Input */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={set.weight === 0 ? "" : set.weight}
                      placeholder={prevSet ? `${prevSet.weight}` : "0"}
                      onChange={(e) =>
                        handleSetChange(
                          set.id,
                          "weight",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      onBlur={(e) =>
                        handleSetBlur(
                          set.id,
                          "weight",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm font-medium focus:outline-none focus:border-primary transition-colors text-center"
                    />
                  </td>

                  {/* Reps Input */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0"
                      value={set.reps === 0 ? "" : set.reps}
                      placeholder={prevSet ? `${prevSet.reps}` : "0"}
                      onChange={(e) =>
                        handleSetChange(
                          set.id,
                          "reps",
                          parseInt(e.target.value) || 0
                        )
                      }
                      onBlur={(e) =>
                        handleSetBlur(
                          set.id,
                          "reps",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm font-medium focus:outline-none focus:border-primary transition-colors text-center"
                    />
                  </td>

                  {/* Checkbox Complete */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(set)}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                        isDone
                          ? "bg-tag-green-bg text-tag-green-text border-tag-green-text/30 shadow-sm"
                          : "bg-background border-border text-transparent hover:border-primary/50"
                      }`}
                    >
                      <Check size={16} strokeWidth={3} className={isDone ? "opacity-100" : "opacity-0"} />
                    </button>
                  </td>

                  {/* Delete Set */}
                  <td className="py-2 px-1 text-center">
                    {localSets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteSetMutation.mutate(set.id)}
                        title="Delete set"
                        className="p-1 text-foreground/30 hover:text-tag-red-text transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Set Button */}
      <button
        type="button"
        onClick={() => addSetMutation.mutate()}
        disabled={addSetMutation.isPending}
        className="w-full mt-3 py-2 border border-dashed border-border hover:border-primary/50 hover:bg-border/20 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 opacity-70 hover:opacity-100"
      >
        <Plus size={14} />
        Add Set
      </button>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Remove Exercise"
          description={`Are you sure you want to remove "${workoutExercise.exercise.name}" from this workout?`}
          confirmText="Remove"
          isDestructive={true}
          onConfirm={() => removeExerciseMutation.mutate()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showInfoModal && (
        <ExerciseDetailModal
          exercise={workoutExercise.exercise as any}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
}
