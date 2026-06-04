import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ApiKey,
  ApiKeyUsageLog,
  ApiScope,
  PaginatedResponse,
  Webhook,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEventType,
  WebhookStatus,
} from '@saas/shared';

export function useApiKeys() {
  return useQuery({
    queryKey: ['api', 'keys'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiKey[]>('/api/keys');
      return data;
    },
  });
}

export function useCreateApiKey() {
  return useMutation({
    mutationFn: async (input: { name: string; scopes: ApiScope[]; expiresAt?: string }) => {
      const { data } = await apiClient.post<{ apiKey: ApiKey; fullKey: string }>('/api/keys', input);
      return data;
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApiKey>(`/api/keys/${id}/revoke`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api', 'keys'] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/api/keys/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api', 'keys'] }),
  });
}

export function useUsageLogs(params?: { page?: number; pageSize?: number; apiKeyId?: string; statusCode?: number }) {
  return useQuery({
    queryKey: ['api', 'usage', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<ApiKeyUsageLog>>('/api/usage-logs', { params });
      return data;
    },
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: ['api', 'webhooks'],
    queryFn: async () => {
      const { data } = await apiClient.get<Webhook[]>('/api/webhooks');
      return data;
    },
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; url: string; events: WebhookEventType[] }) => {
      const { data } = await apiClient.post<{ webhook: Webhook; secret: string }>('/api/webhooks', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api', 'webhooks'] }),
  });
}

export function useUpdateWebhookStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: WebhookStatus) => {
      const { data } = await apiClient.put<Webhook>(`/api/webhooks/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api', 'webhooks'] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/api/webhooks/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api', 'webhooks'] }),
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async (input: { id: string; payload?: any }) => {
      const { data } = await apiClient.post<{ success: boolean; statusCode?: number; errorMessage?: string; duration: number }>(`/api/webhooks/${input.id}/test`, { payload: input.payload });
      return data;
    },
  });
}

export function useDeliveries(params?: { webhookId?: string; status?: WebhookDeliveryStatus; eventType?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['api', 'deliveries', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<WebhookDelivery>>('/api/webhook-deliveries', { params });
      return data;
    },
  });
}
