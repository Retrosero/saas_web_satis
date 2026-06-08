import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Customer, CustomerStatus, CustomerType, PaginatedResponse } from '@saas/shared';

// ---------- Tipler ----------

/** Backend `list` metodunun döndürdüğü her satır (anlık bakiye dahil). */
export type CustomerListItem = Customer & { balance: number; movementCount: number };

export interface CustomerStatement {
  customer: Customer;
  balance: number;
  totalDebit: number;
  totalCredit: number;
  movements: Array<{
    id: string;
    movementDate: string;
    dueDate?: string | null;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    refType: string;
    refId: string | null;
    refNumber: string | null;
    description: string | null;
    reversesId: string | null;
    reversedById?: string | null;
    detailRoute?: string | null;
    editable?: boolean;
    deletable?: boolean;
    printable?: boolean;
  }>;
}

export interface CustomerMovementDetail {
  movement: {
    id: string;
    movementDate: string;
    dueDate: string | null;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    currency: string;
    exchangeRate: number;
    amountTry: number;
    refType: string;
    refId: string | null;
    refNumber: string | null;
    description: string | null;
    status: 'DRAFT' | 'POSTED' | 'PENDING' | 'CANCELLED';
    reversesId: string | null;
    reversedById: string | null;
    paymentMethodId: string | null;
    cashAccountId: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  customer: Customer;
  detailRoute: string | null;
  editable: boolean;
  deletable: boolean;
  printable: boolean;
}

export interface CreateCustomerInput {
  code?: string;
  name: string;
  type?: CustomerType;
  contactName?: string;
  taxNumber?: string;
  taxOffice?: string;
  identityNumber?: string;
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  website?: string;
  iban?: string;
  openingBalance?: number;
  creditLimit?: number;
  paymentTermDays?: number;
  status?: CustomerStatus;
  notes?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

// ---------- API ----------

export const customersApi = {
  list: (params: { page?: number; pageSize?: number; search?: string; type?: CustomerType; status?: CustomerStatus }) =>
    apiClient.get<{ data: PaginatedResponse<CustomerListItem> }>('/customers', { params }).then((r) => r.data.data),

  get: (id: string) =>
    apiClient.get<{ data: CustomerListItem }>(`/customers/${id}`).then((r) => r.data.data),

  statement: (id: string, params: { from?: string; to?: string; refType?: string; page?: number; pageSize?: number } = {}) =>
    apiClient.get<{ data: CustomerStatement }>(`/customers/${id}/statement`, { params }).then((r) => r.data.data),

  create: (data: CreateCustomerInput) =>
    apiClient.post<{ data: Customer }>('/customers', data).then((r) => r.data.data),

  update: (id: string, data: UpdateCustomerInput) =>
    apiClient.patch<{ data: Customer }>(`/customers/${id}`, data).then((r) => r.data.data),

  deactivate: (id: string) =>
    apiClient.patch<{ data: Customer }>(`/customers/${id}/deactivate`).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete<void>(`/customers/${id}`).then((r) => r.data),

  getMovement: (customerId: string, movementId: string) =>
    apiClient
      .get<{ data: CustomerMovementDetail }>(`/customers/${customerId}/movements/${movementId}`)
      .then((r) => r.data.data),

  updateMovement: (
    customerId: string,
    movementId: string,
    data: { movementDate: string; dueDate?: string | null; amount: number; description?: string | null },
  ) =>
    apiClient
      .patch<{ data: CustomerMovementDetail['movement'] }>(`/customers/${customerId}/movements/${movementId}`, data)
      .then((r) => r.data.data),

  reverseMovement: (customerId: string, movementId: string, reason?: string) =>
    apiClient
      .post<{ data: CustomerMovementDetail['movement'] }>(`/customers/${customerId}/movements/${movementId}/reverse`, { reason })
      .then((r) => r.data.data),
};

// ---------- Hook'lar ----------

export function useCustomers(params: { page?: number; pageSize?: number; search?: string; type?: CustomerType; status?: CustomerStatus } = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.list(params),
    staleTime: 10_000,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.get(id!),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useCustomerStatement(id: string | undefined, params: { from?: string; to?: string; refType?: string } = {}) {
  return useQuery({
    queryKey: ['customers', id, 'statement', params],
    queryFn: () => customersApi.statement(id!, params),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerInput }) => customersApi.update(id, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', vars.id] });
    },
  });
}

export function useDeactivateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.deactivate(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useCustomerMovement(customerId: string | undefined, movementId: string | undefined) {
  return useQuery({
    queryKey: ['customers', customerId, 'movements', movementId],
    queryFn: () => customersApi.getMovement(customerId!, movementId!),
    enabled: !!customerId && !!movementId,
    staleTime: 10_000,
  });
}

export function useUpdateCustomerMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      movementId,
      data,
    }: {
      customerId: string;
      movementId: string;
      data: { movementDate: string; dueDate?: string | null; amount: number; description?: string | null };
    }) => customersApi.updateMovement(customerId, movementId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['customers', vars.customerId, 'statement'] });
      qc.invalidateQueries({ queryKey: ['customers', vars.customerId, 'movements', vars.movementId] });
      qc.invalidateQueries({ queryKey: ['customers', vars.customerId] });
    },
  });
}

export function useReverseCustomerMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, movementId, reason }: { customerId: string; movementId: string; reason?: string }) =>
      customersApi.reverseMovement(customerId, movementId, reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['customers', vars.customerId, 'statement'] });
      qc.invalidateQueries({ queryKey: ['customers', vars.customerId, 'movements', vars.movementId] });
      qc.invalidateQueries({ queryKey: ['customers', vars.customerId] });
    },
  });
}
