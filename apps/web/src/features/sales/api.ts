import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Customer,
  PaginatedResponse,
  PaymentStatus,
  Product,
  Sale,
  SaleItem,
  SaleStatus,
  SaleType,
} from '@saas/shared';

// ---------- Tipler ----------

export type SaleListItem = Sale & { itemCount: number };

export interface SaleDetail extends Sale {
  items: SaleItem[];
}

export interface SaleStatement {
  sale: Sale;
  stockMovements: Array<{
    id: string;
    productId: string;
    warehouseId: string;
    type: string;
    quantity: number;
    unitCost: number | null;
    movementDate: string;
    refNumber: string | null;
    description: string | null;
    reversesId: string | null;
  }>;
  customerMovements: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    movementDate: string;
    refNumber: string | null;
    description: string | null;
    reversesId: string | null;
  }>;
}

export interface CreateSaleItemInput {
  productId: string;
  unitId?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
  description?: string;
}

export interface CreateSaleInput {
  customerId: string;
  saleDate: string;
  dueDate?: string;
  type?: SaleType;
  status?: SaleStatus;
  warehouseId?: string;
  items: CreateSaleItemInput[];
  notes?: string;
  internalNotes?: string;
}

export type UpdateSaleInput = CreateSaleInput;

// ---------- API ----------

function saleToFormData(s: SaleListItem) {
  return s;
}

export function useSalesList(params?: {
  page?: number;
  pageSize?: number;
  customerId?: string;
  status?: SaleStatus;
  paymentStatus?: PaymentStatus;
  type?: SaleType;
  search?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['sales', 'list', params],
    queryFn: () =>
      apiClient.get<{ data: PaginatedResponse<SaleListItem> }>('/sales', { params }).then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => apiClient.get<{ data: SaleDetail }>(`/sales/${id}`).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) =>
      apiClient.post<{ data: Sale }>('/sales', input).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useConfirmSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<{ data: Sale }>(`/sales/${id}/confirm`).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sales', data.id] });
      qc.invalidateQueries({ queryKey: ['sales', 'list'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<{ data: Sale }>(`/sales/${id}/cancel`, { reason }).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sales', data.id] });
      qc.invalidateQueries({ queryKey: ['sales', 'list'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/sales/${id}`).then(() => id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales', 'list'] });
    },
  });
}

// Ürün arama (satış formu için)
export function useProductSearch(keyword: string) {
  const normalizedKeyword = keyword.trim();
  return useQuery({
    queryKey: ['products', 'search', normalizedKeyword],
    queryFn: () =>
      apiClient
        .get<{ data: PaginatedResponse<Product> }>('/products', {
          params: { search: normalizedKeyword || undefined, pageSize: 20, status: 'ACTIVE' },
        })
        .then((r) => r.data.data.data),
    staleTime: 10_000,
  });
}

export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSaleInput }) =>
      apiClient.patch<{ data: Sale }>(`/sales/${id}`, input).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sales', data.id] });
      qc.invalidateQueries({ queryKey: ['sales', 'list'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

// Cari arama (satış formu için)
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
