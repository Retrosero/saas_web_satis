import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  BankAccount,
  BankTransaction,
  PaginatedResponse,
  PosCollection,
  PosDevice,
  BankAccountStatus,
  BankAccountType,
  BankTransactionType,
  PosCollectionStatus,
} from '@saas/shared';

export interface BankAccountWithBalance extends BankAccount {
  balance: number;
  transactionCount: number;
}

export interface BankTransactionWithAccount extends BankTransaction {
  bankAccountName?: string;
}

export function useBankAccounts(params?: { search?: string; status?: BankAccountStatus; type?: BankAccountType }) {
  return useQuery({
    queryKey: ['banks', 'accounts', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: BankAccountWithBalance[] }>('/banks/accounts', { params });
      return data.data;
    },
  });
}

export function useBankAccount(id: string) {
  return useQuery({
    queryKey: ['banks', 'accounts', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: BankAccountWithBalance }>(`/banks/accounts/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BankAccount>) => {
      const { data } = await apiClient.post<BankAccount>('/banks/accounts', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banks', 'accounts'] }),
  });
}

export function useUpdateBankAccount(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BankAccount>) => {
      const { data } = await apiClient.put<BankAccount>(`/banks/accounts/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banks', 'accounts'] }),
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/banks/accounts/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banks', 'accounts'] }),
  });
}

export function useBankTransactions(params?: { page?: number; pageSize?: number; bankAccountId?: string; type?: BankTransactionType; customerId?: string; from?: string; to?: string; search?: string }) {
  return useQuery({
    queryKey: ['banks', 'transactions', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PaginatedResponse<BankTransactionWithAccount> }>('/banks/transactions', { params });
      return data.data;
    },
  });
}

export function useCreateBankTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BankTransaction>) => {
      const { data } = await apiClient.post<BankTransaction>('/banks/transactions', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banks', 'transactions'] });
      qc.invalidateQueries({ queryKey: ['banks', 'accounts'] });
    },
  });
}

export function useReconcileTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<BankTransaction>(`/banks/transactions/${id}/reconcile`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banks', 'transactions'] }),
  });
}

export function usePosDevices() {
  return useQuery({
    queryKey: ['banks', 'pos-devices'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PosDevice[] }>('/banks/pos-devices');
      return data.data;
    },
  });
}

export function useCreatePosDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PosDevice>) => {
      const { data } = await apiClient.post<PosDevice>('/banks/pos-devices', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banks', 'pos-devices'] }),
  });
}

export function useUpdatePosDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<PosDevice> & { id: string }) => {
      const { data } = await apiClient.put<{ data: PosDevice }>(`/banks/pos-devices/${id}`, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banks', 'pos-devices'] }),
  });
}

export function usePosCollections(params?: { page?: number; pageSize?: number; posDeviceId?: string; status?: PosCollectionStatus; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['banks', 'pos-collections', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PaginatedResponse<PosCollection & { posDeviceName?: string; posCode?: string }> }>('/banks/pos-collections', { params });
      return data.data;
    },
  });
}

export function useCreatePosCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PosCollection>) => {
      const { data } = await apiClient.post<PosCollection>('/banks/pos-collections', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banks', 'pos-collections'] }),
  });
}

export function useSettlePosCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<PosCollection>(`/banks/pos-collections/${id}/settle`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banks', 'pos-collections'] });
      qc.invalidateQueries({ queryKey: ['banks', 'accounts'] });
    },
  });
}

export function usePosCommissionReport(params?: { from?: string; to?: string; posDeviceId?: string }) {
  return useQuery({
    queryKey: ['banks', 'reports', 'pos-commission', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { totalGross: number; totalCommission: number; totalNet: number; byDevice: any[] } }>('/banks/reports/pos-commission', { params });
      return data.data;
    },
  });
}
