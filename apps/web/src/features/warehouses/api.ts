import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, Warehouse, WarehouseStatus } from '@saas/shared';

export type WarehouseListItem = Warehouse & { productCount: number; stockMovementCount: number };

export const warehousesApi = {
  list: (params: { page?: number; pageSize?: number; search?: string; status?: WarehouseStatus } = {}) =>
    apiClient.get<PaginatedResponse<WarehouseListItem>>('/warehouses', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<WarehouseListItem>(`/warehouses/${id}`).then((r) => r.data),
  create: (data: Partial<Warehouse>) => apiClient.post<Warehouse>('/warehouses', data).then((r) => r.data),
  update: (id: string, data: Partial<Warehouse>) => apiClient.patch<Warehouse>(`/warehouses/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete<void>(`/warehouses/${id}`).then((r) => r.data),
};

export function useWarehouses(params: { page?: number; pageSize?: number; search?: string; status?: WarehouseStatus } = {}) {
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: () => warehousesApi.list(params),
    staleTime: 30_000,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: warehousesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Warehouse> }) => warehousesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}
