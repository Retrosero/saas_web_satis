import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CashAccount,
  CashAccountType,
  CashMovement,
  CashMovementType,
  PaginatedResponse,
} from '@saas/shared';

export type CashAccountWithBalance = CashAccount & { balance: number; movementCount: number };

export function useCashAccounts(params?: {
  type?: CashAccountType;
  search?: string;
}) {
  return useQuery({
    queryKey: ['cash', 'accounts', params],
    queryFn: () =>
      apiClient
        .get<{ data: PaginatedResponse<CashAccountWithBalance> }>('/cash/accounts', { params })
        .then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function useCashAccount(id: string | undefined) {
  return useQuery({
    queryKey: ['cash', 'accounts', id],
    queryFn: () =>
      apiClient
        .get<{ data: CashAccountWithBalance }>(`/cash/accounts/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCashMovements(params?: {
  cashAccountId?: string;
  type?: CashMovementType;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['cash', 'movements', params],
    queryFn: () =>
      apiClient
        .get<{ data: PaginatedResponse<CashMovement> }>('/cash/movements', { params })
        .then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function useCreateCashAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      code: string;
      name: string;
      type: CashAccountType;
      currency?: string;
      iban?: string;
      bankName?: string;
      bankBranch?: string;
      accountHolder?: string;
      isDefault?: boolean;
      notes?: string;
    }) =>
      apiClient
        .post<{ data: CashAccount }>('/cash/accounts', input)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash'] });
    },
  });
}

export function useCreateCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      cashAccountId: string;
      type: CashMovementType;
      amount: number;
      currency?: string;
      movementDate?: string;
      description?: string;
      transferToAccountId?: string;
      customerId?: string;
    }) =>
      apiClient
        .post<{ data: CashMovement }>('/cash/movements', input)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash'] });
    },
  });
}

export function useReverseCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .post<{ data: CashMovement }>(`/cash/movements/${id}/reverse`)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash'] });
    },
  });
}
