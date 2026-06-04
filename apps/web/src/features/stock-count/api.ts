import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@saas/shared';

export interface StockCount {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  name: string;
  description: string | null;
  countType: 'FULL' | 'PARTIAL' | 'CYCLE' | 'SPOT' | 'CATEGORY';
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_APPROVAL' | 'APPROVED' | 'CANCELLED';
  totalProducts: number;
  countedProducts: number;
  differenceCount: number;
  totalDifference: number;
  startedAt: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  startedByName: string | null;
  startedById: string | null;
  createdAt: string;
}

export interface StockCountItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unitName: string | null;
  barcode: string | null;
  systemQuantity: number;
  countedQuantity: number | null;
  difference: number | null;
  status: 'PENDING' | 'COUNTED' | 'SKIPPED' | 'RECOUNT_NEEDED';
  notes: string | null;
  countedAt: string | null;
  countedByName: string | null;
}

export function useStockCounts(params?: { status?: string; warehouseId?: string; search?: string }) {
  return useQuery({
    queryKey: ['stock-counts', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<StockCount>>('/stock-counts', { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useStockCount(id: string | undefined) {
  return useQuery({
    queryKey: ['stock-counts', id],
    queryFn: () => apiClient.get<StockCount & { items: StockCountItem[] }>(`/stock-counts/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      warehouseId: string;
      name: string;
      description?: string;
      countType: 'FULL' | 'PARTIAL' | 'CYCLE' | 'SPOT' | 'CATEGORY';
      productIds?: string[];
    }) => apiClient.post<StockCount>('/stock-counts', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-counts'] }),
  });
}

export function useStartStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/stock-counts/${id}/start`).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['stock-counts'] });
      qc.invalidateQueries({ queryKey: ['stock-counts', id] });
    },
  });
}

export function useRecordCount(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; countedQuantity: number; barcode?: string }) =>
      apiClient.post(`/stock-counts/${id}/record`, input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-counts', id] });
    },
  });
}

export function useCompleteStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/stock-counts/${id}/complete`).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['stock-counts'] });
      qc.invalidateQueries({ queryKey: ['stock-counts', id] });
    },
  });
}

export function useSubmitForApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/stock-counts/${id}/submit`).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['stock-counts'] });
      qc.invalidateQueries({ queryKey: ['stock-counts', id] });
    },
  });
}

export function useApproveStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/stock-counts/${id}/approve`).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['stock-counts'] });
      qc.invalidateQueries({ queryKey: ['stock-counts', id] });
    },
  });
}

export function useCancelStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/stock-counts/${id}/cancel`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-counts'] }),
  });
}