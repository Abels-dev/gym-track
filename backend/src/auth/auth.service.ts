import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AuthIdentity,
  AuthSession,
  AuthUser,
  JwtPayload,
} from './auth.types';
import { normalizeEmail } from './auth.utils';

const SALT_ROUNDS = 12;

type UserWithProfile = Prisma.UserGetPayload<{
  include: {
    profile: true;
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = normalizeEmail(dto.email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(dto.password, SALT_ROUNDS),
        },
        include: {
          profile: true,
        },
      });

      return this.createSession(user);
    } catch (error: unknown) {
      if (this.isUniqueEmailError(error)) {
        throw new ConflictException('Email is already in use');
      }

      throw new InternalServerErrorException('Could not create user');
    }
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const email = normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createSession(user);
  }

  async me(userId: string): Promise<AuthIdentity> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.createIdentity(user);
  }

  private async createSession(user: UserWithProfile): Promise<AuthSession> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      ...this.createIdentity(user),
    };
  }

  private createIdentity(user: UserWithProfile): AuthIdentity {
    return {
      needsOnboarding: !user.profile,
      user: this.toAuthUser(user),
    };
  }

  private toAuthUser(user: UserWithProfile): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profileComplete: Boolean(user.profile),
    };
  }

  private isUniqueEmailError(error: unknown): boolean {
    return error instanceof PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
