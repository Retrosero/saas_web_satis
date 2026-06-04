import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AssistantTool, HelpArticle, HelpContentType } from '@saas/shared';

export function useHelpArticles(params?: { search?: string; module?: string; contentType?: HelpContentType; status?: 'ACTIVE' | 'PASSIVE' }) {
  return useQuery({
    queryKey: ['assistant', 'articles', params],
    queryFn: async () => {
      const { data } = await apiClient.get<HelpArticle[]>('/assistant/articles', { params });
      return data;
    },
  });
}

export function useHelpArticle(id: string) {
  return useQuery({
    queryKey: ['assistant', 'articles', id],
    queryFn: async () => {
      const { data } = await apiClient.get<HelpArticle>(`/assistant/articles/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<HelpArticle>) => {
      const { data } = await apiClient.post<HelpArticle>('/assistant/articles', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant', 'articles'] }),
  });
}

export function useUpdateArticle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<HelpArticle>) => {
      const { data } = await apiClient.put<HelpArticle>(`/assistant/articles/${id}`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assistant', 'articles'] });
      qc.invalidateQueries({ queryKey: ['assistant', 'articles', id] });
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/assistant/articles/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant', 'articles'] }),
  });
}

export function useAssistantTools() {
  return useQuery({
    queryKey: ['assistant', 'tools'],
    queryFn: async () => {
      const { data } = await apiClient.get<AssistantTool[]>('/assistant/tools');
      return data;
    },
  });
}

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AssistantTool>) => {
      const { data } = await apiClient.post<AssistantTool>('/assistant/tools', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant', 'tools'] }),
  });
}

export function useUpdateTool(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AssistantTool>) => {
      const { data } = await apiClient.put<AssistantTool>(`/assistant/tools/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant', 'tools'] }),
  });
}

export function useDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/assistant/tools/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assistant', 'tools'] }),
  });
}
