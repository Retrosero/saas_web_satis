import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useRealtimeStats() {
  return useQuery({
    queryKey: ['realtime-admin', 'stats'],
    queryFn: async () => { const { data } = await apiClient.get<{ connectedClients: number }>('/realtime-admin/stats'); return data; },
    refetchInterval: 3000,
  });
}

export function useSendTest() {
  return useMutation({
    mutationFn: async (payload: { event?: string; message?: string }) => { const { data } = await apiClient.post<{ ok: boolean }>('/realtime-admin/test', payload); return data; },
  });
}
