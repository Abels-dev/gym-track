import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WorkoutLogsService } from './workout-logs.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { FinishWorkoutDto } from './dto/finish-workout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutLogsController {
  constructor(private readonly workoutLogsService: WorkoutLogsService) {}

  @Post()
  startWorkout(@CurrentUser() user: AuthPrincipal, @Body() dto: CreateWorkoutLogDto) {
    return this.workoutLogsService.startWorkout(user.id, dto);
  }

  @Get('active')
  getActiveWorkout(@CurrentUser() user: AuthPrincipal) {
    return this.workoutLogsService.getActiveWorkout(user.id);
  }

  @Get()
  getHistory(@CurrentUser() user: AuthPrincipal) {
    return this.workoutLogsService.getWorkoutHistory(user.id);
  }

  @Get('exercises/:exerciseId/previous-performance')
  getPreviousPerformance(
    @CurrentUser() user: AuthPrincipal,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.workoutLogsService.getPreviousPerformance(user.id, exerciseId);
  }

  @Delete(':id')
  cancelWorkout(@CurrentUser() user: AuthPrincipal, @Param('id') id: string) {
    return this.workoutLogsService.cancelWorkout(user.id, id);
  }

  @Patch(':id/finish')
  finishWorkout(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body() dto?: FinishWorkoutDto,
  ) {
    return this.workoutLogsService.finishWorkout(user.id, id, dto);
  }

  @Post(':id/exercises')
  addExercise(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') workoutId: string,
    @Body('exerciseId') exerciseId?: string,
    @Body('exerciseIds') exerciseIds?: string[],
  ) {
    if (exerciseIds && Array.isArray(exerciseIds) && exerciseIds.length > 0) {
      return this.workoutLogsService.addExercisesToWorkout(user.id, workoutId, exerciseIds);
    }
    return this.workoutLogsService.addExerciseToWorkout(user.id, workoutId, exerciseId!);
  }

  @Delete('exercises/:workoutExerciseId')
  removeExercise(
    @CurrentUser() user: AuthPrincipal,
    @Param('workoutExerciseId') workoutExerciseId: string,
  ) {
    return this.workoutLogsService.removeExerciseFromWorkout(user.id, workoutExerciseId);
  }

  @Post('exercises/:workoutExerciseId/sets')
  addSet(
    @CurrentUser() user: AuthPrincipal,
    @Param('workoutExerciseId') workoutExerciseId: string,
  ) {
    return this.workoutLogsService.addSetToExercise(user.id, workoutExerciseId);
  }

  @Patch('sets/:setId')
  updateSet(
    @CurrentUser() user: AuthPrincipal,
    @Param('setId') setId: string,
    @Body() dto: UpdateSetDto,
  ) {
    return this.workoutLogsService.updateSet(user.id, setId, dto);
  }

  @Delete('sets/:setId')
  deleteSet(
    @CurrentUser() user: AuthPrincipal,
    @Param('setId') setId: string,
  ) {
    return this.workoutLogsService.deleteSet(user.id, setId);
  }
}
