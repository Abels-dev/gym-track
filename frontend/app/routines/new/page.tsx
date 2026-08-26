"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, GripVertical, Dumbbell } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../../lib/api";
import { ExercisePicker, Exercise } from "../../../components/routines/ExercisePicker";

interface SelectedExercise {
  id: string; // temporary id for the list item
  exerciseId: string;
  name: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
}

export default function NewRoutinePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<SelectedExercise[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || undefined,
        exercises: exercises.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          order: index,
          targetSets: ex.targetSets,
          targetRepMin: ex.targetRepMin,
          targetRepMax: ex.targetRepMax,
        })),
      };
      const { data } = await apiClient.post("/routines", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      router.push("/routines");
    },
  });

  const handleAddMultipleExercises = (newExercises: Exercise[]) => {
    setExercises((prev) => {
      const existingIds = new Set(prev.map((e) => e.exerciseId));
      const additions = newExercises
        .filter((ex) => !existingIds.has(ex.id))
        .map((exercise) => ({
          id: crypto.randomUUID(),
          exerciseId: exercise.id,
          name: exercise.name,
          targetSets: 3,
          targetRepMin: 8,
          targetRepMax: 12,
        }));
      return [...prev, ...additions];
    });
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const updateExercise = (id: string, updates: Partial<SelectedExercise>) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || exercises.length === 0) return;
    createMutation.mutate();
  };

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-4xl mx-auto w-full pb-24">
      {/* Top Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/routines"
          className="p-2 -ml-2 text-foreground/60 hover:text-foreground hover:bg-border/40 rounded-xl transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-xs uppercase tracking-wider font-semibold opacity-60">
          Back to Routines
        </span>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-tight">Create Routine</h1>
        <p className="text-sm opacity-70 mt-1">
          Configure a structured workout with exercises, targets, and rep ranges
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details */}
        <section className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">
            1. Routine Details
          </h2>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider opacity-70 mb-1.5">
              Routine Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Push Day (Chest & Triceps)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider opacity-70 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Focus on progressive overload on bench press and tricep extension"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </section>

        {/* Exercises Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">
              2. Exercises ({exercises.length})
            </h2>

            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              <span>Add Exercise</span>
            </button>
          </div>

          {exercises.length === 0 && (
            <div className="p-8 border border-dashed border-border rounded-2xl text-center bg-surface/50">
              <Dumbbell size={32} className="mx-auto opacity-30 mb-2" />
              <p className="text-sm font-medium">No exercises added yet</p>
              <p className="text-xs opacity-60 mt-0.5">
                Add exercises to define target sets and rep brackets for this routine
              </p>
            </div>
          )}

          <div className="space-y-3">
            {exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-border/40 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">{ex.name}</h3>
                  </div>
                </div>

                {/* Target Configuration inputs */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs opacity-60">Sets:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={ex.targetSets}
                      onChange={(e) =>
                        updateExercise(ex.id, {
                          targetSets: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-14 px-2 py-1 bg-background border border-border rounded-lg text-xs text-center font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs opacity-60">Reps:</label>
                    <input
                      type="number"
                      min="1"
                      value={ex.targetRepMin}
                      onChange={(e) =>
                        updateExercise(ex.id, {
                          targetRepMin: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-12 px-2 py-1 bg-background border border-border rounded-lg text-xs text-center font-medium"
                    />
                    <span className="text-xs opacity-40">-</span>
                    <input
                      type="number"
                      min="1"
                      value={ex.targetRepMax}
                      onChange={(e) =>
                        updateExercise(ex.id, {
                          targetRepMax: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-12 px-2 py-1 bg-background border border-border rounded-lg text-xs text-center font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeExercise(ex.id)}
                    className="p-1.5 text-foreground/40 hover:text-tag-red-text hover:bg-tag-red-bg rounded-lg transition-colors ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-xl text-sm font-medium hover:bg-border/20 transition-colors opacity-70 hover:opacity-100"
          >
            <Plus size={18} />
            Add Exercise
          </button>
        </section>

        {/* Submit */}
        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <Link
            href="/routines"
            className="px-5 py-2.5 border border-border bg-surface rounded-xl text-sm font-medium hover:bg-border/30 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || exercises.length === 0}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Save Routine"}
          </button>
        </div>
      </form>

      {isPickerOpen && (
        <ExercisePicker
          onClose={() => setIsPickerOpen(false)}
          onSelectMultiple={handleAddMultipleExercises}
          selectedIds={exercises.map((e) => e.exerciseId)}
        />
      )}
    </div>
  );
}
