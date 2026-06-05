import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PivotConfig, PresetReport, ReportResult, ReportTemplate } from '@saas/shared';

export function useReportPresets() {
  return useQuery({
    queryKey: ['reports', 'presets'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PresetReport[] }>('/reports/presets');
      return data.data;
    },
    staleTime: Infinity,
  });
}

export function useRunPreset() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.get<{ data: ReportResult }>(`/reports/presets/${code}`);
      return data.data;
    },
  });
}

export function useExecuteReport() {
  return useMutation({
    mutationFn: async (config: PivotConfig) => {
      const { data } = await apiClient.post<{ data: ReportResult }>('/reports/execute', config);
      return data.data;
    },
  });
}

export function useReportTemplates(params?: { isFavorite?: boolean; sharedWithMe?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'templates', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ReportTemplate[] }>('/reports/templates', { params });
      return data.data;
    },
  });
}

export function useReportTemplate(id: string) {
  return useQuery({
    queryKey: ['reports', 'templates', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ReportTemplate }>(`/reports/templates/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ReportTemplate>) => {
      const { data } = await apiClient.post<ReportTemplate>('/reports/templates', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'templates'] }),
  });
}

export function useUpdateReportTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ReportTemplate>) => {
      const { data } = await apiClient.put<ReportTemplate>(`/reports/templates/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'templates'] }),
  });
}

export function useDeleteReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/reports/templates/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'templates'] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ReportTemplate>(`/reports/templates/${id}/favorite`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'templates'] }),
  });
}

export function useSchedules() {
  return useQuery({
    queryKey: ['reports', 'schedules'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: any[] }>('/reports/schedules');
      return data.data;
    },
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.post('/reports/schedules', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'schedules'] }),
  });
}

export function useToggleSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/reports/schedules/${id}/toggle`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'schedules'] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/reports/schedules/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'schedules'] }),
  });
}
