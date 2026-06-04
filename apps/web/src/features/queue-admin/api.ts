import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useQueues() {
  return useQuery({
    queryKey: ['queue-admin', 'queues'],
    queryFn: async () => { const { data } = await apiClient.get<any[]>('/queue-admin/queues'); return data; },
    refetchInterval: 3000,
  });
}

export function useQueueJobs(queueName: string | null, status: string = 'waiting') {
  return useQuery({
    queryKey: ['queue-admin', 'jobs', queueName, status],
    queryFn: async () => { const { data } = await apiClient.get<any[]>(`/queue-admin/queues/${queueName}/jobs`, { params: { status, end: 50 } }); return data; },
    enabled: !!queueName,
    refetchInterval: 5000,
  });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ queue, jobId }: { queue: string; jobId: string }) => { const { data } = await apiClient.post<{ ok: boolean }>(`/queue-admin/queues/${queue}/jobs/${jobId}/retry`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue-admin'] }),
  });
}

export function useRemoveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ queue, jobId }: { queue: string; jobId: string }) => { const { data } = await apiClient.delete<{ ok: boolean }>(`/queue-admin/queues/${queue}/jobs/${jobId}`); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue-admin'] }),
  });
}

export function useEnqueueMail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { to: string; subject: string; html: string }) => { const { data } = await apiClient.post<{ jobId: string; queue: string }>('/queue-admin/mail/enqueue', payload); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue-admin'] }),
  });
}

export function useEnqueueReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { reportKey: string; params?: any }) => { const { data } = await apiClient.post<{ jobId: string; queue: string }>('/queue-admin/report/enqueue', payload); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue-admin'] }),
  });
}

export function useEnqueueBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { op: string; filters: any; update: any }) => { const { data } = await apiClient.post<{ jobId: string; queue: string }>('/queue-admin/bulk/enqueue', payload); return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue-admin'] }),
  });
}
