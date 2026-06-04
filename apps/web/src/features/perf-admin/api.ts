import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useQueryStats() {
  return useQuery({
    queryKey: ['perf-admin', 'stats'],
    queryFn: async () => { const { data } = await apiClient.get<any>('/perf-admin/queries/stats'); return data; },
    refetchInterval: 5000,
  });
}

export function useRecentQueries(limit = 30) {
  return useQuery({
    queryKey: ['perf-admin', 'recent', limit],
    queryFn: async () => { const { data } = await apiClient.get<any[]>('/perf-admin/queries/recent', { params: { limit } }); return data; },
    refetchInterval: 5000,
  });
}

export function useSlowQueries(limit = 20) {
  return useQuery({
    queryKey: ['perf-admin', 'slow', limit],
    queryFn: async () => { const { data } = await apiClient.get<any[]>('/perf-admin/queries/slow', { params: { limit } }); return data; },
    refetchInterval: 10000,
  });
}

export function useClearQueries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { await apiClient.delete('/perf-admin/queries/clear'); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perf-admin'] }),
  });
}
