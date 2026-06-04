import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CacheMetrics { hits: number; misses: number; sets: number; deletes: number; hitRate: number; total: number }

export function useCacheMetrics() {
  return useQuery({
    queryKey: ['cache-admin', 'metrics'],
    queryFn: async () => { const { data } = await apiClient.get<CacheMetrics>('/cache-admin/metrics'); return data; },
    refetchInterval: 5000,
  });
}

export function useCachePing() {
  return useQuery({
    queryKey: ['cache-admin', 'ping'],
    queryFn: async () => { const { data } = await apiClient.get<{ ok: boolean }>('/cache-admin/ping'); return data; },
    refetchInterval: 10000,
  });
}

export function useInvalidateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (module?: string) => { const { data } = await apiClient.delete<{ ok: boolean; deleted: number; module: string }>('/cache-admin/tenant', { params: { module } }); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cache-admin'] }),
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { const { data } = await apiClient.delete<{ ok: boolean; deleted: number }>('/cache-admin/all'); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cache-admin'] }),
  });
}

export function useResetMetrics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { await apiClient.delete('/cache-admin/metrics'); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cache-admin', 'metrics'] }),
  });
}
