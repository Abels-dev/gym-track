import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  profileComplete: boolean;
}

export interface AuthPrincipal {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
}

export interface AuthSession {
  accessToken: string;
  needsOnboarding: boolean;
  user: AuthUser;
}

export interface AuthIdentity {
  needsOnboarding: boolean;
  user: AuthUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  fullName: string | null;
}
