export enum LLMProvider {
  OPENROUTER = 'OPENROUTER',
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  DEEPSEEK = 'DEEPSEEK',
  OLLAMA = 'OLLAMA',
  CUSTOM = 'CUSTOM',
}

export const LLMProviderLabel: Record<LLMProvider, string> = {
  [LLMProvider.OPENROUTER]: 'OpenRouter (50+ model)',
  [LLMProvider.OPENAI]: 'OpenAI',
  [LLMProvider.ANTHROPIC]: 'Anthropic',
  [LLMProvider.DEEPSEEK]: 'DeepSeek',
  [LLMProvider.OLLAMA]: 'Ollama (lokal)',
  [LLMProvider.CUSTOM]: 'Özel (OpenAI uyumlu)',
};

export const LLMProviderBaseUrl: Record<LLMProvider, string> = {
  [LLMProvider.OPENROUTER]: 'https://openrouter.ai/api/v1',
  [LLMProvider.OPENAI]: 'https://api.openai.com/v1',
  [LLMProvider.ANTHROPIC]: 'https://api.anthropic.com/v1',
  [LLMProvider.DEEPSEEK]: 'https://api.deepseek.com/v1',
  [LLMProvider.OLLAMA]: 'http://localhost:11434/v1',
  [LLMProvider.CUSTOM]: '',
};

// Popüler modeller (UI dropdown için)
export const POPULAR_MODELS = [
  // OpenRouter aliasları (provider/space/model formatı)
  { provider: LLMProvider.OPENROUTER, model: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (önerilen, ucuz)', cost: 0.14 },
  { provider: LLMProvider.OPENROUTER, model: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (reasoning)', cost: 0.55 },
  { provider: LLMProvider.OPENROUTER, model: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', cost: 0.15 },
  { provider: LLMProvider.OPENROUTER, model: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', cost: 0.80 },
  { provider: LLMProvider.OPENROUTER, model: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', cost: 0.10 },
  { provider: LLMProvider.OPENROUTER, model: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B', cost: 0.40 },
  { provider: LLMProvider.OPENROUTER, model: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (ücretsiz)', cost: 0 },
  // Direkt
  { provider: LLMProvider.DEEPSEEK, model: 'deepseek-chat', label: 'DeepSeek V3 (direkt)', cost: 0.14 },
  { provider: LLMProvider.OPENAI, model: 'gpt-4o-mini', label: 'GPT-4o Mini (direkt)', cost: 0.15 },
  { provider: LLMProvider.OLLAMA, model: 'llama3.2', label: 'Llama 3.2 (lokal, ücretsiz)', cost: 0 },
];

export enum AssistantMessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
  TOOL = 'TOOL',
}

export const AssistantMessageRoleLabel: Record<AssistantMessageRole, string> = {
  [AssistantMessageRole.USER]: 'Kullanıcı',
  [AssistantMessageRole.ASSISTANT]: 'Asistan',
  [AssistantMessageRole.SYSTEM]: 'Sistem',
  [AssistantMessageRole.TOOL]: 'Araç',
};

export enum AssistantConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export const AssistantConversationStatusLabel: Record<AssistantConversationStatus, string> = {
  [AssistantConversationStatus.ACTIVE]: 'Aktif',
  [AssistantConversationStatus.ARCHIVED]: 'Arşivlendi',
  [AssistantConversationStatus.DELETED]: 'Silindi',
};
