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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
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
    private readonly emailService: EmailService,
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
          fullName: dto.fullName,
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    // For security, always return success message even if user doesn't exist
    if (!user) {
      return { message: 'If that email exists, a reset code was sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: await bcrypt.hash(otp, SALT_ROUNDS),
        resetPasswordExpires: expires,
      },
    });

    await this.emailService.sendPasswordResetOtpEmail(user.email, otp);

    return { message: 'If that email exists, a reset code was sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.resetPasswordOtp || !user.resetPasswordExpires) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('Reset code has expired');
    }

    const isValidOtp = await bcrypt.compare(dto.otp, user.resetPasswordOtp);
    if (!isValidOtp) {
      throw new UnauthorizedException('Invalid reset code');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordExpires: null,
      },
    });

    await this.emailService.sendPasswordResetSuccessEmail(user.email);

    return { message: 'Password reset successful' };
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
      fullName:user.fullName
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
      fullName: user.fullName,
      role: user.role,
      profileComplete: Boolean(user.profile),
    };
  }

  private isUniqueEmailError(error: unknown): boolean {
    return error instanceof PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
