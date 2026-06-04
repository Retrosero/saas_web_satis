import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@saas/shared';

export function useMonitoringDashboard() {
  return useQuery({
    queryKey: ['monitoring', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<any>('/monitoring/dashboard');
      return data;
    },
  });
}

export function useApiErrors() {
  return useQuery({
    queryKey: ['monitoring', 'api-errors'],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/monitoring/api-errors');
      return data;
    },
  });
}

export function useSlowEndpoints() {
  return useQuery({
    queryKey: ['monitoring', 'slow-endpoints'],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/monitoring/slow-endpoints');
      return data;
    },
  });
}

export function useTenantErrors() {
  return useQuery({
    queryKey: ['monitoring', 'tenant-errors'],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/monitoring/tenant-errors');
      return data;
    },
  });
}

export function useErrorLogs(params?: { page?: number; pageSize?: number; severity?: string; tenantId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['monitoring', 'error-logs', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<any>>('/monitoring/error-logs', { params });
      return data;
    },
  });
}

export function useServices() {
  return useQuery({
    queryKey: ['monitoring', 'services'],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/monitoring/services');
      return data;
    },
  });
}
