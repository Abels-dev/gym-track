"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Dumbbell,
  Clock,
  Play,
  BookmarkPlus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  CheckCircle2,
  Layers,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "../../lib/api";
import { PageLoader } from "../../components/ui/Loader";
import {
  STARTER_PROGRAMS,
  StarterProgram,
  StarterRoutineDay,
} from "../../lib/starterTemplates";

interface Routine {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  exercises: {
    id: string;
    exercise: {
      name: string;
      primaryMuscle?: string;
    };
  }[];
}

export default function RoutinesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"my-routines" | "templates">("my-routines");
  const [expandedDayId, setExpandedDayId] = useState<string | null>("ppl-push");
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);
  const [successSavedName, setSuccessSavedName] = useState<string | null>(null);

  const {
    data: routines,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data } = await apiClient.get("/routines");
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Helper to clone a template into user's personal routines
  const cloneRoutine = async (day: StarterRoutineDay) => {
    const exercisesPayload = [];

    for (let i = 0; i < day.exercises.length; i++) {
      const ex = day.exercises[i];
      try {
        // 1. Direct search with full name
        let { data } = await apiClient.get(
          `/exercises?search=${encodeURIComponent(ex.name)}&limit=1`
        );
        let matched = data.data?.[0];

        // 2. Fallback search by stripping equipment prefixes or punctuation
        if (!matched) {
          const simplified = ex.name
            .replace(/^(barbell|dumbbell|cable|bodyweight|machine|sled)\s+/i, "")
            .replace(/[-()]/g, " ")
            .trim();
          const fallbackRes = await apiClient.get(
            `/exercises?search=${encodeURIComponent(simplified)}&limit=1`
          );
          matched = fallbackRes.data?.data?.[0];
        }

        if (matched) {
          exercisesPayload.push({
            exerciseId: matched.id,
            order: i,
            targetSets: ex.targetSets,
            targetRepMin: ex.targetRepMin,
            targetRepMax: ex.targetRepMax,
          });
        }
      } catch (err) {
        console.warn(`Could not resolve exercise ${ex.name}`, err);
      }
    }

    const { data: newRoutine } = await apiClient.post("/routines", {
      name: day.name,
      description: day.description,
      exercises: exercisesPayload,
    });

    return newRoutine;
  };

  // Save template to My Routines
  const handleSaveTemplate = async (day: StarterRoutineDay) => {
    try {
      setSavingTemplateId(day.id);
      await cloneRoutine(day);
      await queryClient.invalidateQueries({ queryKey: ["routines"] });
      setSuccessSavedName(day.name);
      setTimeout(() => setSuccessSavedName(null), 3000);
    } catch (e) {
      console.error("Failed to clone starter template", e);
    } finally {
      setSavingTemplateId(null);
    }
  };

  // Start live workout directly from template
  const handleStartFromTemplate = async (day: StarterRoutineDay) => {
    try {
      setStartingTemplateId(day.id);
      const newRoutine = await cloneRoutine(day);
      await queryClient.invalidateQueries({ queryKey: ["routines"] });
      router.push(`/workout?routineId=${newRoutine.id}`);
    } catch (e) {
      console.error("Failed to start live session from template", e);
      setStartingTemplateId(null);
    }
  };

  if (isLoading) return <PageLoader />;

  const myRoutinesCount = routines?.length || 0;

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full pb-24">
      {/* Toast Alert for Successful Template Clone */}
      {successSavedName && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface/95 backdrop-blur-md border border-tag-green-text/40 shadow-xl rounded-full text-xs font-semibold text-tag-green-text">
            <CheckCircle2 size={16} />
            <span>&quot;{successSavedName}&quot; saved to My Routines!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Routines & Splits</h1>
          <p className="text-sm opacity-70 mt-1">
            Build custom workout splits or launch proven starter templates
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            title="Refresh routines"
            className="p-2.5 bg-surface border border-border hover:bg-border/30 rounded-xl text-foreground/70 hover:text-foreground transition-colors"
          >
            <RefreshCw size={15} className={isRefetching ? "animate-spin text-primary" : ""} />
          </button>
          <Link
            href="/routines/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={16} />
            <span>Create Routine</span>
          </Link>
        </div>
      </header>

      {/* Navigation Segmented Tab Switch */}
      <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-2xl w-fit mb-8 shadow-sm">
        <button
          onClick={() => setActiveTab("my-routines")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === "my-routines"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground opacity-60 hover:opacity-100 hover:bg-border/20"
          }`}
        >
          <Layers size={16} />
          <span>My Routines</span>
          <span className="px-1.5 py-0.2 text-[11px] rounded-full bg-background/20 font-bold">
            {myRoutinesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === "templates"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground opacity-60 hover:opacity-100 hover:bg-border/20"
          }`}
        >
          <Sparkles size={16} className={activeTab === "templates" ? "text-primary-foreground" : "text-tag-yellow-text"} />
          <span>Starter Templates</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: MY PERSONAL ROUTINES                                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "my-routines" && (
        <div>
          {routines?.length === 0 ? (
            <div className="p-8 sm:p-12 border border-dashed border-border rounded-3xl text-center bg-surface/50 max-w-xl mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-background border border-border rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Dumbbell size={28} className="opacity-40" />
              </div>
              <h2 className="text-xl font-medium mb-1.5">No personal routines yet</h2>
              <p className="text-xs sm:text-sm opacity-70 max-w-sm mb-6">
                Start by creating your own customized routine or choose from our proven starter templates.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab("templates")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 shadow-sm transition-all"
                >
                  <Sparkles size={14} />
                  <span>Explore Starter Templates</span>
                </button>
                <Link
                  href="/routines/new"
                  className="px-5 py-2.5 bg-surface border border-border rounded-xl text-xs font-medium hover:bg-border/30 transition-colors"
                >
                  Create from Scratch
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {routines?.map((routine) => (
                <div
                  key={routine.id}
                  className="flex flex-col p-5 bg-surface border border-border hover:border-primary/40 rounded-2xl transition-all shadow-sm group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/routines/${routine.id}`}
                      className="font-medium text-lg group-hover:text-primary transition-colors flex-1"
                    >
                      {routine.name}
                    </Link>
                  </div>

                  {routine.description && (
                    <p className="text-xs sm:text-sm opacity-70 line-clamp-2 mb-4">
                      {routine.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-xs opacity-70">
                    <span className="font-semibold">
                      {routine.exercises.length} Exercises
                    </span>
                    <span>{new Date(routine.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Exercise Tags */}
                  {routine.exercises.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                      {routine.exercises.slice(0, 3).map((ex) => (
                        <span
                          key={ex.id}
                          className="px-2 py-0.5 bg-background border border-border/60 rounded-md text-[10px] font-semibold uppercase tracking-wider text-foreground/70"
                        >
                          {ex.exercise.name}
                        </span>
                      ))}
                      {routine.exercises.length > 3 && (
                        <span className="px-2 py-0.5 bg-background border border-border/60 rounded-md text-[10px] opacity-60">
                          +{routine.exercises.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Link
                      href={`/workout?routineId=${routine.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 hover:border-primary rounded-xl text-xs font-medium transition-all"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Start Workout</span>
                    </Link>

                    <Link
                      href={`/routines/${routine.id}`}
                      className="p-2 border border-border hover:bg-border/30 rounded-xl text-foreground/60 hover:text-foreground transition-colors"
                      title="View / Edit Routine"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CURATED STARTER TEMPLATES                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "templates" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="p-4 sm:p-5 bg-surface border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-tag-yellow-bg text-tag-yellow-text border border-tag-yellow-text/20 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-medium text-sm sm:text-base">Science-Backed Starter Splits</h3>
                <p className="text-xs opacity-70">
                  Each day is designed as a standalone gym session. Save to your routines or start immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {STARTER_PROGRAMS.map((program: StarterProgram) => (
              <div
                key={program.id}
                className={`bg-surface/80 border rounded-3xl p-5 sm:p-7 shadow-sm ${program.colorClass}`}
              >
                {/* Program Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-border gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary text-primary-foreground">
                        {program.badge}
                      </span>
                      <span className="text-xs font-semibold opacity-60">
                        {program.frequency}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-light tracking-tight">
                      {program.title}
                    </h2>
                    <p className="text-xs sm:text-sm opacity-70 mt-1 max-w-2xl">
                      {program.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold opacity-80 shrink-0">
                    <span className="px-2.5 py-1 bg-background/80 border border-border rounded-lg">
                      Goal: {program.goal}
                    </span>
                  </div>
                </div>

                {/* Days Cards in Program */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {program.days.map((day: StarterRoutineDay) => {
                    const isExpanded = expandedDayId === day.id;
                    const isSaving = savingTemplateId === day.id;
                    const isStarting = startingTemplateId === day.id;

                    return (
                      <div
                        key={day.id}
                        className="bg-background/90 border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-primary/50 transition-all"
                      >
                        <div>
                          {/* Day Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                                {day.category}
                              </span>
                              <h3 className="font-medium text-base sm:text-lg mt-0.5">
                                {day.name}
                              </h3>
                            </div>
                            <span className="text-xs px-2 py-0.5 bg-surface border border-border rounded-md font-mono font-medium opacity-70">
                              ~{day.estimatedMinutes}m
                            </span>
                          </div>

                          <p className="text-xs opacity-70 mb-4">{day.subtitle}</p>

                          {/* Exercise List Pill Preview */}
                          <div className="space-y-1.5 mb-5">
                            {day.exercises.map((ex, exIdx) => (
                              <div
                                key={ex.name}
                                className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-surface/60 rounded-lg border border-border/50"
                              >
                                <span className="font-medium capitalize truncate pr-2">
                                  {exIdx + 1}. {ex.name}
                                </span>
                                <span className="font-mono text-[11px] opacity-60 shrink-0">
                                  {ex.targetSets} × {ex.targetRepMin}-{ex.targetRepMax}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                          <button
                            onClick={() => handleStartFromTemplate(day)}
                            disabled={isStarting || isSaving}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                          >
                            {isStarting ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Launching...</span>
                              </>
                            ) : (
                              <>
                                <Play size={13} fill="currentColor" />
                                <span>Start Workout</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleSaveTemplate(day)}
                            disabled={isSaving || isStarting}
                            title="Save as My Routine"
                            className="flex items-center gap-1.5 px-3 py-2.5 bg-surface border border-border hover:border-primary/40 hover:bg-border/30 rounded-xl text-xs font-medium text-foreground/80 hover:text-foreground transition-all disabled:opacity-50"
                          >
                            {isSaving ? (
                              <Loader2 size={13} className="animate-spin text-primary" />
                            ) : (
                              <BookmarkPlus size={15} />
                            )}
                            <span className="hidden sm:inline">Save</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
