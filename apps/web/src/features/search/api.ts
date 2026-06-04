import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SearchResponse { results: any[]; byModule: Record<string, any[]>; totalCount: number; durationMs: number }

export function useSearch(q: string, limit = 5) {
  return useQuery({
    queryKey: ['search', q, limit],
    queryFn: async () => { const { data } = await apiClient.get<SearchResponse>('/search', { params: { q, limit } }); return data; },
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

export function useSearchStats() {
  return useQuery({
    queryKey: ['search', 'stats'],
    queryFn: async () => { const { data } = await apiClient.get<any>('/search/stats'); return data; },
    refetchInterval: 10000,
  });
}

export function useReindex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { const { data } = await apiClient.post<{ ok: boolean; counts: any }>('/search-admin/reindex'); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search'] }),
  });
}
