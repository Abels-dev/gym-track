import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { FinishWorkoutDto } from './dto/finish-workout.dto';

@Injectable()
export class WorkoutLogsService {
  constructor(private prisma: PrismaService) {}

  // Resolves orphaned active workouts by ending them
  async autoFinishActiveWorkouts(userId: string) {
    const activeLogs = await this.prisma.workoutLog.findMany({
      where: { userId, endedAt: null },
    });

    for (const log of activeLogs) {
      const durationSeconds = Math.floor((new Date().getTime() - log.startedAt.getTime()) / 1000);
      await this.prisma.workoutLog.update({
        where: { id: log.id },
        data: { endedAt: new Date(), durationSeconds },
      });
    }
  }

  async startWorkout(userId: string, dto: CreateWorkoutLogDto) {
    // 1. Clean up any lingering active sessions
    await this.autoFinishActiveWorkouts(userId);

    // 2. Prepare the payload
    let exercisesToCreate: any[] = [];

    // 3. If a routine is provided, fetch it and map its exercises and sets
    if (dto.routineId) {
      const routine = await this.prisma.routine.findUnique({
        where: { id: dto.routineId, userId },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });

      if (!routine) {
        throw new NotFoundException(`Routine ${dto.routineId} not found`);
      }

      // Map routine exercises into workout exercises, pre-populating empty sets
      exercisesToCreate = routine.exercises.map((routineEx) => {
        const setsToCreate: any[] = [];
        for (let i = 1; i <= routineEx.targetSets; i++) {
          setsToCreate.push({
            setNumber: i,
            weight: 0,
            reps: 0,
            isCompleted: false, // Critical: Starts as incomplete so UI shows it empty
          });
        }

        return {
          exerciseId: routineEx.exerciseId,
          order: routineEx.order,
          plannedSets: routineEx.targetSets,
          plannedRepMin: routineEx.targetRepMin,
          plannedRepMax: routineEx.targetRepMax,
          restSeconds: routineEx.restSeconds,
          notes: routineEx.notes,
          sets: {
            create: setsToCreate,
          },
        };
      });
    }

    // 4. Create the WorkoutLog, along with nested exercises and sets
    return this.prisma.workoutLog.create({
      data: {
        userId,
        routineId: dto.routineId,
        notes: dto.notes,
        exercises: {
          create: exercisesToCreate,
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getActiveWorkout(userId: string) {
    const activeWorkout = await this.prisma.workoutLog.findFirst({
      where: { userId, endedAt: null },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!activeWorkout) {
      throw new NotFoundException('No active workout found');
    }

    return activeWorkout;
  }

  async finishWorkout(userId: string, id: string, dto?: FinishWorkoutDto) {
    const workout = await this.prisma.workoutLog.findFirst({
      where: { id, userId },
    });

    if (!workout) throw new NotFoundException(`Workout ${id} not found`);
    if (workout.endedAt) throw new BadRequestException('Workout is already finished');

    let endedAt = new Date();
    if (dto?.endedAt) {
      const parsed = new Date(dto.endedAt);
      if (!isNaN(parsed.getTime())) {
        endedAt = parsed;
      }
    }

    let durationSeconds = dto?.durationSeconds;
    if (durationSeconds === undefined || durationSeconds === null || durationSeconds < 0) {
      durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - workout.startedAt.getTime()) / 1000));
    }

    return this.prisma.workoutLog.update({
      where: { id },
      data: { endedAt, durationSeconds },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async updateSet(userId: string, setId: string, dto: UpdateSetDto) {
    // Basic verification that this set belongs to the user
    const set = await this.prisma.setLog.findUnique({
      where: { id: setId },
      include: { workoutExercise: { include: { workoutLog: true } } },
    });

    if (!set || set.workoutExercise.workoutLog.userId !== userId) {
      throw new NotFoundException(`Set ${setId} not found`);
    }

    return this.prisma.setLog.update({
      where: { id: setId },
      data: {
        weight: dto.weight,
        reps: dto.reps,
        rir: dto.rir,
        isCompleted: dto.isCompleted,
      },
    });
  }

  async addExerciseToWorkout(userId: string, workoutId: string, exerciseId: string) {
    return this.addExercisesToWorkout(userId, workoutId, [exerciseId]);
  }

  async addExercisesToWorkout(userId: string, workoutId: string, exerciseIds: string[]) {
    const workout = await this.prisma.workoutLog.findFirst({
      where: { id: workoutId, userId, endedAt: null },
      include: { exercises: true },
    });

    if (!workout) {
      throw new NotFoundException('Active workout not found');
    }

    let currentOrder = workout.exercises.length;
    const created: any[] = [];

    for (const exerciseId of exerciseIds) {
      const we = await this.prisma.workoutExercise.create({
        data: {
          workoutLogId: workoutId,
          exerciseId,
          order: currentOrder++,
          sets: {
            create: [
              { setNumber: 1, weight: 0, reps: 0, isCompleted: false },
            ],
          },
        },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      });
      created.push(we);
    }

    return created;
  }

  async removeExerciseFromWorkout(userId: string, workoutExerciseId: string) {
    const workoutExercise = await this.prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
      include: { workoutLog: true },
    });

    if (!workoutExercise || workoutExercise.workoutLog.userId !== userId || workoutExercise.workoutLog.endedAt !== null) {
      throw new NotFoundException('Workout exercise not found or session ended');
    }

    return this.prisma.workoutExercise.delete({
      where: { id: workoutExerciseId },
    });
  }

  async addSetToExercise(userId: string, workoutExerciseId: string) {
    const workoutExercise = await this.prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
      include: {
        workoutLog: true,
        sets: { orderBy: { setNumber: 'desc' }, take: 1 },
      },
    });

    if (!workoutExercise || workoutExercise.workoutLog.userId !== userId || workoutExercise.workoutLog.endedAt !== null) {
      throw new NotFoundException('Workout exercise not found or session ended');
    }

    const nextSetNumber = (workoutExercise.sets[0]?.setNumber || 0) + 1;
    const lastWeight = workoutExercise.sets[0]?.weight || 0;
    const lastReps = workoutExercise.sets[0]?.reps || 0;

    return this.prisma.setLog.create({
      data: {
        workoutExerciseId,
        setNumber: nextSetNumber,
        weight: lastWeight,
        reps: lastReps,
        isCompleted: false,
      },
    });
  }

  async deleteSet(userId: string, setId: string) {
    const set = await this.prisma.setLog.findUnique({
      where: { id: setId },
      include: {
        workoutExercise: {
          include: {
            workoutLog: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
        },
      },
    });

    if (!set || set.workoutExercise.workoutLog.userId !== userId || set.workoutExercise.workoutLog.endedAt !== null) {
      throw new NotFoundException('Set not found or session ended');
    }

    await this.prisma.setLog.delete({
      where: { id: setId },
    });

    // Re-index remaining sets
    const remainingSets = set.workoutExercise.sets.filter((s) => s.id !== setId);
    for (let i = 0; i < remainingSets.length; i++) {
      if (remainingSets[i].setNumber !== i + 1) {
        await this.prisma.setLog.update({
          where: { id: remainingSets[i].id },
          data: { setNumber: i + 1 },
        });
      }
    }

    return { success: true };
  }

  async cancelWorkout(userId: string, workoutId: string) {
    const workout = await this.prisma.workoutLog.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    await this.prisma.workoutLog.delete({
      where: { id: workoutId },
    });

    return { success: true };
  }

  async deleteWorkoutHistoryLog(userId: string, workoutId: string) {
    const workout = await this.prisma.workoutLog.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    await this.prisma.workoutLog.delete({
      where: { id: workoutId },
    });

    return { success: true };
  }

  async getPreviousPerformance(userId: string, exerciseId: string) {
    const prevWorkoutExercise = await this.prisma.workoutExercise.findFirst({
      where: {
        exerciseId,
        workoutLog: {
          userId,
          endedAt: { not: null },
        },
      },
      orderBy: {
        workoutLog: {
          startedAt: 'desc',
        },
      },
      include: {
        sets: {
          where: { isCompleted: true },
          orderBy: { setNumber: 'asc' },
        },
      },
    });

    if (!prevWorkoutExercise) {
      return [];
    }

    return prevWorkoutExercise.sets.map((s) => ({
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
    }));
  }

  async getWorkoutHistory(userId: string) {
    return this.prisma.workoutLog.findMany({
      where: { userId, endedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      include: {
        routine: true,
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
