import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    // 1. Fetch user profile for targetDaysPerWeek
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { targetDaysPerWeek: true },
    });
    const targetDaysPerWeek = profile?.targetDaysPerWeek || 4;
    const requiredWorkoutsPerWeek = Math.ceil(targetDaysPerWeek * 0.75);

    // 2. Fetch completed workouts
    const workouts = await this.prisma.workoutLog.findMany({
      where: { userId, endedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      include: {
        exercises: {
          include: {
            sets: { where: { isCompleted: true } },
          },
        },
      },
    });

    const totalWorkouts = workouts.length;

    // 3. Calculate Weekly Streak and Current Week metrics
    const getMonday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay() || 7; 
      if (day !== 1) date.setHours(-24 * (day - 1)); 
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    };

    const currentWeekMonday = getMonday(new Date());
    const currentWeekWorkouts = workouts.filter(
      (w) => getMonday(w.startedAt) === currentWeekMonday
    );
    const currentWeekWorkoutsCount = currentWeekWorkouts.length;

    // Which days of this week had a workout (1=Mon, 7=Sun)
    const currentWeekDaysWithWorkout = Array.from(
      new Set(
        currentWeekWorkouts.map((w) => {
          const d = new Date(w.startedAt).getDay();
          return d === 0 ? 7 : d;
        })
      )
    ).sort();

    const workoutsByWeek = new Map<number, number>();
    workouts.forEach((w) => {
      const weekTimestamp = getMonday(w.startedAt);
      workoutsByWeek.set(weekTimestamp, (workoutsByWeek.get(weekTimestamp) || 0) + 1);
    });

    let currentStreak = 0;
    
    // Check current week
    if ((workoutsByWeek.get(currentWeekMonday) || 0) >= requiredWorkoutsPerWeek) {
      currentStreak++;
    }

    // Iterate backward through previous weeks
    let weekOffset = 1;
    while (true) {
      const prevWeekTimestamp = currentWeekMonday - (weekOffset * 7 * 24 * 60 * 60 * 1000);
      const workoutsInPrevWeek = workoutsByWeek.get(prevWeekTimestamp) || 0;
      
      if (workoutsInPrevWeek >= requiredWorkoutsPerWeek) {
        currentStreak++;
        weekOffset++;
      } else {
        break; // Streak broken
      }
    }

    // 4. Total volume and weekly trend breakdown (last 6 weeks)
    let totalVolume = 0;
    const weeklyTrendMap = new Map<number, { volume: number; count: number }>();

    // Pre-seed last 6 weeks
    for (let i = 5; i >= 0; i--) {
      const ts = currentWeekMonday - i * 7 * 24 * 60 * 60 * 1000;
      weeklyTrendMap.set(ts, { volume: 0, count: 0 });
    }

    workouts.forEach((w) => {
      const weekTs = getMonday(w.startedAt);
      let sessionVolume = 0;
      w.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          sessionVolume += (s.weight || 0) * (s.reps || 0);
        });
      });

      totalVolume += sessionVolume;

      if (weeklyTrendMap.has(weekTs)) {
        const curr = weeklyTrendMap.get(weekTs)!;
        curr.volume += sessionVolume;
        curr.count += 1;
      }
    });

    const weeklyTrends = Array.from(weeklyTrendMap.entries()).map(([ts, val], idx) => {
      const d = new Date(ts);
      const label = `W${idx + 1} (${d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })})`;
      return {
        timestamp: ts,
        label,
        volume: val.volume,
        workoutsCount: val.count,
      };
    });

    return {
      totalWorkouts,
      totalVolume,
      currentWeeklyStreak: currentStreak,
      requiredWorkoutsPerWeek,
      targetDaysPerWeek,
      currentWeekWorkoutsCount,
      currentWeekDaysWithWorkout,
      weeklyTrends,
    };
  }

  async getPrs(userId: string) {
    // Find max weight for each exercise
    const completedSets = await this.prisma.setLog.findMany({
      where: {
        isCompleted: true,
        workoutExercise: {
          workoutLog: {
            userId,
          },
        },
      },
      include: {
        workoutExercise: {
          include: {
            exercise: true,
          },
        },
      },
    });

    const prMap = new Map<string, { exerciseName: string; maxWeight: number }>();

    for (const set of completedSets) {
      const exerciseId = set.workoutExercise.exerciseId;
      const exerciseName = set.workoutExercise.exercise.name;
      const weight = set.weight;

      if (!prMap.has(exerciseId)) {
        prMap.set(exerciseId, { exerciseName, maxWeight: weight });
      } else {
        const currentPr = prMap.get(exerciseId)!;
        if (weight > currentPr.maxWeight) {
          prMap.set(exerciseId, { exerciseName, maxWeight: weight });
        }
      }
    }

    return Array.from(prMap.values());
  }

  async getMuscleDistribution(userId: string) {
    // Count how many sets per primaryMuscle
    const completedSets = await this.prisma.setLog.findMany({
      where: {
        isCompleted: true,
        workoutExercise: {
          workoutLog: {
            userId,
          },
        },
      },
      include: {
        workoutExercise: {
          include: {
            exercise: true,
          },
        },
      },
    });

    const distribution: Record<string, number> = {};

    for (const set of completedSets) {
      const muscle = set.workoutExercise.exercise.primaryMuscle.toLowerCase();
      if (!distribution[muscle]) {
        distribution[muscle] = 0;
      }
      distribution[muscle] += 1;
    }

    return distribution;
  }
}
