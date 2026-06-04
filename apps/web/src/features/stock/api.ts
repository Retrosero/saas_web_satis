import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, StockMovement, StockMovementRefType, StockMovementType } from '@saas/shared';

export type StockMovementListItem = StockMovement & {
  productCode: string;
  productName: string;
  warehouseName: string;
};

export const stockApi = {
  list: (params: {
    page?: number;
    pageSize?: number;
    productId?: string;
    warehouseId?: string;
    type?: StockMovementType;
    refType?: StockMovementRefType;
    from?: string;
    to?: string;
  } = {}) =>
    apiClient.get<PaginatedResponse<StockMovementListItem>>('/stock/movements', { params }).then((r) => r.data),

  getQuantity: (productId: string, warehouseId: string) =>
    apiClient.get<{ productId: string; warehouseId: string; quantity: number }>('/stock/quantity', {
      params: { productId, warehouseId },
    }).then((r) => r.data),

  create: (data: {
    productId: string;
    warehouseId: string;
    type: StockMovementType;
    quantity: number;
    movementDate: string;
    refType: StockMovementRefType;
    unitCost?: number;
    refNumber?: string;
    description?: string;
  }) => apiClient.post<StockMovement>('/stock/movement', data).then((r) => r.data),

  transfer: (data: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    movementDate: string;
    refNumber?: string;
    description?: string;
  }) => apiClient.post<{ out: StockMovement; in: StockMovement }>('/stock/transfer', data).then((r) => r.data),

  adjust: (data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    movementDate: string;
    refNumber?: string;
    description?: string;
  }) => apiClient.post<StockMovement>('/stock/adjust', data).then((r) => r.data),

  reverse: (id: string) =>
    apiClient.post<StockMovement>(`/stock/movement/${id}/reverse`).then((r) => r.data),
};

export function useStockMovements(params: Parameters<typeof stockApi.list>[0] = {}) {
  return useQuery({
    queryKey: ['stock', 'movements', params],
    queryFn: () => stockApi.list(params),
    staleTime: 5_000,
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock', 'movements'] }),
  });
}

export function useStockTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.transfer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock', 'movements'] }),
  });
}

export function useStockAdjust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.adjust,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock', 'movements'] }),
  });
}

export function useReverseStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stockApi.reverse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock', 'movements'] }),
  });
}
