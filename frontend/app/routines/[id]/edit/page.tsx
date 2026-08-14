"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../../../lib/api";
import { cn } from "../../../../lib/utils";
import { ExercisePicker } from "../../../../components/routines/ExercisePicker";
import { PageLoader } from "../../../../components/ui/Loader";

interface SelectedExercise {
  id: string; // temporary id for the list item
  exerciseId: string;
  name: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
}

export default function EditRoutinePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const routineId = params.id as string;

  const { data: routine, isLoading } = useQuery({
    queryKey: ["routines", routineId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/routines/${routineId}`);
      return data;
    },
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<SelectedExercise[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setDescription(routine.description || "");
      setExercises(
        routine.exercises.map((ex: any) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          name: ex.exercise.name,
          targetSets: ex.targetSets,
          targetRepMin: ex.targetRepMin || 0,
          targetRepMax: ex.targetRepMax || 0,
        }))
      );
    }
  }, [routine]);

  const updateMutation = useMutation({
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
      const { data } = await apiClient.patch(`/routines/${routineId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["routines", routineId] });
      router.push(`/routines/${routineId}`);
    },
  });

  const handleAddExercise = (exercise: any) => {
    setExercises((prev) => {
      const exists = prev.find((ex) => ex.exerciseId === exercise.id);
      if (exists) {
        return prev.filter((ex) => ex.exerciseId !== exercise.id);
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          exerciseId: exercise.id,
          name: exercise.name,
          targetSets: 3,
          targetRepMin: 8,
          targetRepMax: 12,
        },
      ];
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
    updateMutation.mutate();
  };

  if (isLoading || !routine) return <PageLoader />;

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full relative">
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-border sticky top-0 bg-background z-10 pt-4">
        <div className="flex items-center gap-4">
          <Link href={`/routines/${routineId}`} className="p-2 -ml-2 rounded-md hover:bg-border/50 transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-light tracking-tight">Edit Routine</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!name || exercises.length === 0 || updateMutation.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <form className="space-y-8 pb-20">
        <section className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Routine Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Push Day, Full Body"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors text-lg font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Focus on chest and triceps"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Exercises</h2>
            <span className="text-sm opacity-50">{exercises.length} selected</span>
          </div>

          <div className="space-y-3 mb-6">
            {exercises.map((ex, idx) => (
              <div key={ex.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface border border-border rounded-xl">
                <div className="flex items-center gap-3 flex-1">
                  <div className="cursor-grab opacity-50 hover:opacity-100 hidden sm:block">
                    <GripVertical size={20} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold opacity-50 mr-2">{idx + 1}</span>
                    <span className="font-medium">{ex.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(ex.id)}
                    className="p-2 text-tag-red-text hover:bg-tag-red-bg rounded-md transition-colors sm:hidden"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={ex.targetSets}
                      onChange={(e) => updateExercise(ex.id, { targetSets: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1.5 bg-background border border-border rounded text-center text-sm font-medium"
                    />
                    <span className="text-xs font-medium opacity-50">Sets</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={ex.targetRepMin}
                      onChange={(e) => updateExercise(ex.id, { targetRepMin: parseInt(e.target.value) || 0 })}
                      className="w-12 px-2 py-1.5 bg-background border border-border rounded text-center text-sm font-medium"
                    />
                    <span className="opacity-50">-</span>
                    <input
                      type="number"
                      value={ex.targetRepMax}
                      onChange={(e) => updateExercise(ex.id, { targetRepMax: parseInt(e.target.value) || 0 })}
                      className="w-12 px-2 py-1.5 bg-background border border-border rounded text-center text-sm font-medium"
                    />
                    <span className="text-xs font-medium opacity-50 ml-1">Reps</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeExercise(ex.id)}
                    className="p-2 text-tag-red-text hover:bg-tag-red-bg rounded-md transition-colors hidden sm:block ml-2"
                  >
                    <Trash2 size={18} />
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
      </form>

      {isPickerOpen && (
        <ExercisePicker
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleAddExercise}
          selectedIds={exercises.map((e) => e.exerciseId)}
        />
      )}
    </div>
  );
}
