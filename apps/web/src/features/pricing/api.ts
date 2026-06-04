import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Campaign,
  CampaignStatus,
  CampaignTestResult,
  CampaignType,
  CustomerPriceGroup,
  PriceList,
  PriceListStatus,
} from '@saas/shared';

export function usePriceLists(params?: { search?: string; status?: PriceListStatus; currency?: string; customerGroupId?: string }) {
  return useQuery({
    queryKey: ['pricing', 'price-lists', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PriceList[]>('/pricing/price-lists', { params });
      return data;
    },
  });
}

export function usePriceList(id: string) {
  return useQuery({
    queryKey: ['pricing', 'price-lists', id],
    queryFn: async () => {
      const { data } = await apiClient.get<PriceList>(`/pricing/price-lists/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePriceList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PriceList>) => {
      const { data } = await apiClient.post<PriceList>('/pricing/price-lists', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing', 'price-lists'] }),
  });
}

export function useUpdatePriceList(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PriceList>) => {
      const { data } = await apiClient.put<PriceList>(`/pricing/price-lists/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing', 'price-lists'] }),
  });
}

export function useDeletePriceList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/pricing/price-lists/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing', 'price-lists'] }),
  });
}

export function useCustomerGroups() {
  return useQuery({
    queryKey: ['pricing', 'customer-groups'],
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerPriceGroup[]>('/pricing/customer-groups');
      return data;
    },
  });
}

export function useCreateCustomerGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CustomerPriceGroup>) => {
      const { data } = await apiClient.post<CustomerPriceGroup>('/pricing/customer-groups', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing', 'customer-groups'] }),
  });
}

export function useAddGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customerId: string; customDiscountRate?: number }) => {
      await apiClient.post(`/pricing/customer-groups/${groupId}/members`, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing', 'customer-groups'] }),
  });
}

export function useCampaigns(params?: { status?: CampaignStatus; campaignType?: CampaignType; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['pricing', 'campaigns', params],
    queryFn: async () => {
      const { data } = await apiClient.get<Campaign[]>('/pricing/campaigns', { params });
      return data;
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['pricing', 'campaigns', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Campaign>(`/pricing/campaigns/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Campaign>) => {
      const { data } = await apiClient.post<Campaign>('/pricing/campaigns', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing', 'campaigns'] }),
  });
}

export function useUpdateCampaign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Campaign>) => {
      const { data } = await apiClient.put<Campaign>(`/pricing/campaigns/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing', 'campaigns'] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/pricing/campaigns/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing', 'campaigns'] }),
  });
}

export function useTestCampaign() {
  return useMutation({
    mutationFn: async (input: { campaignId: string; customerId?: string; productId?: string; quantity: number; unitPrice: number; cartAmount: number }) => {
      const { data } = await apiClient.post<CampaignTestResult>('/pricing/campaigns/test', input);
      return data;
    },
  });
}
