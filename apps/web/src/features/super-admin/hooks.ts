import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from './api';
import type { TenantStatus } from '@saas/shared';

export function useSuperAdminOverview() {
  return useQuery({
    queryKey: ['super-admin', 'overview'],
    queryFn: superAdminApi.getOverview,
    staleTime: 30_000,
  });
}

export function useAdminTenants(params: { page?: number; pageSize?: number; search?: string; status?: TenantStatus } = {}) {
  return useQuery({
    queryKey: ['super-admin', 'tenants', params],
    queryFn: () => superAdminApi.listTenants(params),
    staleTime: 10_000,
  });
}

export function useAdminTenant(id: string | undefined) {
  return useQuery({
    queryKey: ['super-admin', 'tenant', id],
    queryFn: () => superAdminApi.getTenant(id!),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: superAdminApi.createTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'overview'] });
    },
  });
}

export function useUpdateTenantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TenantStatus }) =>
      superAdminApi.updateTenantStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'overview'] });
    },
  });
}

export function useAssignPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, planCode }: { id: string; planCode: string }) =>
      superAdminApi.assignPlan(id, planCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'tenant'] });
    },
  });
}

export function useAdminPlans() {
  return useQuery({
    queryKey: ['super-admin', 'plans'],
    queryFn: superAdminApi.listPlans,
    staleTime: 60_000,
  });
}

export function useAdminModules() {
  return useQuery({
    queryKey: ['super-admin', 'modules'],
    queryFn: superAdminApi.listModules,
    staleTime: 60_000,
  });
}

export function useAdminUsers(params: { page?: number; pageSize?: number; search?: string; tenantId?: string } = {}) {
  return useQuery({
    queryKey: ['super-admin', 'users', params],
    queryFn: () => superAdminApi.listUsers(params),
    staleTime: 10_000,
  });
}
