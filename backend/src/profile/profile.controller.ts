import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  createProfile(
    @CurrentUser() user: AuthPrincipal,
    @Body() dto: CreateProfileDto,
  ) {
    return this.profileService.createProfile(user.id, dto);
  }

  @Get()
  getProfile(@CurrentUser() user: AuthPrincipal) {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthPrincipal,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, dto);
  }
}
