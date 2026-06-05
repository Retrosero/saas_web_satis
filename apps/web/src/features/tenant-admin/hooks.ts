import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantAdminApi } from './api';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';

export function useTenantInfo() {
  return useQuery({ queryKey: ['tenant-admin', 'me'], queryFn: tenantAdminApi.getMe, staleTime: 60_000 });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.updateMe,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-admin', 'me'] }),
  });
}

export function useSubscription() {
  return useQuery({ queryKey: ['tenant-admin', 'subscription'], queryFn: tenantAdminApi.getSubscription, staleTime: 30_000 });
}

export function useTenantModules() {
  return useQuery({
    queryKey: ['tenant-admin', 'modules'],
    queryFn: tenantAdminApi.getModules,
    staleTime: 30_000,
  });
}

export function useToggleModule() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: ({ code, isActive }: { code: string; isActive: boolean }) =>
      tenantAdminApi.toggleModule(code, isActive),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['tenant-admin', 'modules'] });
      qc.invalidateQueries({ queryKey: ['tenant-admin', 'subscription'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      // Kullanıcının activeModules'ini güncelle
      try {
        const userData = await authApi.me();
        setUser(userData);
      } catch (e) {
        // Auth me başarısız olursa sessizce devam et, kullanıcı zaten login değilse hata vermez
      }
    },
  });
}

export function useTenantUsers(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({ queryKey: ['tenant-admin', 'users', params], queryFn: () => tenantAdminApi.listUsers(params), staleTime: 10_000 });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['tenant-admin', 'subscription'] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { fullName?: string; phone?: string; status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' } }) =>
      tenantAdminApi.updateUser(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-admin', 'users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['tenant-admin', 'subscription'] });
    },
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      tenantAdminApi.assignRole(userId, roleCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-admin', 'users'] }),
  });
}

export function useTenantRoles() {
  return useQuery({ queryKey: ['tenant-admin', 'roles'], queryFn: tenantAdminApi.listRoles, staleTime: 60_000 });
}
