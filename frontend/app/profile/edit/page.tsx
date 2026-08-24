"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../../lib/api";
import { cn } from "../../../lib/utils";
import { PageLoader } from "../../../components/ui/Loader";

type Unit = "KG" | "LBS";
type FitnessGoal = "MUSCLE_GAIN" | "STRENGTH" | "WEIGHT_LOSS" | "GENERAL_FITNESS";
type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type Equipment = "BARBELL" | "DUMBBELL" | "MACHINE" | "BODYWEIGHT" | "CABLE";

interface ProfileState {
  preferredUnit: Unit;
  height?: number;
  weight?: number;
  primaryGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  targetDaysPerWeek: number;
  availableEquipment: Equipment[];
}

const goals: { id: FitnessGoal; label: string }[] = [
  { id: "MUSCLE_GAIN", label: "Muscle Gain" },
  { id: "STRENGTH", label: "Strength" },
  { id: "WEIGHT_LOSS", label: "Weight Loss" },
  { id: "GENERAL_FITNESS", label: "General Fitness" },
];

const levels: { id: ExperienceLevel; label: string }[] = [
  { id: "BEGINNER", label: "Beginner" },
  { id: "INTERMEDIATE", label: "Intermediate" },
  { id: "ADVANCED", label: "Advanced" },
];

const equipments: { id: Equipment; label: string }[] = [
  { id: "BARBELL", label: "Barbell" },
  { id: "DUMBBELL", label: "Dumbbells" },
  { id: "MACHINE", label: "Machines" },
  { id: "CABLE", label: "Cables" },
  { id: "BODYWEIGHT", label: "Bodyweight Only" },
];

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/profile");
      return data;
    },
  });

  const [form, setForm] = useState<ProfileState | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        preferredUnit: profile.preferredUnit,
        height: profile.height,
        weight: profile.weight,
        primaryGoal: profile.primaryGoal,
        experienceLevel: profile.experienceLevel,
        targetDaysPerWeek: profile.targetDaysPerWeek,
        availableEquipment: profile.availableEquipment || [],
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileState) => {
      const payload = {
        ...data,
        height: data.height ? Number(data.height) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
      };
      await apiClient.patch("/profile", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.back();
    },
  });

  if (isLoading || !form) {
    return <PageLoader />;
  }

  const updateForm = (updates: Partial<ProfileState>) => {
    setForm((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const toggleEquipment = (eq: Equipment) => {
    const current = form.availableEquipment;
    if (current.includes(eq)) {
      updateForm({ availableEquipment: current.filter((e) => e !== eq) });
    } else {
      updateForm({ availableEquipment: [...current, eq] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center gap-4 pb-6 mb-6 border-b border-border sticky top-0 bg-background z-10 pt-4">
        <Link href="/profile" className="p-2 -ml-2 rounded-md hover:bg-border/50 transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-light tracking-tight">Edit Profile</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        {/* Measurements */}
        <section>
          <h2 className="text-lg font-medium mb-4">Measurements</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Unit</label>
              <div className="flex gap-4">
                {(["KG", "LBS"] as Unit[]).map((unit) => (
                  <button
                    type="button"
                    key={unit}
                    onClick={() => updateForm({ preferredUnit: unit })}
                    className={cn(
                      "flex-1 py-2 rounded-md border transition-colors",
                      form.preferredUnit === unit
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border text-foreground hover:border-border-strong"
                    )}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={form.height || ""}
                  onChange={(e) => updateForm({ height: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Weight ({form.preferredUnit.toLowerCase()})</label>
                <input
                  type="number"
                  value={form.weight || ""}
                  onChange={(e) => updateForm({ weight: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Goals & Experience */}
        <section>
          <h2 className="text-lg font-medium mb-4">Fitness Goals</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {goals.map((goal) => (
              <button
                type="button"
                key={goal.id}
                onClick={() => updateForm({ primaryGoal: goal.id })}
                className={cn(
                  "p-3 text-sm text-left border rounded-lg transition-all",
                  form.primaryGoal === goal.id
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:border-border-strong"
                )}
              >
                {goal.label}
              </button>
            ))}
          </div>

          <h2 className="text-lg font-medium mb-4">Experience Level</h2>
          <div className="grid grid-cols-3 gap-2">
            {levels.map((level) => (
              <button
                type="button"
                key={level.id}
                onClick={() => updateForm({ experienceLevel: level.id })}
                className={cn(
                  "p-2 text-xs text-center border rounded-lg transition-all",
                  form.experienceLevel === level.id
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:border-border-strong"
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </section>

        {/* Schedule & Equipment */}
        <section>
          <h2 className="text-lg font-medium mb-4">Training Schedule</h2>
          <div className="flex items-center gap-4 mb-8">
            <input
              type="range"
              min="1"
              max="7"
              value={form.targetDaysPerWeek}
              onChange={(e) => updateForm({ targetDaysPerWeek: parseInt(e.target.value) })}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="w-16 text-right font-medium">
              {form.targetDaysPerWeek} Days
            </div>
          </div>

          <h2 className="text-lg font-medium mb-4">Available Equipment</h2>
          <div className="flex flex-wrap gap-2">
            {equipments.map((eq) => {
              const isSelected = form.availableEquipment.includes(eq.id);
              return (
                <button
                  type="button"
                  key={eq.id}
                  onClick={() => toggleEquipment(eq.id)}
                  className={cn(
                    "px-4 py-2 border rounded-full text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-foreground hover:border-border-strong"
                  )}
                >
                  {eq.label}
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full py-3 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-8"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
