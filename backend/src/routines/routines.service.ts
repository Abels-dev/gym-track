import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateRoutineDto) {
    return this.prisma.routine.create({
      data: {
        name: dto.name,
        description: dto.description,
        userId,
        exercises: {
          create: dto.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            targetSets: ex.targetSets,
            targetRepMin: ex.targetRepMin,
            targetRepMax: ex.targetRepMax,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.routine.findMany({
      where: { userId, isArchived: false },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const routine = await this.prisma.routine.findFirst({
      where: { id, userId, isArchived: false },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: {
            exercise: true,
          },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    return routine;
  }

  async update(userId: string, id: string, dto: UpdateRoutineDto) {
    // Check if exists
    await this.findOne(userId, id);

    // If exercises are provided, we replace the entire nested list
    if (dto.exercises) {
      return this.prisma.routine.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          exercises: {
            deleteMany: {}, // Clear old exercises
            create: dto.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              order: ex.order,
              targetSets: ex.targetSets,
              targetRepMin: ex.targetRepMin,
              targetRepMax: ex.targetRepMax,
              restSeconds: ex.restSeconds,
              notes: ex.notes,
            })),
          },
        },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { exercise: true },
          },
        },
      });
    }

    // If no exercises provided, just update metadata
    return this.prisma.routine.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: { exercise: true },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.routine.delete({
      where: { id },
    });
  }
}
