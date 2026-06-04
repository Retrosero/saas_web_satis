import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DocumentTemplate, DocumentType, PageFormat } from '@saas/shared';

export function useTemplates(params?: { documentType?: DocumentType; isActive?: boolean }) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: async () => {
      const { data } = await apiClient.get<DocumentTemplate[]>('/templates', { params });
      return data;
    },
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: async () => {
      const { data } = await apiClient.get<DocumentTemplate>(`/templates/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useTemplateVariables() {
  return useQuery({
    queryKey: ['templates', 'variables'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ variables: any[]; categories: string[] }>('/templates/variables');
      return data;
    },
    staleTime: Infinity,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<DocumentTemplate>) => {
      const { data } = await apiClient.post<DocumentTemplate>('/templates', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<DocumentTemplate>) => {
      const { data } = await apiClient.put<DocumentTemplate>(`/templates/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/templates/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useSetTemplateDefault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<DocumentTemplate>(`/templates/${id}/default`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<DocumentTemplate>(`/templates/${id}/duplicate`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}
