import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, Product, ProductStatus, ProductType } from '@saas/shared';

export type ProductListItem = Product & {
  totalStock: number;
  brandName: string | null;
  categoryName: string | null;
  unitName: string;
};

export interface ProductDetail extends Product {
  totalStock: number;
  stockByWarehouse: Array<{ warehouseId: string; warehouseName: string; quantity: number }>;
  brandName: string | null;
  categoryName: string | null;
  unitName: string;
}

export interface CreateProductInput {
  code?: string;
  name: string;
  shortName?: string;
  description?: string;
  type?: ProductType;
  status?: ProductStatus;
  brandId?: string;
  categoryId?: string;
  defaultWarehouseId?: string;
  unitId?: string;
  primaryBarcode?: string;
  trackStock?: boolean;
  vatRate?: number;
  minStock?: number;
  maxStock?: number;
  weight?: number;
  volume?: number;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export const productsApi = {
  list: (params: { page?: number; pageSize?: number; search?: string; type?: ProductType; status?: ProductStatus; brandId?: string; categoryId?: string }) =>
    apiClient.get<{ data: PaginatedResponse<ProductListItem> }>('/products', { params }).then((r) => r.data.data),

  get: (id: string) =>
    apiClient.get<{ data: ProductDetail }>(`/products/${id}`).then((r) => r.data.data),

  create: (data: CreateProductInput) =>
    apiClient.post<{ data: Product }>('/products', data).then((r) => r.data.data),

  update: (id: string, data: UpdateProductInput) =>
    apiClient.patch<{ data: Product }>(`/products/${id}`, data).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete<void>(`/products/${id}`).then((r) => r.data),
};

export function useProducts(params: { page?: number; pageSize?: number; search?: string; type?: ProductType; status?: ProductStatus; brandId?: string; categoryId?: string } = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
    staleTime: 10_000,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id!),
    enabled: !!id,
    staleTime: 5_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) => productsApi.update(id, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products', vars.id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
