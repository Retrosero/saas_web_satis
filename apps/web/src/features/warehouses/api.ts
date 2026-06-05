import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, WarehouseStatus } from '@saas/shared';

export interface Warehouse {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  branch: string | null;
  status: WarehouseStatus;
  manager: string | null;
  managerUserId: string | null;
  authorizedUserIds: string[];
  address: string | null;
  city: string | null;
  phone: string | null;
  isDefault: boolean;
  notes: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
  totalStock?: number;
  lastMovementDate?: string;
}

export interface WarehouseStockItem {
  productId: string;
  productCode: string;
  productName: string;
  unitName: string | null;
  totalStock: number;
  minStock: number | null;
  maxStock: number | null;
  unitPrice: number;
  stockValue: number;
}

export interface WarehouseTransfer {
  id: string;
  transferNumber: string;
  transferDate: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  description: string | null;
  itemCount: number;
  totalQuantity: number;
  createdByName: string | null;
  createdAt: string;
}

export function useWarehouses(params?: { status?: WarehouseStatus; search?: string }) {
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: () =>
      apiClient.get<{ data: PaginatedResponse<Warehouse> }>('/warehouses', { params }).then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function useWarehouse(id: string | undefined) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => apiClient.get<{ data: Warehouse }>(`/warehouses/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useWarehouseStock(warehouseId: string | undefined) {
  return useQuery({
    queryKey: ['warehouses', warehouseId, 'stock'],
    queryFn: () =>
      apiClient.get<{ data: WarehouseStockItem[] }>(`/warehouses/${warehouseId}/stock`).then((r) => r.data.data),
    enabled: !!warehouseId,
  });
}

export function useWarehouseTransfers(params?: { fromWarehouseId?: string; toWarehouseId?: string; status?: string }) {
  return useQuery({
    queryKey: ['warehouses', 'transfers', params],
    queryFn: () =>
      apiClient.get<{ data: PaginatedResponse<WarehouseTransfer> }>('/warehouses/transfers', { params }).then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Warehouse>) =>
      apiClient.post<Warehouse>('/warehouses', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<Warehouse> & { id: string }) =>
      apiClient.put<Warehouse>(`/warehouses/${id}`, input).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      qc.invalidateQueries({ queryKey: ['warehouses', vars.id] });
    },
  });
}

export function useDeactivateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/warehouses/${id}/deactivate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      fromWarehouseId: string;
      toWarehouseId: string;
      transferDate: string;
      description?: string;
      items: Array<{ productId: string; quantity: number; description?: string }>;
    }) => apiClient.post<WarehouseTransfer>('/warehouses/transfers', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses', 'transfers'] }),
  });
}

export function useConfirmTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/warehouses/transfers/${id}/confirm`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}
