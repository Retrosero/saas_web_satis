import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { GlobalSearchResponse } from '@saas/shared';

export function useGlobalSearch(q: string, limit = 5) {
  return useQuery({
    queryKey: ['global-search', q, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: GlobalSearchResponse }>('/global-search', { params: { q, limit } });
      return data.data;
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}

export function useSearchHistory(limit = 10) {
  return useQuery({
    queryKey: ['global-search', 'history', limit],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: any[] }>('/global-search/history', { params: { limit } });
      return data.data;
    },
  });
}

export function useCommandPalette() {
  return useQuery({
    queryKey: ['command-palette'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: any[] }>('/command-palette/commands');
      return data.data;
    },
    staleTime: 5 * 60_000,
  });
}
