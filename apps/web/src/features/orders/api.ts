import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaginatedResponse,
  Product,
} from '@saas/shared';

export type OrderListItem = Order & { itemCount: number };

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export interface CreateOrderItemInput {
  productId: string;
  unitId?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
  description?: string;
}

export interface CreateOrderInput {
  customerId: string;
  orderDate: string;
  deliveryDate?: string;
  type?: OrderType;
  status?: OrderStatus;
  warehouseId?: string;
  items: CreateOrderItemInput[];
  notes?: string;
  internalNotes?: string;
}

export function useOrdersList(params?: {
  page?: number;
  pageSize?: number;
  customerId?: string;
  status?: OrderStatus;
  type?: OrderType;
  search?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['orders', 'list', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<OrderListItem>>('/orders', { params }).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => apiClient.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      apiClient.post<Order>('/orders', input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useConfirmOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Order>(`/orders/${id}/confirm`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['orders', data.id] });
      qc.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<Order>(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['orders', data.id] });
      qc.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/orders/${id}`).then(() => id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}

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
