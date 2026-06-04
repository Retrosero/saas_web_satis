import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { VisitPlanStatus, VisitStatus } from '@saas/shared';
export function useVisitPlans(filters: any = {}) {
  return useQuery({ queryKey: ['visits', 'plans', filters], queryFn: async () => { const { data } = await apiClient.get('/visits/plans', { params: filters }); return data; } });
}
export function useVisitPlan(id: string) {
  return useQuery({ queryKey: ['visits', 'plans', id], queryFn: async () => { const { data } = await apiClient.get(`/visits/plans/${id}`); return data; }, enabled: !!id });
}
export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (input: any) => { const { data } = await apiClient.post('/visits/plans', input); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['visits', 'plans'] }) });
}
export function useUpdatePlanStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, status }: { id: string; status: VisitPlanStatus }) => { const { data } = await apiClient.put(`/visits/plans/${id}/status`, { status }); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['visits', 'plans'] }) });
}
export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { await apiClient.delete(`/visits/plans/${id}`); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['visits', 'plans'] }) });
}
export function useCheckin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ planId, ...body }: { planId: string; customerId: string; type: 'CHECK_IN' | 'CHECK_OUT'; latitude: number; longitude: number; address?: string; notes?: string }) => { const { data } = await apiClient.post(`/visits/plans/${planId}/checkin`, body); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }) });
}
export function useUpdateCustomerStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ planId, customerId, ...body }: { planId: string; customerId: string; status: VisitStatus; reason?: string }) => { const { data } = await apiClient.post(`/visits/plans/${planId}/customers/${customerId}/status`, body); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }) });
}
export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ planId, ...body }: any) => { const { data } = await apiClient.post(`/visits/plans/${planId}/notes`, body); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }) });
}
export function useSalespersonReport(id: string, from?: string, to?: string) {
  return useQuery({ queryKey: ['visits', 'report', id, from, to], queryFn: async () => { const { data } = await apiClient.get(`/visits/report/salesperson/${id}`, { params: { from, to } }); return data; }, enabled: !!id });
}
