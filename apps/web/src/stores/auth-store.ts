import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserWithRoles } from '@saas/shared';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserWithRoles | null;
  setSession: (data: { accessToken: string; refreshToken: string; user: UserWithRoles }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserWithRoles) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'saas-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
