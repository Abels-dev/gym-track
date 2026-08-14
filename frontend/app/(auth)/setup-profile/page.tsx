"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { cn } from "../../../lib/utils";

// Types matching backend DTO
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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export default function SetupProfilePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState<ProfileState>({
    preferredUnit: "KG",
    primaryGoal: "MUSCLE_GAIN",
    experienceLevel: "BEGINNER",
    targetDaysPerWeek: 4,
    availableEquipment: ["BARBELL", "DUMBBELL", "MACHINE", "CABLE", "BODYWEIGHT"],
  });

  const nextStep = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const updateForm = (updates: Partial<ProfileState>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const submitMutation = useMutation({
    mutationFn: async (data: ProfileState) => {
      const payload = {
        ...data,
        height: data.height ? Number(data.height) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
      };
      await apiClient.post("/profile", payload);
    },
    onSuccess: () => {
      useAuthStore.setState({ needsOnboarding: false });
      router.replace("/");
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full p-6 min-h-dvh">
      {/* Progress Header */}
      <header className="flex flex-col pt-12 pb-8">
        <h1 className="text-3xl font-light tracking-tight mb-2">Build your profile</h1>
        <div className="flex gap-2 w-full mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                step >= i ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      </header>

      {/* Animated Form Steps */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 w-full"
          >
            {step === 1 && (
              <StepOne form={formData} updateForm={updateForm} />
            )}
            {step === 2 && (
              <StepTwo form={formData} updateForm={updateForm} />
            )}
            {step === 3 && (
              <StepThree form={formData} updateForm={updateForm} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-4 pb-8 z-10 bg-background pt-4 border-t border-border/50">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="flex-1 py-3 px-4 rounded-md border border-border font-medium hover:bg-border/50 transition-colors"
          >
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={nextStep}
            className="flex-[2] py-3 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex-[2] py-3 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitMutation.isPending ? "Saving..." : "Finish Setup"}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Step Components ---

function StepOne({ form, updateForm }: { form: ProfileState; updateForm: (u: Partial<ProfileState>) => void }) {
  return (
    <div className="space-y-6 flex flex-col">
      <div>
        <h2 className="text-xl font-medium mb-1">The Basics</h2>
        <p className="text-sm opacity-70 mb-6">Let's get your measurements to track progress properly.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Preferred Unit</label>
          <div className="flex gap-4">
            {(["KG", "LBS"] as Unit[]).map((unit) => (
              <button
                key={unit}
                onClick={() => updateForm({ preferredUnit: unit })}
                className={cn(
                  "flex-1 py-3 rounded-md border transition-colors",
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
              placeholder="e.g. 175"
              className="w-full px-4 py-3 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Weight ({form.preferredUnit.toLowerCase()})</label>
            <input
              type="number"
              value={form.weight || ""}
              onChange={(e) => updateForm({ weight: parseFloat(e.target.value) })}
              placeholder="e.g. 70"
              className="w-full px-4 py-3 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTwo({ form, updateForm }: { form: ProfileState; updateForm: (u: Partial<ProfileState>) => void }) {
  const goals: { id: FitnessGoal; label: string; desc: string }[] = [
    { id: "MUSCLE_GAIN", label: "Muscle Gain", desc: "Build size and mass" },
    { id: "STRENGTH", label: "Strength", desc: "Focus on heavy lifting" },
    { id: "WEIGHT_LOSS", label: "Weight Loss", desc: "Burn fat and lean out" },
    { id: "GENERAL_FITNESS", label: "General Fitness", desc: "Stay active and healthy" },
  ];

  const levels: { id: ExperienceLevel; label: string }[] = [
    { id: "BEGINNER", label: "Beginner" },
    { id: "INTERMEDIATE", label: "Intermediate" },
    { id: "ADVANCED", label: "Advanced" },
  ];

  return (
    <div className="space-y-8 flex flex-col h-full overflow-y-auto pb-8">
      <div>
        <h2 className="text-xl font-medium mb-4">Primary Goal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => updateForm({ primaryGoal: goal.id })}
              className={cn(
                "p-4 text-left border rounded-lg transition-all",
                form.primaryGoal === goal.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-border-strong"
              )}
            >
              <div className="font-medium">{goal.label}</div>
              <div className="text-xs opacity-70 mt-1">{goal.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-medium mb-4">Experience Level</h2>
        <div className="flex flex-col gap-3">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => updateForm({ experienceLevel: level.id })}
              className={cn(
                "p-4 text-left border rounded-lg transition-all",
                form.experienceLevel === level.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border-strong"
              )}
            >
              <div className="font-medium">{level.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepThree({ form, updateForm }: { form: ProfileState; updateForm: (u: Partial<ProfileState>) => void }) {
  const toggleEquipment = (eq: Equipment) => {
    const current = form.availableEquipment;
    if (current.includes(eq)) {
      updateForm({ availableEquipment: current.filter((e) => e !== eq) });
    } else {
      updateForm({ availableEquipment: [...current, eq] });
    }
  };

  const equipments: { id: Equipment; label: string }[] = [
    { id: "BARBELL", label: "Barbell" },
    { id: "DUMBBELL", label: "Dumbbells" },
    { id: "MACHINE", label: "Machines" },
    { id: "CABLE", label: "Cables" },
    { id: "BODYWEIGHT", label: "Bodyweight Only" },
  ];

  return (
    <div className="space-y-8 flex flex-col h-full overflow-y-auto pb-8">
      <div>
        <h2 className="text-xl font-medium mb-2">Weekly Schedule</h2>
        <p className="text-sm opacity-70 mb-4">How many days per week do you plan to train?</p>
        
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="7"
            value={form.targetDaysPerWeek}
            onChange={(e) => updateForm({ targetDaysPerWeek: parseInt(e.target.value) })}
            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="w-12 text-center font-medium text-xl">
            {form.targetDaysPerWeek}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-medium mb-2">Available Equipment</h2>
        <p className="text-sm opacity-70 mb-4">Select what you have access to.</p>
        
        <div className="flex flex-wrap gap-3">
          {equipments.map((eq) => {
            const isSelected = form.availableEquipment.includes(eq.id);
            return (
              <button
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
      </div>
    </div>
  );
}
