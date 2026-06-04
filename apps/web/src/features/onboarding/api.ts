import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { OnboardingStep } from '@saas/shared';

export function useOnboardingProgress() {
  return useQuery({ queryKey: ['onboarding', 'progress'], queryFn: async () => { const { data } = await apiClient.get('/onboarding/progress'); return data; } });
}
export function useStartOnboarding() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async () => { const { data } = await apiClient.post('/onboarding/start'); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }) });
}
export function useSaveStepData() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ step, data }: { step: OnboardingStep; data: any }) => { const { data: r } = await apiClient.post(`/onboarding/step/${step}/data`, data); return r; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }) });
}
export function useCompleteStep() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (step: OnboardingStep) => { const { data } = await apiClient.post(`/onboarding/step/${step}/complete`); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }) });
}
export function useSkipStep() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (step: OnboardingStep) => { const { data } = await apiClient.post(`/onboarding/step/${step}/skip`); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }) });
}
