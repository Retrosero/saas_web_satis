import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Collection,
  CollectionStatus,
  CollectionType,
  Customer,
  PaginatedResponse,
} from '@saas/shared';

export type CollectionListItem = Collection;

export function useCollectionsList(params?: {
  page?: number;
  pageSize?: number;
  customerId?: string;
  status?: CollectionStatus;
  type?: CollectionType;
  search?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['collections', 'list', params],
    queryFn: () =>
      apiClient
        .get<{ data: PaginatedResponse<CollectionListItem> }>('/collections', { params })
        .then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function useCollection(id: string | undefined) {
  return useQuery({
    queryKey: ['collections', id],
    queryFn: () =>
      apiClient.get<{ data: Collection }>(`/collections/${id}`).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateCollection() {
  return useMutation({
    mutationFn: (input: {
      customerId: string;
      collectionDate: string;
      type?: CollectionType;
      amount: number;
      linkedSaleId?: string;
      notes?: string;
    }) =>
      apiClient.post<{ data: Collection }>('/collections', input).then((r) => r.data.data),
  });
}

export function useConfirmCollection() {
  return useMutation({
    mutationFn: ({ id, cashAccountId }: { id: string; cashAccountId: string }) =>
      apiClient.post<{ data: Collection }>(`/collections/${id}/confirm`, { cashAccountId }).then((r) => r.data.data),
  });
}

export function useCancelCollection() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<{ data: Collection }>(`/collections/${id}/cancel`, { reason }).then((r) => r.data.data),
  });
}

export function useDeleteCollection() {
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/collections/${id}`).then(() => id),
  });
}

export function useCustomerSearch(keyword: string) {
  const normalizedKeyword = keyword.trim();
  return useQuery({
    queryKey: ['customers', 'search', normalizedKeyword],
    queryFn: () =>
      apiClient
        .get<{ data: PaginatedResponse<Customer> }>('/customers', {
          params: { search: normalizedKeyword || undefined, pageSize: 20, status: 'ACTIVE' },
        })
        .then((r) => r.data.data.data),
    staleTime: 10_000,
  });
}
