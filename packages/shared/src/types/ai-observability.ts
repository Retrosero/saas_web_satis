import { AIFeedbackType, AIAuditAction, AITrainingFormat } from '../enums/ai-observability.enum';

export interface AIAuditLog {
  id: string;
  tenantId?: string;
  userId?: string;
  conversationId?: string;
  messageId?: string;
  action: AIAuditAction;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  createdAt: string;
  tenantName?: string;
  userName?: string;
}

export interface AITrainingEntry {
  id: string;
  tenantId: string;
  conversationId: string;
  messageId: string;
  userId?: string;
  userQuery: string;
  assistantAnswer: string;
  model: string;
  toolCalls: any[];
  sources: any[];
  feedback?: AIFeedbackType;
  feedbackNote?: string;
  correctedAnswer?: string;
  rating?: number;
  tokens?: number;
  costUSD?: number;
  latencyMs?: number;
  metadata: Record<string, any>;
  isExported: boolean;
  exportedAt?: string;
  createdAt: string;
  updatedAt: string;
  tenantName?: string;
  userName?: string;
}

export interface AITrainingDataset {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  format: AITrainingFormat;
  entryCount: number;
  includeOnlyPositive: boolean;
  includeCorrected: boolean;
  filterModel?: string;
  filterFrom?: string;
  filterTo?: string;
  generatedAt?: string;
  fileUrl?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIGlobalStats {
  totalConversations: number;
  totalMessages: number;
  totalToolCalls: number;
  totalCostUSD: number;
  totalTokens: number;
  byTenant: Array<{ tenantId: string; tenantName: string; conversations: number; cost: number }>;
  byModel: Array<{ model: string; requests: number; cost: number }>;
  byDay: Array<{ date: string; requests: number; cost: number }>;
  feedbackStats: { positive: number; negative: number; neutral: number; corrected: number };
  topUsers: Array<{ userId: string; userName: string; tenantId: string; messages: number; cost: number }>;
}

export interface AIExportResult {
  datasetId: string;
  entryCount: number;
  format: AITrainingFormat;
  contentBase64: string;
  filename: string;
}
