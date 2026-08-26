export interface StarterExercise {
  name: string;
  category: "PUSH" | "PULL" | "LEGS" | "CORE";
  primaryMuscle: string;
  equipment: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
}

export interface StarterRoutineDay {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: "PUSH" | "PULL" | "LEGS" | "UPPER" | "LOWER" | "FULL_BODY";
  estimatedMinutes: number;
  exercises: StarterExercise[];
}

export interface StarterProgram {
  id: string;
  title: string;
  badge: string;
  frequency: string;
  goal: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  colorClass: string;
  days: StarterRoutineDay[];
}

export const STARTER_PROGRAMS: StarterProgram[] = [
  {
    id: "ppl-classic",
    title: "Push / Pull / Legs (PPL)",
    badge: "Most Popular",
    frequency: "3–6 Days / Week",
    goal: "Hypertrophy & Aesthetic Physique",
    description: "The gold-standard bodybuilding split. Groups muscles by movement patterns for maximum stimulus and optimal recovery.",
    difficulty: "Intermediate",
    colorClass: "from-blue-500/20 to-purple-500/10 border-blue-500/30",
    days: [
      {
        id: "ppl-push",
        name: "Push Day (Chest, Delts & Triceps)",
        subtitle: "Horizontal & vertical pressing with tricep accessories",
        description: "Focus on progressive overload on heavy presses followed by shoulder isolation and tricep volume.",
        category: "PUSH",
        estimatedMinutes: 50,
        exercises: [
          {
            name: "barbell bench press",
            category: "PUSH",
            primaryMuscle: "chest",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            name: "dumbbell incline bench press",
            category: "PUSH",
            primaryMuscle: "chest",
            equipment: "DUMBBELL",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "dumbbell shoulder press",
            category: "PUSH",
            primaryMuscle: "shoulders",
            equipment: "DUMBBELL",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            name: "dumbbell lateral raise",
            category: "PUSH",
            primaryMuscle: "shoulders",
            equipment: "DUMBBELL",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            name: "cable pushdown",
            category: "PUSH",
            primaryMuscle: "triceps",
            equipment: "CABLE",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
        ],
      },
      {
        id: "ppl-pull",
        name: "Pull Day (Back, Rear Delts & Biceps)",
        subtitle: "Vertical & horizontal pulls with bicep isolation",
        description: "Build back width and thickness while stimulating the biceps and posture stabilizers.",
        category: "PULL",
        estimatedMinutes: 50,
        exercises: [
          {
            name: "barbell bent-over row",
            category: "PULL",
            primaryMuscle: "back",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            name: "lat pulldown",
            category: "PULL",
            primaryMuscle: "back",
            equipment: "CABLE",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "seated cable row",
            category: "PULL",
            primaryMuscle: "back",
            equipment: "CABLE",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "cable face pull",
            category: "PULL",
            primaryMuscle: "shoulders",
            equipment: "CABLE",
            targetSets: 3,
            targetRepMin: 15,
            targetRepMax: 20,
          },
          {
            name: "dumbbell bicep curl",
            category: "PULL",
            primaryMuscle: "biceps",
            equipment: "DUMBBELL",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
        ],
      },
      {
        id: "ppl-legs",
        name: "Leg Day (Quads, Hamstrings & Calves)",
        subtitle: "Lower body quad compound, hinge & calf training",
        description: "Develop balanced lower body power and muscularity across the entire anterior and posterior chain.",
        category: "LEGS",
        estimatedMinutes: 55,
        exercises: [
          {
            name: "barbell full squat",
            category: "LEGS",
            primaryMuscle: "quads",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 6,
            targetRepMax: 8,
          },
          {
            name: "barbell romanian deadlift",
            category: "LEGS",
            primaryMuscle: "hamstrings",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            name: "sled 45\u00b0 leg press",
            category: "LEGS",
            primaryMuscle: "quads",
            equipment: "MACHINE",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "standing calf raise",
            category: "LEGS",
            primaryMuscle: "calves",
            equipment: "MACHINE",
            targetSets: 4,
            targetRepMin: 12,
            targetRepMax: 15,
          },
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    title: "4-Day Upper / Lower Split",
    badge: "Balanced & Efficient",
    frequency: "4 Days / Week",
    goal: "Strength & Proportional Muscle",
    description: "Alternates upper body pressing/pulling with lower body squats/hinges twice per week for high frequency.",
    difficulty: "Intermediate",
    colorClass: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    days: [
      {
        id: "ul-upper",
        name: "Upper Body Power & Hypertrophy",
        subtitle: "Chest, Upper Back, Delts & Arms",
        description: "Heavy horizontal pressing paired with vertical lat pulldown and shoulder volume.",
        category: "UPPER",
        estimatedMinutes: 50,
        exercises: [
          {
            name: "barbell bench press",
            category: "PUSH",
            primaryMuscle: "chest",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 6,
            targetRepMax: 8,
          },
          {
            name: "lat pulldown",
            category: "PULL",
            primaryMuscle: "back",
            equipment: "CABLE",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            name: "dumbbell incline bench press",
            category: "PUSH",
            primaryMuscle: "chest",
            equipment: "DUMBBELL",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "seated cable row",
            category: "PULL",
            primaryMuscle: "back",
            equipment: "CABLE",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "dumbbell lateral raise",
            category: "PUSH",
            primaryMuscle: "shoulders",
            equipment: "DUMBBELL",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
        ],
      },
      {
        id: "ul-lower",
        name: "Lower Body & Core Power",
        subtitle: "Quads, Posterior Chain & Abdominals",
        description: "Heavy squat foundation combined with hamstring Romanian deadlift and core bracing.",
        category: "LOWER",
        estimatedMinutes: 50,
        exercises: [
          {
            name: "barbell full squat",
            category: "LEGS",
            primaryMuscle: "quads",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 6,
            targetRepMax: 8,
          },
          {
            name: "barbell romanian deadlift",
            category: "LEGS",
            primaryMuscle: "hamstrings",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            name: "sled 45\u00b0 leg press",
            category: "LEGS",
            primaryMuscle: "quads",
            equipment: "MACHINE",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "hanging leg raise",
            category: "CORE",
            primaryMuscle: "abs",
            equipment: "BODYWEIGHT",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
        ],
      },
    ],
  },
  {
    id: "full-body-3day",
    title: "3-Day Full Body Essentials",
    badge: "Best for Beginners & Busy Lifters",
    frequency: "3 Days / Week",
    goal: "Foundational Strength & Total Body Fitness",
    description: "Hits major compound movement patterns in every session (Squat, Press, Pull, Hinge) for rapid adaptations.",
    difficulty: "Beginner",
    colorClass: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
    days: [
      {
        id: "fb-session-a",
        name: "Full Body Foundation",
        subtitle: "Squat, Bench Press, Row & Core",
        description: "Complete compound foundation targeting all major muscle groups in under 45 minutes.",
        category: "FULL_BODY",
        estimatedMinutes: 45,
        exercises: [
          {
            name: "barbell full squat",
            category: "LEGS",
            primaryMuscle: "quads",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            name: "barbell bench press",
            category: "PUSH",
            primaryMuscle: "chest",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 10,
          },
          {
            name: "lat pulldown",
            category: "PULL",
            primaryMuscle: "back",
            equipment: "CABLE",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "barbell romanian deadlift",
            category: "LEGS",
            primaryMuscle: "hamstrings",
            equipment: "BARBELL",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 12,
          },
          {
            name: "plank",
            category: "CORE",
            primaryMuscle: "abs",
            equipment: "BODYWEIGHT",
            targetSets: 3,
            targetRepMin: 45,
            targetRepMax: 60,
          },
        ],
      },
    ],
  },
];
