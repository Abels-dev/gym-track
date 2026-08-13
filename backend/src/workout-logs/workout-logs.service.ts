import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateSetDto } from './dto/update-set.dto';

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

  async finishWorkout(userId: string, id: string) {
    const workout = await this.prisma.workoutLog.findFirst({
      where: { id, userId },
    });

    if (!workout) throw new NotFoundException(`Workout ${id} not found`);
    if (workout.endedAt) throw new BadRequestException('Workout is already finished');

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - workout.startedAt.getTime()) / 1000);

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

  async getWorkoutHistory(userId: string) {
    return this.prisma.workoutLog.findMany({
      where: { userId, endedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
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
}
