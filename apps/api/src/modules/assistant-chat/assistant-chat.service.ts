import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import { createAdapter, type LLMAdapter, type ChatMessage, type ToolDefinition } from './llm/llm.adapter';
import { RAGService } from './llm/rag.service';
import { ITool, ToolContext, ToolExecutionResult } from './tools/tool.interface';
import { BUILTIN_TOOLS } from './tools/builtin-tools';
import { AIObservabilityService } from './ai-observability/ai-observability.service';
import {
  LLMProvider,
  LLMProviderBaseUrl,
  AssistantMessageRole,
  AssistantConversationStatus,
  TenantLLMConfig,
  AssistantConversation,
  AssistantMessage,
  ChatRequest,
  ChatResponse,
  AssistantToolCallResult,
  AssistantUsageStats,
} from '@saas/shared';

const DEFAULT_SYSTEM_PROMPT = `Sen Mavis adında, Türkçe SaaS İşletme Yönetimi panelinin yapay zeka asistanısın. Görevin:

1. Kullanıcının sorularını Türkçe olarak doğru, net ve nazik bir şekilde cevaplamak.
2. Sisteme ait veriler (satış, cari, stok, fatura, rapor) için tool'ları kullanmak. Bilgi tabanından yararlanmak.
3. Bilmediğin veya bilgi tabanında olmayan konularda "Bu konuda bilgim yok, lütfen yönetici ile iletişime geçin" demek. Uydurmak yasak.
4. Kullanıcının yetkisi olmayan verileri ASLA göstermemek (multi-tenant izolasyon).
5. Para birimlerini TL/TRY olarak göster, locale tr-TR kullan.
6. Tarihleri gg.aa.yyyy formatında göster.
7. Mümkünse tablo formatında özet sun. Karmaşık cevapları madde madde yaz.
8. Kullanıcıya yardımcı ol, kısa ve öz cevaplar ver. Gereksiz tekrar yapma.`;

