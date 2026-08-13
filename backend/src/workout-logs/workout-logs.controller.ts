import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { WorkoutLogsService } from './workout-logs.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateSetDto } from './dto/update-set.dto';
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

  @Patch(':id/finish')
  finishWorkout(@CurrentUser() user: AuthPrincipal, @Param('id') id: string) {
    return this.workoutLogsService.finishWorkout(user.id, id);
  }

  @Patch('sets/:setId')
  updateSet(
    @CurrentUser() user: AuthPrincipal,
    @Param('setId') setId: string,
    @Body() dto: UpdateSetDto,
  ) {
    return this.workoutLogsService.updateSet(user.id, setId, dto);
  }
}
