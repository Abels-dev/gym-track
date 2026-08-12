import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  create(@CurrentUser() user: AuthPrincipal, @Body() createRoutineDto: CreateRoutineDto) {
    return this.routinesService.create(user.id, createRoutineDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthPrincipal) {
    return this.routinesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthPrincipal, @Param('id') id: string) {
    return this.routinesService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthPrincipal,
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
  ) {
    return this.routinesService.update(user.id, id, updateRoutineDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthPrincipal, @Param('id') id: string) {
    return this.routinesService.remove(user.id, id);
  }
}