@Injectable()
export class AssistantChatService {
  private readonly logger = new Logger(AssistantChatService.name);
  private tools: Map<string, ITool> = new Map();
  private observability: AIObservabilityService | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rag: RAGService,
  ) {
    // Built-in tool'ları kaydet
    // NOT: Nest DI instance'ları burada inject edilemez (constructor scope), bu yüzden
    // service oluşturulurken manuel olarak init edilecek
  }

  setObservability(obs: AIObservabilityService): void { this.observability = obs; }

  /**
   * Tool registry'sini init et (module'den çağrılır)
   */
  initTools(tools: ITool[]): void {
    for (const tool of tools) this.tools.set(tool.code, tool);
    this.logger.log(`${tools.length} tool yüklendi: ${[...this.tools.keys()].join(', ')}`);
  }

  // ===== LLM Config =====
  async getLLMConfig(tenantId: string): Promise<TenantLLMConfig | null> {
    const c = await this.prisma.client.tenantLLMConfig.findUnique({ where: { tenantId } });
    if (!c) return null;
    return this.toLLMConfigDto(c);
  }

  async upsertLLMConfig(tenantId: string, input: { provider: LLMProvider; apiKey: string; baseUrl?: string; defaultModel?: string; fallbackModel?: string; maxTokens?: number; temperature?: number; topP?: number; systemPrompt?: string; enabledModules?: string[]; rateLimitPerHour?: number; monthlyBudgetUSD?: number; toolPermissions?: string[] }, userId?: string): Promise<TenantLLMConfig> {
    const data: any = {
      provider: input.provider,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      defaultModel: input.defaultModel ?? 'deepseek/deepseek-chat',
      fallbackModel: input.fallbackModel,
      maxTokens: input.maxTokens ?? 2048,
      temperature: input.temperature ?? 0.3,
      topP: input.topP ?? 0.9,
      systemPrompt: input.systemPrompt,
      enabledModules: input.enabledModules ?? [],
      rateLimitPerHour: input.rateLimitPerHour ?? 100,
      monthlyBudgetUSD: input.monthlyBudgetUSD,
      toolPermissions: input.toolPermissions ?? [],
    };
    if (userId) data.createdById = userId;
    const c = await this.prisma.client.tenantLLMConfig.upsert({ where: { tenantId }, create: { ...data, tenantId }, update: data });
    return this.toLLMConfigDto(c);
  }

  async deleteLLMConfig(tenantId: string): Promise<void> {
    await this.prisma.client.tenantLLMConfig.deleteMany({ where: { tenantId } });
  }

  async testConnection(tenantId: string, input: { provider: LLMProvider; apiKey: string; baseUrl?: string; defaultModel?: string }): Promise<{ ok: boolean; message: string; latencyMs: number; model: string }> {
    const start = Date.now();
    try {
      const adapter = createAdapter(input.provider, input.apiKey, input.baseUrl);
      const res = await adapter.chat({ model: input.defaultModel ?? 'deepseek/deepseek-chat', messages: [{ role: 'user', content: 'pong' }], max_tokens: 10 });
      return { ok: true, message: res.choices?.[0]?.message?.content ?? 'Cevap alınamadı', latencyMs: Date.now() - start, model: res.model };
    } catch (e: any) {
      return { ok: false, message: e.message ?? 'Bilinmeyen hata', latencyMs: Date.now() - start, model: input.defaultModel ?? '' };
    }
  }

  // ===== Chat =====
  async chat(tenantId: string, userId: string, req: ChatRequest): Promise<ChatResponse> {
    const config = await this.prisma.client.tenantLLMConfig.findUnique({ where: { tenantId } });
    if (!config || !config.isActive) throw new BadRequestException('LLM yapılandırması aktif değil. Lütfen ayarlardan API key girin.');

    // Rate limit
    await this.checkRateLimit(tenantId, userId, config.rateLimitPerHour);

    // Budget
    if (config.monthlyBudgetUSD && config.monthlyUsageUSD >= config.monthlyBudgetUSD) {
      throw new BadRequestException('Aylık LLM bütçesi aşıldı');
    }

    // Conversation
    let conv = req.conversationId
      ? await this.prisma.client.assistantConversation.findFirst({ where: { id: req.conversationId, tenantId, userId, status: AssistantConversationStatus.ACTIVE } })
      : null;
    if (!conv) {
      conv = await this.prisma.client.assistantConversation.create({ data: { tenantId, userId, title: req.message.substring(0, 80), llmConfigId: config.id, context: (req.context ?? {}) as any } });
    }

    // User message kaydet
    const userMsg = await this.prisma.client.assistantMessage.create({
      data: { conversationId: conv.id, tenantId, role: AssistantMessageRole.USER, content: req.message },
    });
    await this.observability?.log(tenantId, userId, AssistantMessageRole.USER === 'USER' ? 'MESSAGE_SENT' as any : 'MESSAGE_SENT' as any, { tokens: 0, messageLength: req.message.length }, conv.id, userMsg.id);

    // History
    const history = await this.prisma.client.assistantMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // RAG context
    const systemPrompt = await this.buildSystemPrompt(tenantId, config, req.message, userId);

    // Adapter
    const adapter = createAdapter(config.provider, config.apiKey, config.baseUrl ?? undefined);
    const model = req.model ?? config.defaultModel;
    const temperature = req.temperature ?? config.temperature;
    const maxTokens = req.maxTokens ?? config.maxTokens;

    // Tools definitions (LLM'e sun)
    const toolDefs: ToolDefinition[] = ((config.toolPermissions as any[]) ?? []).length === 0
      ? []
      : ((config.toolPermissions as any[]) ?? []).map((code) => this.tools.get(code)?.definition).filter(Boolean) as ToolDefinition[];

    // Messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role.toLowerCase() as any, content: m.content })),
      { role: 'user', content: req.message },
    ];

    // İlk çağrı
    const start = Date.now();
    let llmResponse = await adapter.chat({ model, messages, tools: toolDefs.length > 0 ? toolDefs : undefined, tool_choice: toolDefs.length > 0 ? 'auto' : undefined, temperature, max_tokens: maxTokens });

    // Tool çağrıları işle
    const toolCallResults: AssistantToolCallResult[] = [];
    let iteration = 0;
    const MAX_ITERATIONS = 5;
    while (llmResponse.choices?.[0]?.finish_reason === 'tool_calls' && iteration < MAX_ITERATIONS) {
      const toolCalls = llmResponse.choices[0].message.tool_calls ?? [];
      const toolMessages: ChatMessage[] = [];

      for (const tc of toolCalls) {
        const args = JSON.parse(tc.function.arguments);
        const tool = this.tools.get(tc.function.name);
        const tcStart = Date.now();
        let result: ToolExecutionResult;
        let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
        if (!tool) {
          result = { success: false, error: 'Tool bulunamadı', display: `❌ ${tc.function.name} tool'u tanımlı değil` };
          status = 'FAILED';
        } else {
          try {
            result = await tool.execute(args, { tenantId, userId, userName: '', userPermissions: [] });
          } catch (e: any) {
            result = { success: false, error: e.message, display: `❌ Hata: ${e.message}` };
            status = 'FAILED';
          }
        }
        const tcRecord: AssistantToolCallResult = {
          id: tc.id, toolCode: tc.function.name, toolName: tool?.name ?? tc.function.name, arguments: args, result: result.data, error: result.error, status, latencyMs: Date.now() - tcStart,
        };
        toolCallResults.push(tcRecord);

        // DB'ye kaydet
        await this.prisma.client.assistantToolCall.create({ data: { conversationId: conv.id, messageId: userMsg.id, tenantId, toolCode: tcRecord.toolCode, toolName: tcRecord.toolName, arguments: args as any, result: (result.data ?? null) as any, error: result.error, status, latencyMs: tcRecord.latencyMs } });
        // Audit log
        await this.observability?.log(tenantId, userId, status === 'SUCCESS' ? 'TOOL_CALLED' as any : 'TOOL_FAILED' as any, { toolCode: tcRecord.toolCode, arguments: args, latencyMs: tcRecord.latencyMs, error: result.error }, conv.id, undefined, status === 'SUCCESS' ? 'INFO' : 'WARN');

        // LLM'e tool sonucunu gönder
        toolMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ display: result.display, data: result.data, table: result.table, highlight: result.highlight }) });
      }

      // LLM tekrar çağır (tool sonuçlarıyla)
      messages.push({ role: 'assistant', content: llmResponse.choices[0].message.content ?? '', tool_calls: toolCalls as any });
      messages.push(...toolMessages);
      llmResponse = await adapter.chat({ model, messages, tools: toolDefs.length > 0 ? toolDefs : undefined, tool_choice: 'auto', temperature, max_tokens: maxTokens });
      iteration++;
    }

    const finalContent = llmResponse.choices?.[0]?.message?.content ?? 'Cevap üretilemedi';
    const latencyMs = Date.now() - start;
    const usage = llmResponse.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const costUSD = this.estimateCost(model, usage.prompt_tokens, usage.completion_tokens);

    // Assistant message kaydet
    const assistantMsg = await this.prisma.client.assistantMessage.create({
      data: { conversationId: conv.id, tenantId, role: AssistantMessageRole.ASSISTANT, content: finalContent, toolCalls: toolCallResults as any, tokens: usage.total_tokens, costUSD, model, latencyMs },
    });

    // Conversation güncelle
    await this.prisma.client.assistantConversation.update({
      where: { id: conv.id },
      data: { messageCount: { increment: 2 }, totalTokens: { increment: usage.total_tokens }, totalCostUSD: { increment: costUSD }, lastMessageAt: new Date() },
    });

    // Config usage güncelle
    await this.prisma.client.tenantLLMConfig.update({ where: { id: config.id }, data: { monthlyUsageUSD: { increment: costUSD } } });

    // Usage stats
    await this.recordUsage(tenantId, userId, model, usage, toolCallResults.length, costUSD);

    // Training entry kaydet (süper admin için)
    if (this.observability) {
      const sources = (await this.rag.retrieve(tenantId, req.message, 5)).map((s) => ({ id: s.id, title: s.title, module: s.module }));
      await this.observability.recordTrainingEntry(tenantId, conv.id, assistantMsg.id, userId, req.message, finalContent, model, toolCallResults, sources, usage.total_tokens, costUSD, latencyMs);
    }
    return {
      conversationId: conv.id,
      userMessage: this.toMessageDto(userMsg),
      assistantMessage: this.toMessageDto(assistantMsg),
      toolCalls: toolCallResults,
      sources: (await this.rag.retrieve(tenantId, req.message, 5, undefined)).map((s) => ({ id: s.id, title: s.title, module: s.module, snippet: s.snippet })),
      usage: { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, totalCostUSD: costUSD, model, latencyMs },
    };
  }

  async chatStream(tenantId: string, userId: string, req: ChatRequest, onChunk: (text: string) => void): Promise<ChatResponse> {
    const config = await this.prisma.client.tenantLLMConfig.findUnique({ where: { tenantId } });
    if (!config || !config.isActive) throw new BadRequestException('LLM aktif değil');
    const adapter = createAdapter(config.provider, config.apiKey, config.baseUrl ?? undefined);
    const model = req.model ?? config.defaultModel;

    let conv = req.conversationId ? await this.prisma.client.assistantConversation.findFirst({ where: { id: req.conversationId, tenantId, userId } }) : null;
    if (!conv) conv = await this.prisma.client.assistantConversation.create({ data: { tenantId, userId, title: req.message.substring(0, 80), llmConfigId: config.id } });

    const userMsg = await this.prisma.client.assistantMessage.create({ data: { conversationId: conv.id, tenantId, role: AssistantMessageRole.USER, content: req.message } });
    const systemPrompt = await this.buildSystemPrompt(tenantId, config, req.message, userId);

    const start = Date.now();
    let fullContent = '';
    const response = await adapter.chatStream({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: req.message }], temperature: req.temperature ?? config.temperature, max_tokens: req.maxTokens ?? config.maxTokens, stream: true }, (chunk) => {
      const c = chunk.choices?.[0]?.delta?.content ?? '';
      if (c) {
        fullContent += c;
        onChunk(c);
      }
    });
    const latencyMs = Date.now() - start;
    const costUSD = this.estimateCost(model, 0, 0); // streaming'de usage gelmiyor, tahmin etmiyoruz

    const assistantMsg = await this.prisma.client.assistantMessage.create({ data: { conversationId: conv.id, tenantId, role: AssistantMessageRole.ASSISTANT, content: fullContent, model, latencyMs } });
    await this.prisma.client.assistantConversation.update({ where: { id: conv.id }, data: { messageCount: { increment: 2 }, lastMessageAt: new Date() } });

    return { conversationId: conv.id, userMessage: this.toMessageDto(userMsg), assistantMessage: this.toMessageDto(assistantMsg), toolCalls: [], sources: [], usage: { inputTokens: 0, outputTokens: 0, totalCostUSD: 0, model, latencyMs } };
  }

  // ===== Conversations =====
  async listConversations(tenantId: string, userId: string, filters: { status?: AssistantConversationStatus; page?: number; pageSize?: number }) {
    const where: any = { tenantId, userId };
    if (filters.status) where.status = filters.status; else where.status = { not: AssistantConversationStatus.DELETED };
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.client.assistantConversation.findMany({ where, orderBy: { lastMessageAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.assistantConversation.count({ where }),
    ]);
    return { items: items.map((c) => this.toConvDto(c)), total, page, pageSize };
  }

  async getConversation(tenantId: string, userId: string, id: string): Promise<AssistantConversation> {
    const c = await this.prisma.client.assistantConversation.findFirst({ where: { id, tenantId, userId } });
    if (!c) throw new NotFoundException('Konuşma bulunamadı');
    const messages = await this.prisma.client.assistantMessage.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' } });
    return this.toConvDto(c, messages);
  }

  async updateConversation(tenantId: string, userId: string, id: string, input: { title?: string; status?: AssistantConversationStatus; context?: any }) {
    const c = await this.prisma.client.assistantConversation.findFirst({ where: { id, tenantId, userId } });
    if (!c) throw new NotFoundException('Konuşma bulunamadı');
    const data: any = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.status !== undefined) data.status = input.status;
    if (input.context !== undefined) data.context = input.context;
    const updated = await this.prisma.client.assistantConversation.update({ where: { id }, data });
    return this.toConvDto(updated);
  }

  async deleteConversation(tenantId: string, userId: string, id: string) {
    const c = await this.prisma.client.assistantConversation.findFirst({ where: { id, tenantId, userId } });
    if (!c) throw new NotFoundException('Konuşma bulunamadı');
    await this.prisma.client.assistantConversation.update({ where: { id }, data: { status: AssistantConversationStatus.DELETED } });
  }

  async rateMessage(tenantId: string, userId: string, messageId: string, rating: number, note?: string) {
    const m = await this.prisma.client.assistantMessage.findFirst({ where: { id: messageId, tenantId } });
    if (!m) throw new NotFoundException('Mesaj bulunamadı');
    const conv = await this.prisma.client.assistantConversation.findFirst({ where: { id: m.conversationId, userId } });
    if (!conv) throw new NotFoundException('Konuşma bulunamadı');
    return this.prisma.client.assistantMessage.update({ where: { id: messageId }, data: { feedbackRating: rating, feedbackNote: note } });
  }

  // ===== Stats =====
  async getUsageStats(tenantId: string, days = 30): Promise<AssistantUsageStats> {
    const since = new Date(); since.setDate(since.getDate() - days);
    const stats = await this.prisma.client.assistantUsageStats.findMany({ where: { tenantId, date: { gte: since } } });
    const totalRequests = stats.reduce((s, x) => s + x.requestCount, 0);
    const totalTokens = stats.reduce((s, x) => s + x.totalTokens, 0);
    const totalCostUSD = stats.reduce((s, x) => s + x.totalCostUSD, 0);
    const byModel = new Map<string, { requests: number; tokens: number; cost: number }>();
    const byDay = new Map<string, { requests: number; tokens: number; cost: number }>();
    const byUser = new Map<string, { userId: string; userName: string; requests: number; tokens: number; cost: number }>();
    for (const s of stats) {
      const m = byModel.get(s.model) ?? { requests: 0, tokens: 0, cost: 0 };
      m.requests += s.requestCount; m.tokens += s.totalTokens; m.cost += s.totalCostUSD;
      byModel.set(s.model, m);
      const d = s.date.toISOString().substring(0, 10);
      const dd = byDay.get(d) ?? { requests: 0, tokens: 0, cost: 0 };
      dd.requests += s.requestCount; dd.tokens += s.totalTokens; dd.cost += s.totalCostUSD;
      byDay.set(d, dd);
      const u = byUser.get(s.userId) ?? { userId: s.userId, userName: '', requests: 0, tokens: 0, cost: 0 };
      u.requests += s.requestCount; u.tokens += s.totalTokens; u.cost += s.totalCostUSD;
      byUser.set(s.userId, u);
    }
    // User isimleri
    const userIds = Array.from(byUser.keys());
    const users = await this.prisma.client.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } });
    for (const u of users) {
      const entry = byUser.get(u.id);
      if (entry) entry.userName = u.fullName ?? u.email;
    }
    const config = await this.prisma.client.tenantLLMConfig.findUnique({ where: { tenantId } });
    return {
      totalRequests, totalTokens, totalCostUSD,
      byModel: Array.from(byModel.entries()).map(([model, v]) => ({ model, ...v })),
      byDay: Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
      byUser: Array.from(byUser.values()),
      budgetUsage: config?.monthlyBudgetUSD ? (config.monthlyUsageUSD / config.monthlyBudgetUSD) : 0,
    };
  }

  // ===== HELPERS =====
  private async buildSystemPrompt(tenantId: string, config: any, query: string, userId: string): Promise<string> {
    const basePrompt = config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    const ragContext = await this.rag.buildContextPrompt(tenantId, query, config.enabledModules as string[]);
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    const userContext = `\n\n### KULLANICI BİLGİSİ:\nID: ${userId}\nAd: ${user?.fullName ?? '?'}\nRol: ${user?.status ?? 'ACTIVE'}\nTenant: ${tenantId}\nTarih: ${new Date().toLocaleString('tr-TR')}`;
    return basePrompt + userContext + ragContext;
  }

  private async checkRateLimit(tenantId: string, userId: string, limit: number): Promise<void> {
    const since = new Date(); since.setHours(since.getHours() - 1);
    const count = await this.prisma.client.assistantMessage.count({ where: { tenantId, role: AssistantMessageRole.USER, createdAt: { gte: since }, conversation: { userId } } });
    if (count >= limit) throw new BadRequestException(`Saatlik istek limiti aşıldı (${limit})`);
  }

  private async recordUsage(tenantId: string, userId: string, model: string, usage: any, toolCount: number, cost: number) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    await this.prisma.client.assistantUsageStats.upsert({
      where: { tenantId_userId_date_model: { tenantId, userId, date: today, model } },
      create: { tenantId, userId, date: today, model, requestCount: 1, totalTokens: usage.total_tokens, inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, totalCostUSD: cost, toolCallCount: toolCount },
      update: { requestCount: { increment: 1 }, totalTokens: { increment: usage.total_tokens }, inputTokens: { increment: usage.prompt_tokens }, outputTokens: { increment: usage.completion_tokens }, totalCostUSD: { increment: cost }, toolCallCount: { increment: toolCount } },
    });
  }

  private estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Basit fiyatlandırma (OpenRouter fiyatları / 1M token)
    const pricing: Record<string, { in: number; out: number }> = {
      'deepseek/deepseek-chat': { in: 0.14, out: 0.28 },
      'deepseek/deepseek-r1': { in: 0.55, out: 2.19 },
      'openai/gpt-4o-mini': { in: 0.15, out: 0.60 },
      'anthropic/claude-3.5-haiku': { in: 0.80, out: 4.00 },
      'meta-llama/llama-3.3-70b-instruct': { in: 0.10, out: 0.30 },
      'qwen/qwen-2.5-72b-instruct': { in: 0.40, out: 0.40 },
      'google/gemini-2.0-flash-exp:free': { in: 0, out: 0 },
      'deepseek-chat': { in: 0.14, out: 0.28 },
      'gpt-4o-mini': { in: 0.15, out: 0.60 },
    };
    const p = pricing[model] ?? { in: 0.50, out: 1.00 }; // bilinmeyen model — yüksek tahmin
    return (inputTokens / 1_000_000) * p.in + (outputTokens / 1_000_000) * p.out;
  }

  // ===== DTOs =====
  private toLLMConfigDto(c: any): TenantLLMConfig {
    return { id: c.id, tenantId: c.tenantId, provider: c.provider, apiKeyMasked: this.maskKey(c.apiKey), baseUrl: c.baseUrl, defaultModel: c.defaultModel, fallbackModel: c.fallbackModel, maxTokens: c.maxTokens, temperature: c.temperature, topP: c.topP, systemPrompt: c.systemPrompt, enabledModules: c.enabledModules, rateLimitPerHour: c.rateLimitPerHour, monthlyBudgetUSD: c.monthlyBudgetUSD, monthlyUsageUSD: c.monthlyUsageUSD, isActive: c.isActive, toolPermissions: c.toolPermissions, createdById: c.createdById, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
  }
  private toMessageDto(m: any): AssistantMessage {
    return { id: m.id, conversationId: m.conversationId, role: m.role, content: m.content, toolCalls: m.toolCalls, tokens: m.tokens, costUSD: m.costUSD, model: m.model, latencyMs: m.latencyMs, feedbackRating: m.feedbackRating, feedbackNote: m.feedbackNote, metadata: m.metadata, createdAt: m.createdAt.toISOString() };
  }
  private toConvDto(c: any, messages?: any[]): AssistantConversation {
    return { id: c.id, tenantId: c.tenantId, userId: c.userId, title: c.title, status: c.status, context: c.context, messageCount: c.messageCount, totalTokens: c.totalTokens, totalCostUSD: c.totalCostUSD, metadata: c.metadata, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), lastMessageAt: c.lastMessageAt.toISOString(), llmConfigId: c.llmConfigId, messages: messages?.map((m) => this.toMessageDto(m)) };
  }
  private maskKey(key: string): string {
    if (!key || key.length < 8) return '****';
    return key.substring(0, 7) + '****' + key.substring(key.length - 4);
  }
}
