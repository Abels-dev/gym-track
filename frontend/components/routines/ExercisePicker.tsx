"use client";

import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, X, Check, Loader2, Info, Plus } from "lucide-react";
import { apiClient } from "../../lib/api";
import { cn } from "../../lib/utils";
import { ExerciseDetailModal } from "./ExerciseDetailModal";

export interface Exercise {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  imageUrl?: string;
  instructions?: string;
  videoUrl?: string;
}

interface ExercisePickerProps {
  onClose: () => void;
  onSelect?: (exercise: Exercise) => void;
  onSelectMultiple?: (exercises: Exercise[]) => void;
  selectedIds?: string[]; // IDs already in the routine/workout
}

export function ExercisePicker({
  onClose,
  onSelect,
  onSelectMultiple,
  selectedIds = [],
}: ExercisePickerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  
  // Track selected exercises in this picker session
  const [selectedMap, setSelectedMap] = useState<Map<string, Exercise>>(new Map());

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["exercises-infinite", debouncedSearch, category],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ 
        limit: "20",
        page: pageParam.toString(),
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (category) params.append("category", category);
      
      const { data } = await apiClient.get(`/exercises?${params.toString()}`);
      return data; // { data: Exercise[], meta: {...} }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
  });

  const exercises = data?.pages.flatMap((page) => page.data) || [];

  const toggleSelectExercise = (exercise: Exercise) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.set(exercise.id, exercise);
      }
      return next;
    });
  };

  const handleConfirmSelection = () => {
    const chosenList = Array.from(selectedMap.values());
    if (chosenList.length > 0) {
      if (onSelectMultiple) {
        onSelectMultiple(chosenList);
      } else if (onSelect) {
        chosenList.forEach((ex) => onSelect(ex));
      }
    }
    onClose();
  };

  const selectedCount = selectedMap.size;

  return (
    <>
      <div className="fixed inset-0 z-[60] h-[100dvh] bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b border-border bg-background shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-border/50 rounded-md transition-colors shrink-0"
            title="Cancel"
          >
            <X size={20} />
          </button>
          <div className="flex-1 relative min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary text-sm transition-colors"
              autoFocus
            />
          </div>
          <button 
            onClick={handleConfirmSelection}
            className={cn(
              "px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all shrink-0 shadow-sm",
              selectedCount > 0 
                ? "bg-primary text-primary-foreground hover:opacity-90 scale-[1.02]"
                : "bg-surface border border-border text-foreground/70 hover:text-foreground"
            )}
          >
            Done {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </header>

        {/* Filters */}
        <div className="flex gap-2 p-4 overflow-x-auto border-b border-border bg-background hide-scrollbar shrink-0">
          {["", "PUSH", "PULL", "LEGS", "CORE"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface border border-border hover:border-border-strong"
              )}
            >
              {cat === "" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-2 pb-28 md:pb-16"
          style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))" }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12 opacity-50">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12 opacity-50 text-sm">
              No exercises found.
            </div>
          ) : (
            <>
              {exercises.map((ex: Exercise) => {
                const isNewlySelected = selectedMap.has(ex.id);
                const isAlreadyInWorkout = selectedIds.includes(ex.id);
                const isChecked = isNewlySelected || isAlreadyInWorkout;

                return (
                  <div
                    key={ex.id}
                    onClick={() => toggleSelectExercise(ex)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none",
                      isChecked
                        ? "border-primary/60 bg-primary/10 shadow-sm"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-border/20"
                    )}
                  >
                    {/* Thumbnail */}
                    <div 
                      className="w-14 h-14 bg-background border border-border rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingExercise(ex);
                      }}
                    >
                      {ex.imageUrl ? (
                        <img 
                          src={`/${ex.imageUrl}`} 
                          alt={ex.name}
                          className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                        />
                      ) : (
                        <span className="text-xs font-bold opacity-50">{ex.name.substring(0,2).toUpperCase()}</span>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate pr-1">{ex.name}</h3>
                        {isAlreadyInWorkout && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-border/50 text-foreground/70 rounded font-medium shrink-0">
                            Added
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                          {ex.primaryMuscle}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-50">
                          • {ex.equipment.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pr-1 shrink-0">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingExercise(ex);
                        }}
                        className="p-2 text-foreground/50 hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                        title="View instructions & tutorial"
                      >
                        <Info size={18} />
                      </button>

                      {/* Checkbox indicator */}
                      <div 
                        className={cn(
                          "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                          isChecked
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-border bg-background"
                        )}
                      >
                        {isChecked && <Check size={15} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {hasNextPage && (
                <div className="pt-3 pb-8">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full py-3 bg-surface border border-border rounded-xl text-sm font-medium hover:bg-border/50 transition-colors shadow-sm"
                  >
                    {isFetchingNextPage ? "Loading more..." : "Load More Exercises"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky Bottom Floating Bar when multiple items selected */}
        {selectedCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-10 flex justify-center animate-in slide-in-from-bottom-3 duration-200">
            <button
              onClick={handleConfirmSelection}
              className="w-full max-w-md py-3.5 px-6 bg-primary text-primary-foreground font-medium rounded-2xl shadow-xl hover:opacity-95 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {selectedCount}
                </span>
                <span>Add Selected {selectedCount === 1 ? "Exercise" : "Exercises"}</span>
              </div>
              <Check size={18} />
            </button>
          </div>
        )}
      </div>
      
      {viewingExercise && (
        <ExerciseDetailModal 
          exercise={viewingExercise} 
          onClose={() => setViewingExercise(null)} 
        />
      )}
    </>
  );
}
