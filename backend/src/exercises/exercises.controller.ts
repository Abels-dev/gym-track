import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { Category, Equipment } from '../../generated/prisma';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: Category,
    @Query('equipment') equipment?: Equipment,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.exercisesService.findAll(pageNumber, limitNumber, search, category, equipment);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }
}
