"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Search,
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { apiClient } from "../../lib/api";
import { PageLoader } from "../../components/ui/Loader";
import { ExerciseDetailModal } from "../../components/routines/ExerciseDetailModal";

interface Exercise {
  id: string;
  name: string;
  category: "PUSH" | "PULL" | "LEGS" | "CORE";
  primaryMuscle: string;
  secondaryMuscles?: string[];
  equipment: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface ExercisesResponse {
  data: Exercise[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const PAGE_SIZE = 24;

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when category or equipment changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleEquipmentChange = (eq: string) => {
    setSelectedEquipment(eq);
    setPage(1);
  };

  const { data, isLoading, isFetching } = useQuery<ExercisesResponse>({
    queryKey: [
      "exercises",
      page,
      PAGE_SIZE,
      debouncedSearch,
      selectedCategory,
      selectedEquipment,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }
      if (selectedCategory !== "ALL") {
        params.append("category", selectedCategory);
      }
      if (selectedEquipment !== "ALL") {
        params.append("equipment", selectedEquipment);
      }

      const res = await apiClient.get(`/exercises?${params.toString()}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const categories = ["ALL", "PUSH", "PULL", "LEGS", "CORE"];
  const equipmentList = [
    "ALL",
    "BARBELL",
    "DUMBBELL",
    "MACHINE",
    "BODYWEIGHT",
    "CABLE",
  ];

  const exercises = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };
  const totalPages = Math.max(1, meta.totalPages);

  const handlePageChange = (newPage: number) => {
    setPage(Math.min(totalPages, Math.max(1, newPage)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading && !data) return <PageLoader />;

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full pb-24">
      {/* Header */}
      <header className="pb-6 mb-6 border-b border-border">
        <h1 className="text-3xl font-light tracking-tight">Exercise Library</h1>
        <p className="text-sm opacity-70 mt-1">
          Explore movement guides, target anatomy, and video form tutorials
        </p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40"
        />
        <input
          type="text"
          placeholder="Search by exercise name or muscle (e.g., Bench Press, Chest)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-foreground/40 hover:text-foreground rounded-md"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface border border-border text-foreground/70 hover:text-foreground hover:bg-border/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Equipment Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {equipmentList.map((eq) => (
          <button
            key={eq}
            onClick={() => handleEquipmentChange(eq)}
            className={`px-3 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedEquipment === eq
                ? "bg-foreground/15 text-foreground font-semibold border border-foreground/30"
                : "bg-background border border-border/70 text-foreground/50 hover:text-foreground"
            }`}
          >
            {eq.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Total Count & Page Indicator */}
      <div className="flex items-center justify-between mb-4 text-xs font-medium opacity-60">
        <span>
          Showing {exercises.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} -{" "}
          {Math.min(page * PAGE_SIZE, meta.total)} of {meta.total} exercises
        </span>
        {totalPages > 1 && (
          <span>
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {/* Exercises Grid */}
      {exercises.length === 0 ? (
        <div className="p-12 border border-dashed border-border rounded-3xl text-center bg-surface/50 flex flex-col items-center justify-center">
          <Dumbbell size={36} className="opacity-30 mb-3" />
          <h3 className="font-medium text-lg mb-1">No exercises found</h3>
          <p className="text-sm opacity-60 max-w-xs mb-4">
            Try adjusting your search terms or filter selection.
          </p>
          <button
            onClick={() => {
              setSearch("");
              handleCategoryChange("ALL");
              handleEquipmentChange("ALL");
            }}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-xs font-medium hover:bg-border/30 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 transition-opacity ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setDetailExercise(ex)}
                className="p-4 bg-surface border border-border hover:border-primary/50 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 bg-background border border-border rounded-xl flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    {ex.imageUrl ? (
                      <img
                        src={`/${ex.imageUrl}`}
                        alt={ex.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Dumbbell size={20} className="opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors truncate capitalize">
                      {ex.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-border/40 px-2 py-0.5 rounded text-foreground/70">
                        {ex.primaryMuscle}
                      </span>
                      <span className="text-[10px] opacity-50 uppercase tracking-wider">
                        • {ex.equipment.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                />
              </button>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border/60">
              <button
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                title="First Page"
                className="p-2.5 bg-surface border border-border rounded-xl text-xs font-medium hover:bg-border/30 disabled:opacity-30 disabled:hover:bg-surface transition-all"
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                title="Previous Page"
                className="flex items-center gap-1 px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-medium hover:bg-border/30 disabled:opacity-30 disabled:hover:bg-surface transition-all"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Number Chips */}
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show current page, first, last, and immediate neighbors
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1 ||
                      (page <= 3 && p <= 4) ||
                      (page >= totalPages - 2 && p >= totalPages - 3)
                    );
                  })
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push(`dots-${p}`);
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item) => {
                    if (typeof item === "string") {
                      return (
                        <span
                          key={item}
                          className="px-1.5 text-xs opacity-40 font-mono"
                        >
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={item}
                        onClick={() => handlePageChange(item)}
                        className={`w-9 h-9 rounded-xl text-xs font-semibold font-mono transition-all ${
                          page === item
                            ? "bg-primary text-primary-foreground shadow-sm scale-105"
                            : "bg-surface border border-border hover:bg-border/30 text-foreground/70"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                title="Next Page"
                className="flex items-center gap-1 px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-medium hover:bg-border/30 disabled:opacity-30 disabled:hover:bg-surface transition-all"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={page === totalPages}
                title="Last Page"
                className="p-2.5 bg-surface border border-border rounded-xl text-xs font-medium hover:bg-border/30 disabled:opacity-30 disabled:hover:bg-surface transition-all"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Exercise Detail Modal */}
      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise as any}
          onClose={() => setDetailExercise(null)}
        />
      )}
    </div>
  );
}
