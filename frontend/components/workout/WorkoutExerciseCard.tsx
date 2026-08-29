"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Trash2, Dumbbell, Info } from "lucide-react";
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
  const [localSets, setLocalSets] = useState<WorkoutSet[]>(workoutExercise.sets);

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
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      {/* Exercise Header */}
      <div className="flex items-start justify-between mb-4">
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

        <div className="flex items-center gap-1">
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
