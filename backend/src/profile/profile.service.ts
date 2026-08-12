import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Profile already exists for this user');
    }

    // Explicitly casting the array to any so Prisma accepts it as JSON
    // because Prisma's JsonInput type can be a bit strict without helper functions.
    const equipmentJson = dto.availableEquipment as any;

    return this.prisma.userProfile.create({
      data: {
        userId,
        ...dto,
        availableEquipment: equipmentJson,
      },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    
    const equipmentJson = dto.availableEquipment ? (dto.availableEquipment as any) : undefined;

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...dto,
        ...(equipmentJson !== undefined && { availableEquipment: equipmentJson }),
      },
    });
  }
}
