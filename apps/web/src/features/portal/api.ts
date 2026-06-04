import { useMutation, useQuery } from '@tanstack/react-query';
import { portalApi, portalAuth } from '@/lib/portal-client';
import type { PaginatedResponse } from '@saas/shared';

export interface PortalCustomer {
  id: string;
  name: string;
  code: string;
}

export interface PortalProfile {
  id: string;
  code: string;
  name: string;
  taxNumber: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  type: string;
  status: string;
  creditLimit: number;
}

export interface PortalBalance {
  balance: number;
  totalDebit: number;
  totalCredit: number;
}

export interface PortalStatementItem {
  id: string;
  movementDate: string;
  type: string;
  amount: number;
  currency: string;
  amountTry: number;
  description: string | null;
  refType: string | null;
  refNumber: string | null;
}

export interface PortalProduct {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  description: string | null;
  primaryBarcode: string | null;
  defaultSalePrice: number;
  defaultVatRate: number;
  totalStock: number;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
}

export interface PortalOrderListItem {
  id: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate: string | null;
  status: string;
  type: string;
  grandTotal: number;
  warehouse: string | null;
  itemCount: number;
}

export interface PortalOrderDetail extends PortalOrderListItem {
  subTotal: number;
  vatTotal: number;
  notes: string | null;
  items: Array<{
    productCode: string;
    productName: string;
    barcode: string | null;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    lineGrandTotal: number;
    description: string | null;
  }>;
}

// ==================== AUTH ====================
export function usePortalLogin() {
  return useMutation({
    mutationFn: async (input: { tenantCode: string; customerCode: string; password: string }) => {
      const { data } = await portalApi.post<{ token: string; customer: PortalCustomer }>('/portal/auth/login', input);
      portalAuth.setSession(data.token, data.customer);
      return data;
    },
  });
}

export function usePortalLogout() {
  return () => {
    portalAuth.clear();
    location.href = '/portal/login';
  };
}

// ==================== PROFILE / BALANCE / STATEMENT ====================
export function usePortalProfile() {
  return useQuery({
    queryKey: ['portal', 'me'],
    queryFn: async () => {
      const { data } = await portalApi.get<PortalProfile>('/portal/me');
      return data;
    },
  });
}

export function usePortalBalance() {
  return useQuery({
    queryKey: ['portal', 'balance'],
    queryFn: async () => {
      const { data } = await portalApi.get<PortalBalance>('/portal/balance');
      return data;
    },
  });
}

export function usePortalStatement(params?: { from?: string; to?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['portal', 'statement', params],
    queryFn: async () => {
      const { data } = await portalApi.get<PaginatedResponse<PortalStatementItem>>('/portal/statement', { params });
      return data;
    },
  });
}

// ==================== CATALOG ====================
export function usePortalCatalog(params?: { search?: string; categoryId?: string; brandId?: string; minPrice?: number; maxPrice?: number; inStockOnly?: boolean; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['portal', 'catalog', params],
    queryFn: async () => {
      const { data } = await portalApi.get<PaginatedResponse<PortalProduct>>('/portal/catalog', { params });
      return data;
    },
  });
}

export function usePortalProduct(id: string) {
  return useQuery({
    queryKey: ['portal', 'products', id],
    queryFn: async () => {
      const { data } = await portalApi.get<PortalProduct>(`/portal/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ==================== ORDERS ====================
export function usePortalOrders(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['portal', 'orders', params],
    queryFn: async () => {
      const { data } = await portalApi.get<PaginatedResponse<PortalOrderListItem>>('/portal/orders', { params });
      return data;
    },
  });
}

export function usePortalOrder(id: string) {
  return useQuery({
    queryKey: ['portal', 'orders', id],
    queryFn: async () => {
      const { data } = await portalApi.get<PortalOrderDetail>(`/portal/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
