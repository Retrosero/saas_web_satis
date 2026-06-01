import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from './api';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginInput } from '@saas/shared';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      setSession(data);
      toast.success('Giriş başarılı');
      // Role-based redirect
      const isSuperAdmin = data.user.roles?.some((r) => r.roleCode === 'super_admin') ?? false;
      navigate(isSuperAdmin ? '/super-admin/dashboard' : '/dashboard', { replace: true });
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
    },
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login');
    },
  });
}

export function useMe() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
