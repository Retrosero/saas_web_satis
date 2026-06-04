import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  PaginatedResponse,
  Return,
  ReturnItem,
  ReturnReason,
  ReturnSource,
  ReturnStatus,
  ReturnItemCondition,
} from '@saas/shared';

export interface ReturnListItem extends Return {
  itemCount: number;
  customerCode: string | null;
}

export interface ReturnDetail extends Return {
  items: ReturnItem[];
  customer?: { id: string; code: string; name: string };
  stockMovements?: Array<{ id: string; productId: string; type: string; quantity: number; movementDate: string }>;
  customerMovements?: Array<{ id: string; type: string; amount: number; description: string; movementDate: string }>;
}

export interface CreateReturnItemInput {
  productId: string;
  unitId?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
  condition: ReturnItemCondition;
  description?: string;
}

export interface CreateReturnInput {
  customerId: string;
  returnDate: string;
  source: ReturnSource;
  sourceId?: string;
  reason: ReturnReason;
  returnToStock: boolean;
  notes?: string;
  internalNotes?: string;
  items: CreateReturnItemInput[];
}

export function useReturnsList(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  customerId?: string;
  status?: ReturnStatus;
  reason?: ReturnReason;
  source?: ReturnSource;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['returns', 'list', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<ReturnListItem>>('/returns', { params });
      return data;
    },
  });
}

export function useReturn(id: string) {
  return useQuery({
    queryKey: ['returns', 'detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ReturnDetail>(`/returns/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReturnInput) => {
      const { data } = await apiClient.post<ReturnDetail>('/returns', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  });
}

export function useUpdateReturn(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateReturnInput>) => {
      const { data } = await apiClient.put<ReturnDetail>(`/returns/${id}`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['returns', 'detail', id] });
    },
  });
}

export function useReturnAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { action: 'submit' | 'approve' | 'reject' | 'complete' | 'cancel'; rejectionReason?: string }) => {
      const { data } = await apiClient.post<Return>(`/returns/${id}/action`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['returns', 'detail', id] });
    },
  });
}

export function useDeleteReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/returns/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  });
}
