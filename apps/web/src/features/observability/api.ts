import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useObservabilityHealth() {
  return useQuery({
    queryKey: ['observability', 'health'],
    queryFn: async () => { const { data } = await apiClient.get<any>('/observability/health'); return data; },
    refetchInterval: 10000,
  });
}

export function useTestError() {
  return useMutation({
    mutationFn: async (type: 'sentry' | 'http' | 'unhandled') => { const { data } = await apiClient.post<any>('/observability/test-error', { type }); return data; },
  });
}
