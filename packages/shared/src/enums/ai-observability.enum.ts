export enum AIFeedbackType {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
  CORRECTED = 'CORRECTED',
}

export const AIFeedbackTypeLabel: Record<AIFeedbackType, string> = {
  [AIFeedbackType.POSITIVE]: 'Olumlu',
  [AIFeedbackType.NEGATIVE]: 'Olumsuz',
  [AIFeedbackType.NEUTRAL]: 'Nötr',
  [AIFeedbackType.CORRECTED]: 'Düzeltildi',
};

export const AIFeedbackTypeColor: Record<AIFeedbackType, string> = {
  [AIFeedbackType.POSITIVE]: 'green',
  [AIFeedbackType.NEGATIVE]: 'red',
  [AIFeedbackType.NEUTRAL]: 'gray',
  [AIFeedbackType.CORRECTED]: 'amber',
};

export enum AIAuditAction {
  CONVERSATION_STARTED = 'CONVERSATION_STARTED',
  CONVERSATION_DELETED = 'CONVERSATION_DELETED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_RATED = 'MESSAGE_RATED',
  TOOL_CALLED = 'TOOL_CALLED',
  TOOL_FAILED = 'TOOL_FAILED',
  RAG_RETRIEVED = 'RAG_RETRIEVED',
  LLM_API_ERROR = 'LLM_API_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  CONFIG_UPDATED = 'CONFIG_UPDATED',
}

export const AIAuditActionLabel: Record<AIAuditAction, string> = {
  [AIAuditAction.CONVERSATION_STARTED]: 'Konuşma Başladı',
  [AIAuditAction.CONVERSATION_DELETED]: 'Konuşma Silindi',
  [AIAuditAction.MESSAGE_SENT]: 'Mesaj Gönderildi',
  [AIAuditAction.MESSAGE_RATED]: 'Mesaj Puanlandı',
  [AIAuditAction.TOOL_CALLED]: 'Araç Çağrıldı',
  [AIAuditAction.TOOL_FAILED]: 'Araç Hatası',
  [AIAuditAction.RAG_RETRIEVED]: 'KB Erişildi',
  [AIAuditAction.LLM_API_ERROR]: 'LLM Hatası',
  [AIAuditAction.RATE_LIMITED]: 'Rate Limit',
  [AIAuditAction.BUDGET_EXCEEDED]: 'Bütçe Aşıldı',
  [AIAuditAction.CONFIG_UPDATED]: 'Yapılandırma Değişti',
};

export const AIAuditActionColor: Record<AIAuditAction, string> = {
  [AIAuditAction.CONVERSATION_STARTED]: 'blue',
  [AIAuditAction.CONVERSATION_DELETED]: 'gray',
  [AIAuditAction.MESSAGE_SENT]: 'green',
  [AIAuditAction.MESSAGE_RATED]: 'amber',
  [AIAuditAction.TOOL_CALLED]: 'purple',
  [AIAuditAction.TOOL_FAILED]: 'red',
  [AIAuditAction.RAG_RETRIEVED]: 'blue',
  [AIAuditAction.LLM_API_ERROR]: 'red',
  [AIAuditAction.RATE_LIMITED]: 'orange',
  [AIAuditAction.BUDGET_EXCEEDED]: 'red',
  [AIAuditAction.CONFIG_UPDATED]: 'gray',
};

export const AI_TRAINING_FORMATS = ['OPENAI_JSONL', 'ALPACA', 'SHARE_GPT'] as const;
export type AITrainingFormat = typeof AI_TRAINING_FORMATS[number];

export const AITrainingFormatLabel: Record<AITrainingFormat, string> = {
  OPENAI_JSONL: 'OpenAI JSONL (messages)',
  ALPACA: 'Alpaca (instruction/input/output)',
  SHARE_GPT: 'ShareGPT (conversations)',
};
