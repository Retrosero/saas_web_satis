import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AgentStep {
  id: string;
  order: number;
  description: string;
  toolCode?: string;
  toolArguments?: Record<string, any>;
  dependsOn: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  result?: any;
  error?: string;
  durationMs?: number;
  retryCount: number;
  maxRetries: number;
}

export interface AgentRunResult {
  runId: string;
  plan: { goal: string; steps: AgentStep[]; reasoning?: string };
  finalAnswer: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  totalDurationMs: number;
  totalCostUSD: number;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PLANNING' | 'EXECUTING' | 'REFLECTING';
}

export function useRunAgent() {
  return useMutation({
    mutationFn: async (input: { goal: string; context?: any; maxSteps?: number; model?: string; toolPermissions?: string[] }) => {
      const { data } = await apiClient.post<AgentRunResult>('/assistant-agent/run', input);
      return data;
    },
  });
}
