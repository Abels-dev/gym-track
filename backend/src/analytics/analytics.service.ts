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

  async getCoachInsights(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    const targetDaysPerWeek = profile?.targetDaysPerWeek || 4;
    const goal = profile?.primaryGoal || 'MUSCLE_GAIN';
    const experience = profile?.experienceLevel || 'BEGINNER';
    const preferredUnit = profile?.preferredUnit === 'LBS' ? 'lbs' : 'kg';

    // Fetch user workouts completed in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const workouts = await this.prisma.workoutLog.findMany({
      where: {
        userId,
        endedAt: { not: null },
        startedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { startedAt: 'desc' },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { where: { isCompleted: true }, orderBy: { setNumber: 'asc' } },
          },
        },
      },
    });

    const insights: Array<{
      id: string;
      type: 'PROGRESSION' | 'RECOVERY' | 'BALANCE' | 'CONSISTENCY' | 'GOAL_TIP';
      title: string;
      message: string;
      actionText?: string;
      actionHref?: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      categoryIcon: 'flame' | 'trending-up' | 'scale' | 'shield' | 'target' | 'dumbbell';
      badge?: string;
    }> = [];

    const now = new Date();
    // Monday as start of week
    const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon, 7=Sun
    const daysLeftInWeek = 7 - currentDay;

    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - (currentDay - 1));
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const thisWeekWorkouts = workouts.filter(
      (w) => new Date(w.startedAt).getTime() >= startOfCurrentWeek.getTime()
    );
    const thisWeekCount = thisWeekWorkouts.length;
    const lastWorkout = workouts[0];

    // 1. CONSISTENCY & PACING
    if (thisWeekCount >= targetDaysPerWeek) {
      insights.push({
        id: 'target-achieved',
        type: 'CONSISTENCY',
        title: 'Weekly Target Smashed',
        message: `You've completed ${thisWeekCount} of ${targetDaysPerWeek} planned workouts this week! Great job staying committed to progressive gains.`,
        priority: 'HIGH',
        categoryIcon: 'flame',
        badge: 'On Fire',
      });
    } else {
      const remainingNeeded = targetDaysPerWeek - thisWeekCount;
      if (daysLeftInWeek < remainingNeeded) {
        insights.push({
          id: 'catch-up-schedule',
          type: 'CONSISTENCY',
          title: 'Tight Schedule Ahead',
          message: `You have ${remainingNeeded} workouts remaining to hit your ${targetDaysPerWeek}-day target with ${daysLeftInWeek} ${daysLeftInWeek === 1 ? 'day' : 'days'} left this week. A quick session today will keep you on track!`,
          actionText: 'Start Workout',
          actionHref: '/workout',
          priority: 'HIGH',
          categoryIcon: 'target',
          badge: 'Weekly Goal',
        });
      } else if (lastWorkout) {
        const daysSinceLast = Math.floor((now.getTime() - new Date(lastWorkout.startedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLast >= 3) {
          insights.push({
            id: 'resume-momentum',
            type: 'CONSISTENCY',
            title: 'Time to Regain Momentum',
            message: `It has been ${daysSinceLast} days since your last workout. Consistent stimulation is key for strength adaptations and muscle protein synthesis.`,
            actionText: 'Quick Session',
            actionHref: '/workout',
            priority: 'HIGH',
            categoryIcon: 'flame',
            badge: 'Streak',
          });
        }
      }
    }

    // 2. RECOVERY & REST CHECKS
    if (thisWeekWorkouts.length >= 4) {
      // Check for consecutive training days
      const workoutDays = Array.from(new Set(thisWeekWorkouts.map((w) => new Date(w.startedAt).toDateString())));
      if (workoutDays.length >= 4) {
        insights.push({
          id: 'active-recovery-tip',
          type: 'RECOVERY',
          title: 'Prioritize Muscle Recovery',
          message: `You've logged ${workoutDays.length} sessions in close succession. Consider an active recovery day or mobility work tomorrow to prevent fatigue accumulation.`,
          priority: 'MEDIUM',
          categoryIcon: 'shield',
          badge: 'Recovery',
        });
      }
    }

    // 3. MUSCLE BALANCE & SYMMETRY
    let pushSets = 0;
    let pullSets = 0;
    let legSets = 0;
    let totalSets = 0;

    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const count = ex.sets.length;
        totalSets += count;
        if (ex.exercise.category === 'PUSH') pushSets += count;
        if (ex.exercise.category === 'PULL') pullSets += count;
        if (ex.exercise.category === 'LEGS') legSets += count;
      });
    });

    if (totalSets >= 12) {
      const legRatio = Math.round((legSets / totalSets) * 100);
      const pushRatio = Math.round((pushSets / totalSets) * 100);
      const pullRatio = Math.round((pullSets / totalSets) * 100);

      if (legRatio < 15) {
        insights.push({
          id: 'balance-legs',
          type: 'BALANCE',
          title: 'Lower Body Volume Needed',
          message: `Leg volume accounts for only ${legRatio}% of your recent sets (${legSets} of ${totalSets} sets). Adding squats, Romanian deadlifts, or leg press will build a balanced foundation.`,
          actionText: 'Explore Leg Exercises',
          actionHref: '/exercises',
          priority: 'HIGH',
          categoryIcon: 'scale',
          badge: 'Balance',
        });
      } else if (pushRatio > 55 && pullRatio < 25) {
        insights.push({
          id: 'balance-push-pull',
          type: 'BALANCE',
          title: 'Push vs Pull Disparity',
          message: `You're logging significantly more pressing (${pushRatio}%) than pulling movements (${pullRatio}%). Increasing rows and lat pulldowns protects posture and shoulder health.`,
          actionText: 'View Pull Exercises',
          actionHref: '/exercises',
          priority: 'MEDIUM',
          categoryIcon: 'scale',
          badge: 'Symmetry',
        });
      }
    }

    // 4. PROGRESSIVE OVERLOAD OPPORTUNITY
    // Group exercise instances across distinct completed workouts
    const exerciseHistoryMap = new Map<
      string,
      {
        exerciseId: string;
        exerciseName: string;
        sessions: {
          workoutDate: Date;
          sets: { weight: number; reps: number; isCompleted: boolean }[];
        }[];
      }
    >();

    for (const w of workouts) {
      for (const we of w.exercises) {
        if (!we.exercise?.id) continue;
        const validSets = we.sets.filter(
          (s) => s.isCompleted && s.weight > 0 && s.reps > 0
        );
        if (validSets.length === 0) continue;

        if (!exerciseHistoryMap.has(we.exercise.id)) {
          exerciseHistoryMap.set(we.exercise.id, {
            exerciseId: we.exercise.id,
            exerciseName: we.exercise.name,
            sessions: [],
          });
        }
        exerciseHistoryMap.get(we.exercise.id)!.sessions.push({
          workoutDate: new Date(w.startedAt),
          sets: validSets,
        });
      }
    }

    // Only suggest overload if the lifter has completed this specific exercise in at least 2 distinct workouts
    for (const [exerciseId, history] of exerciseHistoryMap.entries()) {
      if (history.sessions.length >= 2) {
        const latestSession = history.sessions[0];

        // Check if latest session demonstrated solid volume (>= 2 completed working sets with solid reps)
        const solidSets = latestSession.sets.filter((s) => s.reps >= 8);
        if (solidSets.length >= 2) {
          const maxWeight = Math.max(...latestSession.sets.map((s) => s.weight));
          const step = preferredUnit === 'lbs' ? 5 : 2.5;
          const nextWeight = maxWeight + step;

          insights.push({
            id: `overload-${exerciseId}`,
            type: 'PROGRESSION',
            title: `Ready to Overload: ${history.exerciseName}`,
            message: `You've logged ${history.exerciseName} across ${history.sessions.length} sessions, most recently completing ${latestSession.sets.length} working sets at ${maxWeight} ${preferredUnit}. On your next session, aim for ${nextWeight} ${preferredUnit} to drive progressive overload.`,
            actionText: 'Log Next Workout',
            actionHref: '/workout',
            priority: 'HIGH',
            categoryIcon: 'trending-up',
            badge: `+${step} ${preferredUnit}`,
          });
          break; // Highlight primary overload candidate
        }
      }
    }

    // 5. GOAL & EXPERIENCE TAILORED PRINCIPLE TIP
    const goalTips: Record<string, { title: string; message: string; badge: string }> = {
      MUSCLE_GAIN: {
        title: 'Hypertrophy Volume Sweet Spot',
        message: 'For optimal muscle growth, aim for 10–18 high-quality working sets per muscle group each week, training within 1–3 reps of muscular failure.',
        badge: 'Hypertrophy',
      },
      STRENGTH: {
        title: 'Neuromuscular Power & Rest',
        message: 'On heavy compound lifts (squats, deadlifts, presses), take 2–3 minutes of rest between sets to allow full ATP-CP energy replenishment.',
        badge: 'Strength',
      },
      WEIGHT_LOSS: {
        title: 'Preserve Lean Mass While Cutting',
        message: 'Maintain lifting intensity and load even in a caloric deficit. Lifting heavy signals your body to retain muscle while burning fat.',
        badge: 'Fat Loss',
      },
      GENERAL_FITNESS: {
        title: 'Balanced Longevity & Mobility',
        message: 'Combine full range-of-motion resistance movements with steady weekly consistency to improve joint health, posture, and cardiovascular efficiency.',
        badge: 'Longevity',
      },
    };

    const tip = goalTips[goal] || goalTips.MUSCLE_GAIN;
    insights.push({
      id: `goal-tip-${goal.toLowerCase()}`,
      type: 'GOAL_TIP',
      title: tip.title,
      message: tip.message,
      priority: 'LOW',
      categoryIcon: 'target',
      badge: tip.badge,
    });

    // Ensure highest priority items appear first
    const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    insights.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    return insights.slice(0, 4);
  }
}
