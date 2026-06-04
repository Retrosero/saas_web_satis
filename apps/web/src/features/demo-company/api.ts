import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DemoDataSize } from '@saas/shared';
export function useDemoTemplates() {
  return useQuery({ queryKey: ['demo-company', 'templates'], queryFn: async () => { const { data } = await apiClient.get('/demo-company/templates'); return data; } });
}
export function useDemoCompany() {
  return useQuery({ queryKey: ['demo-company'], queryFn: async () => { const { data } = await apiClient.get('/demo-company'); return data; } });
}
export function useCreateDemo() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (input: { size: DemoDataSize; templateCode: string }) => { const { data } = await apiClient.post('/demo-company/create', input); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['demo-company'] }) });
}
export function useResetDemo() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async () => { const { data } = await apiClient.post('/demo-company/reset'); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['demo-company'] }) });
}
export function useConvertDemo() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async () => { const { data } = await apiClient.post('/demo-company/convert'); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['demo-company'] }) });
}
