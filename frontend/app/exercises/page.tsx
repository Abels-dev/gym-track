"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Dumbbell,
  Filter,
  Layers,
  ChevronRight,
  Info,
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

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("ALL");
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  const { data: exercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data } = await apiClient.get("/exercises");
      return data;
    },
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

  const filteredExercises = exercises?.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.primaryMuscle.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "ALL" || ex.category === selectedCategory;

    const matchesEquipment =
      selectedEquipment === "ALL" || ex.equipment === selectedEquipment;

    return matchesSearch && matchesCategory && matchesEquipment;
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full pb-24">
      {/* Header */}
      <header className="pb-6 mb-6 border-b border-border">
        <h1 className="text-3xl font-light tracking-tight">Exercise Library</h1>
        <p className="text-sm opacity-70 mt-1">
          Explore movement guides, target anatomy, and execution instructions
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
          className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
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
            onClick={() => setSelectedEquipment(eq)}
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

      {/* Exercises Grid */}
      <div className="mb-4 text-xs font-medium opacity-50">
        Showing {filteredExercises?.length ?? 0} exercises
      </div>

      {filteredExercises?.length === 0 ? (
        <div className="p-12 border border-dashed border-border rounded-3xl text-center bg-surface/50 flex flex-col items-center justify-center">
          <Dumbbell size={36} className="opacity-30 mb-3" />
          <h3 className="font-medium text-lg mb-1">No exercises found</h3>
          <p className="text-sm opacity-60 max-w-xs mb-4">
            Try adjusting your search terms or filter selection.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("ALL");
              setSelectedEquipment("ALL");
            }}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-xs font-medium hover:bg-border/30 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredExercises?.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setDetailExercise(ex)}
              className="p-4 bg-surface border border-border hover:border-primary/50 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3.5">
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
                <div>
                  <h3 className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1">
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
