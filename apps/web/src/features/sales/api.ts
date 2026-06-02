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
      apiClient.get<PaginatedResponse<SaleListItem>>('/sales', { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => apiClient.get<SaleDetail>(`/sales/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) =>
      apiClient.post<Sale>('/sales', input).then((r) => r.data),
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
    mutationFn: (id: string) => apiClient.post<Sale>(`/sales/${id}/confirm`).then((r) => r.data),
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
      apiClient.post<Sale>(`/sales/${id}/cancel`, { reason }).then((r) => r.data),
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
  return useQuery({
    queryKey: ['products', 'search', keyword],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Product>>('/products', {
          params: { search: keyword, pageSize: 20, status: 'ACTIVE' },
        })
        .then((r) => r.data.data),
    enabled: keyword.length >= 2,
    staleTime: 10_000,
  });
}

// Cari arama (satış formu için)
export function useCustomerSearch(keyword: string) {
  return useQuery({
    queryKey: ['customers', 'search', keyword],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Customer>>('/customers', {
          params: { search: keyword, pageSize: 20, status: 'ACTIVE' },
        })
        .then((r) => r.data.data),
    enabled: keyword.length >= 2,
    staleTime: 10_000,
  });
}
