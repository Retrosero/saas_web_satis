/**
 * LLM Adapter Interface
 * OpenAI-compatible API'ler için (OpenRouter, OpenAI, DeepSeek, Ollama, custom)
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ChatRequestParams {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  tool_choice?: 'auto' | 'none' | 'required';
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface ChatResponseChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;
  };
  finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatResponseChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      tool_calls?: any[];
    };
    finish_reason?: string;
  }>;
}

export interface LLMAdapter {
  chat(params: ChatRequestParams): Promise<ChatResponse>;
  chatStream(params: ChatRequestParams, onChunk: (chunk: StreamChunk) => void): Promise<ChatResponse>;
}

/**
 * OpenAI-compatible adapter
 * OpenRouter, OpenAI, DeepSeek, Ollama (lokal), custom provider'lar
 */
export class OpenAICompatibleAdapter implements LLMAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly provider: string = 'openai',
  ) {}

  private getHeaders(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (this.provider === 'openrouter') {
      h['HTTP-Referer'] = 'https://mavis-saas.local';
      h['X-Title'] = 'Mavis SaaS Assistant';
    }
    return h;
  }

  async chat(params: ChatRequestParams): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...params, stream: false }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM API error (${res.status}): ${errText}`);
    }
    return (await res.json()) as ChatResponse;
  }

  async chatStream(params: ChatRequestParams, onChunk: (chunk: StreamChunk) => void): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...params, stream: true }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM API error (${res.status}): ${errText}`);
    }
    if (!res.body) throw new Error('No response body');

    const reader = (res.body as any).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let toolCalls: any[] = [];
    let lastChunk: any = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const chunk: StreamChunk = JSON.parse(data);
          lastChunk = chunk;
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            fullContent += delta.content;
            onChunk(chunk);
          }
          if (delta?.tool_calls) {
            toolCalls.push(...delta.tool_calls);
          }
        } catch (e) { /* ignore parse errors */ }
      }
    }

    // Reconstruct full response
    return {
      id: lastChunk?.id ?? 'stream',
      object: 'chat.completion',
      created: lastChunk?.created ?? Math.floor(Date.now() / 1000),
      model: lastChunk?.model ?? params.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: fullContent, tool_calls: toolCalls.length > 0 ? toolCalls : undefined },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, // streaming modda usage gelmeyebilir
    };
  }
}

/**
 * Adapter factory
 */
export function createAdapter(provider: string, apiKey: string, baseUrl?: string): LLMAdapter {
  const { LLMProvider, LLMProviderBaseUrl } = require('@saas/shared') as any;
  const defaultUrl = LLMProviderBaseUrl[provider as keyof typeof LLMProviderBaseUrl];
  return new OpenAICompatibleAdapter(apiKey, baseUrl || defaultUrl, provider.toLowerCase());
}
