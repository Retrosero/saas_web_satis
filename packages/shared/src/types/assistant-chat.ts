import {
  LLMProvider,
  AssistantMessageRole,
  AssistantConversationStatus,
} from '../enums/assistant-chat.enum';

export interface TenantLLMConfig {
  id: string;
  tenantId: string;
  provider: LLMProvider;
  /** Maskeli: sk-...**** */
  apiKeyMasked: string;
  baseUrl?: string;
  defaultModel: string;
  fallbackModel?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  systemPrompt?: string;
  enabledModules: string[];
  rateLimitPerHour: number;
  monthlyBudgetUSD?: number;
  monthlyUsageUSD: number;
  isActive: boolean;
  toolPermissions: string[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantMessage {
  id: string;
  conversationId: string;
  role: AssistantMessageRole;
  content: string;
  toolCalls: AssistantToolCallResult[];
  tokens?: number;
  costUSD?: number;
  model?: string;
  latencyMs?: number;
  feedbackRating?: number;
  feedbackNote?: string;
  metadata: { sources?: string[]; retrievedKB?: number; [k: string]: any };
  createdAt: string;
}

export interface AssistantToolCallResult {
  id?: string;
  toolCode: string;
  toolName: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  latencyMs?: number;
}

export interface AssistantConversation {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  status: AssistantConversationStatus;
  context: Record<string, any>;
  messageCount: number;
  totalTokens: number;
  totalCostUSD: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages?: AssistantMessage[];
  lastMessage?: AssistantMessage;
  llmConfigId?: string;
  model?: string;
}

export interface ChatRequest {
  conversationId?: string; // null = yeni konuşma
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  context?: Record<string, any>;
}

export interface ChatResponse {
  conversationId: string;
  userMessage: AssistantMessage;
  assistantMessage: AssistantMessage;
  toolCalls: AssistantToolCallResult[];
  sources: { id: string; title: string; module: string; snippet: string }[];
  usage: { inputTokens: number; outputTokens: number; totalCostUSD: number; model: string; latencyMs: number };
}

export interface AssistantToolDefinition {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  module: string;
  requiredPermission: string;
  apiEndpoint: string;
  status: 'ACTIVE' | 'PASSIVE';
  createdAt: string;
  updatedAt: string;
}

export interface ToolDefinition {
  /** OpenAI function calling formatında */
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string; enum?: string[] }>;
      required?: string[];
    };
  };
}

export interface AssistantUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCostUSD: number;
  byModel: Array<{ model: string; requests: number; tokens: number; cost: number }>;
  byDay: Array<{ date: string; requests: number; tokens: number; cost: number }>;
  byUser: Array<{ userId: string; userName: string; requests: number; tokens: number; cost: number }>;
  budgetUsage: number; // 0-1
}
