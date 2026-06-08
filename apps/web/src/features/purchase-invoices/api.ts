import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  PaginatedResponse,
  PaymentStatus,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseInvoiceStatus,
  PurchaseInvoiceType,
} from '@saas/shared';

// ---------- Tipler ----------

export type PurchaseInvoiceListItem = PurchaseInvoice & { itemCount: number };

export interface PurchaseInvoiceDetail extends PurchaseInvoice {
  items: PurchaseInvoiceItem[];
}

export interface CreatePurchaseInvoiceItemInput {
  productId: string;
  unitId?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
  description?: string;
}

export interface CreatePurchaseInvoiceInput {
  supplierId: string;
  invoiceDate: string;
  dueDate?: string;
  type?: PurchaseInvoiceType;
  status?: PurchaseInvoiceStatus;
  warehouseId: string;
  einvoiceNumber?: string;
  items: CreatePurchaseInvoiceItemInput[];
  notes?: string;
  internalNotes?: string;
}

// ---------- API ----------

export function usePurchaseInvoicesList(params?: {
  page?: number;
  pageSize?: number;
  supplierId?: string;
  status?: PurchaseInvoiceStatus;
  paymentStatus?: PaymentStatus;
  type?: PurchaseInvoiceType;
  search?: string;
  from?: string;
  to?: string;
  warehouseId?: string;
}) {
  return useQuery({
    queryKey: ['purchase-invoices', 'list', params],
    queryFn: () =>
      apiClient.get<{ data: PaginatedResponse<PurchaseInvoiceListItem> }>('/purchase-invoices', { params }).then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function usePurchaseInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['purchase-invoices', id],
    queryFn: () =>
      apiClient.get<{ data: PurchaseInvoiceDetail }>(`/purchase-invoices/${id}`).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreatePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePurchaseInvoiceInput) =>
      apiClient.post<{ data: PurchaseInvoice }>('/purchase-invoices', input).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-invoices'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useConfirmPurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ data: PurchaseInvoice }>(`/purchase-invoices/${id}/confirm`).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['purchase-invoices', data.id] });
      qc.invalidateQueries({ queryKey: ['purchase-invoices', 'list'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useCancelPurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<{ data: PurchaseInvoice }>(`/purchase-invoices/${id}/cancel`, { reason }).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['purchase-invoices', data.id] });
      qc.invalidateQueries({ queryKey: ['purchase-invoices', 'list'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useDeletePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/purchase-invoices/${id}`).then(() => id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-invoices', 'list'] });
    },
  });
}

// Tedarikçi arama (alış faturası formu için - sadece tedarikçi veya her ikisi tipinde)
export function useSupplierSearch(keyword: string) {
  const normalizedKeyword = keyword.trim();
  return useQuery({
    queryKey: ['purchase-invoices', 'suppliers', normalizedKeyword],
    queryFn: () =>
      apiClient
        .get<{ data: Array<{ id: string; code: string; name: string; taxNumber: string | null }> }>('/purchase-invoices/suppliers/search', {
          params: { search: normalizedKeyword },
        })
        .then((r) => r.data.data),
    enabled: normalizedKeyword.length > 0,
    staleTime: 10_000,
  });
}

// Ürün arama (alış faturası formu için)
export function useProductSearch(keyword: string) {
  const normalizedKeyword = keyword.trim();
  return useQuery({
    queryKey: ['purchase-invoices', 'products', normalizedKeyword],
    queryFn: () =>
      apiClient
        .get<{ data: Array<{ id: string; code: string; name: string }> }>('/purchase-invoices/products/search', {
          params: { search: normalizedKeyword },
        })
        .then((r) => r.data.data),
    enabled: normalizedKeyword.length > 0,
    staleTime: 10_000,
  });
}
