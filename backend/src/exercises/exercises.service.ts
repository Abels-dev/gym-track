import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category, Equipment } from '@prisma/client';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number, limit: number, category?: Category, equipment?: Equipment) {
    const whereClause: any = {};
    if (category) whereClause.category = category;
    if (equipment) whereClause.equipment = equipment;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.exercise.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    return exercise;
  }
}
