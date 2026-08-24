"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Dumbbell, Clock } from "lucide-react";
import { apiClient } from "../../lib/api";
import { PageLoader } from "../../components/ui/Loader";

interface Routine {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  exercises: {
    id: string;
    exercise: {
      name: string;
    };
  }[];
}

export default function RoutinesPage() {
  const { data: routines, isLoading } = useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data } = await apiClient.get("/routines");
      return data;
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Routines</h1>
          <p className="text-sm opacity-70 mt-1">Manage your training splits</p>
        </div>
        <Link
          href="/routines/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Routine</span>
        </Link>
      </header>

      {routines?.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
          <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-4">
            <Dumbbell size={24} className="opacity-50" />
          </div>
          <h2 className="text-xl font-medium mb-2">No routines yet</h2>
          <p className="text-sm opacity-70 max-w-xs mb-6">
            Create your first workout routine to start tracking your progress in the gym.
          </p>
          <Link
            href="/routines/new"
            className="px-6 py-2.5 bg-surface border border-border rounded-md font-medium hover:bg-border/30 transition-colors"
          >
            Create Routine
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {routines?.map((routine) => (
            <Link
              key={routine.id}
              href={`/routines/${routine.id}`}
              className="flex flex-col p-5 bg-surface border border-border rounded-xl hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-lg group-hover:text-primary transition-colors">
                  {routine.name}
                </h3>
              </div>
              
              {routine.description && (
                <p className="text-sm opacity-70 line-clamp-2 mb-4">
                  {routine.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-4 text-xs font-medium opacity-70">
                <div className="flex items-center gap-1.5">
                  <Dumbbell size={14} />
                  <span>{routine.exercises.length} Exercises</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>
                    {new Date(routine.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {/* Exercise Preview Tags */}
              {routine.exercises.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {routine.exercises.slice(0, 3).map((ex) => (
                    <span key={ex.id} className="px-2 py-1 bg-border/30 rounded-md text-[10px] font-medium uppercase tracking-wider">
                      {ex.exercise.name}
                    </span>
                  ))}
                  {routine.exercises.length > 3 && (
                    <span className="px-2 py-1 bg-border/30 rounded-md text-[10px] font-medium">
                      +{routine.exercises.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
