import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
export function useTemplates(filters: any = {}) {
  return useQuery({ queryKey: ['industry-templates', filters], queryFn: async () => { const { data } = await apiClient.get('/industry-templates', { params: filters }); return data; } });
}
export function useTemplate(id: string) {
  return useQuery({ queryKey: ['industry-templates', id], queryFn: async () => { const { data } = await apiClient.get(`/industry-templates/${id}`); return data; }, enabled: !!id });
}
export function usePreviewApply(id: string) {
  return useQuery({ queryKey: ['industry-templates', 'preview', id], queryFn: async () => { const { data } = await apiClient.get(`/industry-templates/${id}/preview`); return data; }, enabled: !!id });
}
export function useApplyTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { const { data } = await apiClient.post(`/industry-templates/${id}/apply`); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['industry-templates'] }) });
}
export function useAppliedTemplates() {
  return useQuery({ queryKey: ['industry-templates', 'applied'], queryFn: async () => { const { data } = await apiClient.get('/industry-templates/applied'); return data; } });
}
