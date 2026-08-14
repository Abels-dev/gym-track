import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: 'USER' | 'ADMIN';
  profileComplete: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  needsOnboarding: boolean;
  
  // Actions
  login: (user: AuthUser, accessToken: string, needsOnboarding: boolean) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      needsOnboarding: false,

      login: (user, accessToken, needsOnboarding) =>
        set({ user, accessToken, needsOnboarding }),

      logout: () =>
        set({ user: null, accessToken: null, needsOnboarding: false }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'gym-track-auth', // name of the item in the storage (must be unique)
    }
  )
);
