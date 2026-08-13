import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthPrincipal) {
    return this.analyticsService.getSummary(user.id);
  }

  @Get('prs')
  getPrs(@CurrentUser() user: AuthPrincipal) {
    return this.analyticsService.getPrs(user.id);
  }

  @Get('muscle-distribution')
  getMuscleDistribution(@CurrentUser() user: AuthPrincipal) {
    return this.analyticsService.getMuscleDistribution(user.id);
  }
}
