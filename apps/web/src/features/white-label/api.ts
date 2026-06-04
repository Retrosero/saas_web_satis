import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { WhiteLabelSettings } from '@saas/shared';

export function useWhiteLabel() {
  return useQuery({
    queryKey: ['white-label'],
    queryFn: async () => {
      const { data } = await apiClient.get<WhiteLabelSettings>('/white-label');
      return data;
    },
  });
}

export function useUpdateWhiteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<WhiteLabelSettings>) => {
      const { data } = await apiClient.post<WhiteLabelSettings>('/white-label', patch);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['white-label'] }),
  });
}

export function useValidateDomain() {
  return useMutation({
    mutationFn: async (domain: string) => {
      const { data } = await apiClient.post<{ valid: boolean; dnsRecords: Array<{ type: string; host: string; value: string }>; message: string }>('/white-label/validate-domain', { domain });
      return data;
    },
  });
}
