"use client";

import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, X, Check, Loader2, Info } from "lucide-react";
import { apiClient } from "../../lib/api";
import { cn } from "../../lib/utils";
import { ExerciseDetailModal } from "./ExerciseDetailModal";

interface Exercise {
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
  onSelect: (exercise: Exercise) => void;
  selectedIds: string[]; // To highlight already added exercises
}

export function ExercisePicker({ onClose, onSelect, selectedIds }: ExercisePickerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  
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
        page: pageParam.toString()
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

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b border-border bg-background shrink-0">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-border/50 rounded-md transition-colors shrink-0">
            <X size={20} />
          </button>
          <div className="flex-1 relative min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary text-sm transition-colors"
              autoFocus
            />
          </div>
          <button 
            onClick={onClose}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all shrink-0",
              selectedIds.length > 0 
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-surface border border-border text-foreground/70"
            )}
          >
            Done {selectedIds.length > 0 && `(${selectedIds.length})`}
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface border border-border hover:border-border-strong"
              )}
            >
              {cat === "" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                const isSelected = selectedIds.includes(ex.id);
                return (
                  <div
                    key={ex.id}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary/50 bg-primary/5 opacity-50"
                        : "border-border bg-surface hover:border-primary/50"
                    )}
                  >
                    {/* Thumbnail */}
                    <div 
                      className="w-14 h-14 bg-background border border-border rounded-md flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                      onClick={() => setViewingExercise(ex)}
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
                    
                    {/* Details (Click to select) */}
                    <button 
                      className="flex-1 min-w-0 text-left py-2"
                      onClick={() => onSelect(ex)}
                    >
                      <h3 className="font-medium truncate pr-2">{ex.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                          {ex.primaryMuscle}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-50">
                          • {ex.equipment.toLowerCase()}
                        </span>
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pr-2">
                      <button 
                        onClick={() => setViewingExercise(ex)}
                        className="p-2 text-foreground/50 hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                      >
                        <Info size={18} />
                      </button>
                      <button onClick={() => onSelect(ex)} className="p-2">
                        {isSelected ? (
                          <Check size={18} className="text-primary" />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border border-border" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {hasNextPage && (
                <div className="pt-2 pb-8">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full py-3 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-border/50 transition-colors"
                  >
                    {isFetchingNextPage ? "Loading more..." : "Load More Exercises"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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
