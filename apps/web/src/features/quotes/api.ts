import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Quote, QuoteStatus } from '@saas/shared';

export function useQuotes(params?: { status?: QuoteStatus; customerId?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: Quote[]; total: number; page: number; pageSize: number }>('/quotes', { params });
      return data;
    },
  });
}

export function useQuote(id?: string) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Quote>(`/quotes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post<Quote>('/quotes', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
}

export function useUpdateQuoteStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { status: QuoteStatus; note?: string }) => {
      const { data } = await apiClient.put<Quote>(`/quotes/${id}/status`, input);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); qc.invalidateQueries({ queryKey: ['quotes', id] }); },
  });
}

export function useConvertQuoteToOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { const { data } = await apiClient.post<{ ok: boolean; orderId: string; orderNumber: string }>(`/quotes/${id}/convert-to-order`); return data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); qc.invalidateQueries({ queryKey: ['orders'] }); },
  });
}

export function useConvertQuoteToSale(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { const { data } = await apiClient.post<{ ok: boolean; saleId: string; saleNumber: string }>(`/quotes/${id}/convert-to-sale`); return data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); qc.invalidateQueries({ queryKey: ['sales'] }); },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/quotes/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
}
