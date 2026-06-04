import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { TargetType, TargetStatus, CommissionType } from '@saas/shared';
export function useTargets(filters: any = {}) {
  return useQuery({ queryKey: ['performance', 'targets', filters], queryFn: async () => { const { data } = await apiClient.get('/performance/targets', { params: filters }); return data; } });
}
export function useTarget(id: string) {
  return useQuery({ queryKey: ['performance', 'targets', id], queryFn: async () => { const { data } = await apiClient.get(`/performance/targets/${id}`); return data; }, enabled: !!id });
}
export function useCreateTarget() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (input: any) => { const { data } = await apiClient.post('/performance/targets', input); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['performance', 'targets'] }) });
}
export function useUpdateTarget(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (input: any) => { const { data } = await apiClient.put(`/performance/targets/${id}`, input); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['performance', 'targets'] }) });
}
export function useDeleteTarget() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { await apiClient.delete(`/performance/targets/${id}`); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['performance', 'targets'] }) });
}
export function useSnapshotAll() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async () => { const { data } = await apiClient.post('/performance/targets/snapshot-all'); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['performance'] }) });
}
export function usePerformanceDashboard(from?: string, to?: string) {
  return useQuery({ queryKey: ['performance', 'dashboard', from, to], queryFn: async () => { const { data } = await apiClient.get('/performance/dashboard', { params: { from, to } }); return data; } });
}
export function useUserPerformance(userId: string, days = 30) {
  return useQuery({ queryKey: ['performance', 'user', userId, days], queryFn: async () => { const { data } = await apiClient.get(`/performance/user/${userId}`, { params: { days } }); return data; }, enabled: !!userId });
}
export function useCommissionRules() {
  return useQuery({ queryKey: ['performance', 'commission', 'rules'], queryFn: async () => { const { data } = await apiClient.get('/performance/commission/rules'); return data; } });
}
export function useCreateCommissionRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (input: any) => { const { data } = await apiClient.post('/performance/commission/rules', input); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['performance', 'commission'] }) });
}
export function useDeleteCommissionRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { await apiClient.delete(`/performance/commission/rules/${id}`); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['performance', 'commission'] }) });
}
export function useCalculateCommission() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (input: any) => { const { data } = await apiClient.post('/performance/commission/calculate', input); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['performance', 'commission'] }) });
}
export function useCommissionLogs(filters: any = {}) {
  return useQuery({ queryKey: ['performance', 'commission', 'logs', filters], queryFn: async () => { const { data } = await apiClient.get('/performance/commission/logs', { params: filters }); return data; } });
}
