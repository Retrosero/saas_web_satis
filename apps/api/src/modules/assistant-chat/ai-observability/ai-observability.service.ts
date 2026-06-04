import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.module';
import { AIAuditAction, AIFeedbackType, AITrainingFormat, type AIAuditLog, type AITrainingEntry, type AITrainingDataset, type AIGlobalStats, type AIExportResult } from '@saas/shared';

/**
 * Süper Admin AI Observability
 * Tüm tenantların AI kullanımını izler, training data toplar, export eder.
 */
@Injectable()
export class AIObservabilityService {
  private readonly logger = new Logger(AIObservabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== AUDIT LOG =====
  async log(tenantId: string | null, userId: string | null, action: AIAuditAction, details: any, conversationId?: string, messageId?: string, severity: 'INFO' | 'WARN' | 'ERROR' = 'INFO', req?: any) {
    try {
      await this.prisma.client.aIAuditLog.create({ data: { tenantId: tenantId ?? undefined, userId: userId ?? undefined, conversationId, messageId, action, details: details ?? {}, ipAddress: req?.ip, userAgent: req?.headers?.['user-agent']?.substring(0, 200), severity } as any });
    } catch (e: any) { this.logger.warn(`Audit log yazılamadı: ${e.message}`); }
  }

  // ===== GLOBAL DASHBOARD =====
  async getGlobalStats(days = 30): Promise<AIGlobalStats> {
    const since = new Date(); since.setDate(since.getDate() - days);
    const [conversations, messages, toolCalls, costs, tenants, users, feedback] = await Promise.all([
      this.prisma.client.assistantConversation.count({ where: { createdAt: { gte: since } } }),
      this.prisma.client.assistantMessage.count({ where: { createdAt: { gte: since } } }),
      this.prisma.client.assistantToolCall.count({ where: { createdAt: { gte: since } } }),
      this.prisma.client.assistantUsageStats.aggregate({ where: { date: { gte: since } }, _sum: { totalCostUSD: true, totalTokens: true } }),
      this.prisma.client.tenant.findMany({ where: { isDeleted: false }, select: { id: true, name: true } }),
      this.prisma.client.user.findMany({ where: { isDeleted: false }, select: { id: true, fullName: true, tenantId: true } }),
      this.prisma.client.aITrainingEntry.groupBy({ by: ['feedback'], where: { createdAt: { gte: since } }, _count: true }),
    ]);

    // Tenant bazlı
    const tenantMap = new Map(tenants.map((t: any) => [t.id, t.name]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    const tenantConvs = await this.prisma.client.assistantConversation.groupBy({ by: ['tenantId'], where: { createdAt: { gte: since } }, _count: true });
    const tenantCosts = await this.prisma.client.tenantLLMConfig.findMany({});
    const costByTenant = new Map(tenantCosts.map((c) => [c.tenantId, c.monthlyUsageUSD]));

    const byTenant = tenantConvs.map((tc: any) => ({ tenantId: tc.tenantId, tenantName: tenantMap.get(tc.tenantId) ?? '?', conversations: tc._count, cost: costByTenant.get(tc.tenantId) ?? 0 })).sort((a: any, b: any) => b.cost - a.cost).slice(0, 10);

    // Model bazlı
    const modelStats = await this.prisma.client.assistantUsageStats.groupBy({ by: ['model'], where: { date: { gte: since } }, _sum: { totalCostUSD: true, requestCount: true } });
    const byModel = modelStats.map((m: any) => ({ model: m.model, requests: m._sum.requestCount ?? 0, cost: m._sum.totalCostUSD ?? 0 })).sort((a: any, b: any) => b.cost - a.cost);

    // Günlük
    const dailyStats = await this.prisma.client.assistantUsageStats.findMany({ where: { date: { gte: since } } });
    const dayMap = new Map<string, { requests: number; cost: number }>();
    for (const d of dailyStats) {
      const day = d.date.toISOString().substring(0, 10);
      const cur = dayMap.get(day) ?? { requests: 0, cost: 0 };
      cur.requests += d.requestCount; cur.cost += d.totalCostUSD;
      dayMap.set(day, cur);
    }
    const byDay = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));

    // En aktif kullanıcılar
    const userConvs = await this.prisma.client.assistantConversation.groupBy({ by: ['userId'], where: { createdAt: { gte: since } }, _count: true });
    const topUsers = userConvs.sort((a: any, b: any) => b._count - a._count).slice(0, 10).map((uc) => ({ userId: uc.userId, userName: userMap.get(uc.userId)?.fullName ?? '?', tenantId: userMap.get(uc.userId)?.tenantId ?? '', messages: uc._count, cost: 0 }));

    // Feedback
    const get = (s: AIFeedbackType) => feedback.find((f) => f.feedback === s)?._count ?? 0;
    return {
      totalConversations: conversations, totalMessages: messages, totalToolCalls: toolCalls,
      totalCostUSD: costs._sum.totalCostUSD ?? 0, totalTokens: costs._sum.totalTokens ?? 0,
      byTenant, byModel, byDay, feedbackStats: { positive: get(AIFeedbackType.POSITIVE), negative: get(AIFeedbackType.NEGATIVE), neutral: get(AIFeedbackType.NEUTRAL), corrected: get(AIFeedbackType.CORRECTED) },
      topUsers,
    };
  }

  // ===== CONVERSATIONS (cross-tenant) =====
  async listAllConversations(filters: { tenantId?: string; userId?: string; status?: string; from?: string; to?: string; minCost?: number; page?: number; pageSize?: number }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    if (filters.minCost !== undefined) where.totalCostUSD = { gte: filters.minCost };
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const [items, total] = await Promise.all([
      this.prisma.client.assistantConversation.findMany({ where, orderBy: { lastMessageAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { tenant: true } }),
      this.prisma.client.assistantConversation.count({ where }),
    ]);
    const userIds = Array.from(new Set(items.map((i: any) => i.userId)));
    const users = await this.prisma.client.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true } });
    const userMap = new Map(users.map((u: any) => [u.id, u.fullName]));
    return {
      items: items.map((c) => ({ ...c, tenantName: (c as any).tenant?.name, userName: userMap.get((c as any).userId), createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), lastMessageAt: c.lastMessageAt.toISOString() })),
      total, page, pageSize,
    };
  }

  async getConversationDetail(convId: string) {
    const c = await this.prisma.client.assistantConversation.findUnique({ where: { id: convId }, include: { tenant: true } });
    if (!c) throw new NotFoundException('Konuşma bulunamadı');
    const [messages, toolCalls, user] = await Promise.all([
      this.prisma.client.assistantMessage.findMany({ where: { conversationId: convId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.client.assistantToolCall.findMany({ where: { conversationId: convId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.client.user.findUnique({ where: { id: c.userId }, select: { id: true, fullName: true, email: true, tenantId: true } }),
    ]);
    return {
      conversation: { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), lastMessageAt: c.lastMessageAt.toISOString(), tenantName: (c as any).tenant?.name },
      user,
      messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      toolCalls: toolCalls.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    };
  }

  // ===== AUDIT LOGS =====
  async listAuditLogs(filters: { tenantId?: string; userId?: string; action?: AIAuditAction; severity?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.severity) where.severity = filters.severity;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const [items, total] = await Promise.all([
      this.prisma.client.aIAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.aIAuditLog.count({ where }),
    ]);
    const [tenants, users] = await Promise.all([this.prisma.client.tenant.findMany({ where: { id: { in: Array.from(new Set(items.map((i) => i.tenantId).filter(Boolean) as string[])) } }, select: { id: true, name: true } }), this.prisma.client.user.findMany({ where: { id: { in: Array.from(new Set(items.map((i: any) => i.userId).filter(Boolean) as string[])) } }, select: { id: true, fullName: true } })]);
    const tenantMap = new Map(tenants.map((t: any) => [t.id, t.name]));
    const userMap = new Map(users.map((u: any) => [u.id, u.fullName]));
    return { items: items.map((l: any) => ({ ...l, tenantName: (l as any).tenantId ? tenantMap.get((l as any).tenantId) : undefined, userName: (l as any).userId ? userMap.get((l as any).userId) : undefined, createdAt: l.createdAt.toISOString() })), total, page, pageSize };
  }

  // ===== TRAINING DATA =====
  /**
   * Konuşma mesajını training entry olarak kaydet
   */
  async recordTrainingEntry(tenantId: string, conversationId: string, messageId: string, userId: string, userQuery: string, assistantAnswer: string, model: string, toolCalls: any[], sources: any[], tokens?: number, costUSD?: number, latencyMs?: number) {
    const entry = await this.prisma.client.aITrainingEntry.create({ data: { tenantId, conversationId, messageId, userId, userQuery, assistantAnswer, model, toolCalls: toolCalls as any, sources: sources as any, tokens, costUSD, latencyMs } });
    return entry;
  }

  async updateFeedback(messageId: string, feedback: AIFeedbackType, feedbackNote?: string, rating?: number, correctedAnswer?: string) {
    const existing = await this.prisma.client.aITrainingEntry.findFirst({ where: { messageId } });
    if (!existing) return null;
    return this.prisma.client.aITrainingEntry.update({ where: { id: existing.id }, data: { feedback, feedbackNote, rating, correctedAnswer } });
  }

  async listTrainingEntries(filters: { tenantId?: string; feedback?: AIFeedbackType; model?: string; rating?: number; isExported?: boolean; from?: string; to?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.feedback) where.feedback = filters.feedback;
    if (filters.model) where.model = filters.model;
    if (filters.rating !== undefined) where.rating = filters.rating;
    if (filters.isExported !== undefined) where.isExported = filters.isExported;
    if (filters.from || filters.to) { where.createdAt = {}; if (filters.from) where.createdAt.gte = new Date(filters.from); if (filters.to) where.createdAt.lte = new Date(filters.to); }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const [items, total] = await Promise.all([
      this.prisma.client.aITrainingEntry.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.aITrainingEntry.count({ where }),
    ]);
    const [tenants, users] = await Promise.all([this.prisma.client.tenant.findMany({ where: { id: { in: Array.from(new Set(items.map((i: any) => i.tenantId))) } }, select: { id: true, name: true } }), this.prisma.client.user.findMany({ where: { id: { in: Array.from(new Set(items.map((i: any) => i.userId).filter(Boolean))) as string[] } }, select: { id: true, fullName: true } })]);
    const tenantMap = new Map(tenants.map((t: any) => [t.id, t.name]));
    const userMap = new Map(users.map((u: any) => [u.id, u.fullName]));
    return { items: items.map((e: any) => ({ ...e, tenantName: tenantMap.get(e.tenantId), userName: e.userId ? userMap.get(e.userId) : undefined, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() })), total, page, pageSize };
  }

  async submitCorrection(entryId: string, correctedAnswer: string, feedbackNote?: string) {
    const e = await this.prisma.client.aITrainingEntry.findUnique({ where: { id: entryId } });
    if (!e) throw new NotFoundException('Entry bulunamadı');
    return this.prisma.client.aITrainingEntry.update({ where: { id: entryId }, data: { correctedAnswer, feedback: AIFeedbackType.CORRECTED, feedbackNote } });
  }

  // ===== DATASET EXPORT =====
  async createDataset(input: { name: string; description?: string; format: any; includeOnlyPositive?: boolean; includeCorrected?: boolean; filterModel?: string; filterFrom?: string; filterTo?: string }, userId: string): Promise<AITrainingDataset> {
    const d = await this.prisma.client.aITrainingDataset.create({ data: { name: input.name, description: input.description, format: input.format, includeOnlyPositive: input.includeOnlyPositive ?? false, includeCorrected: input.includeCorrected ?? true, filterModel: input.filterModel, filterFrom: input.filterFrom ? new Date(input.filterFrom) : null, filterTo: input.filterTo ? new Date(input.filterTo) : null, createdById: userId } as any });
    return this.toDatasetDto(d);
  }

  async listDatasets() {
    const items = await this.prisma.client.aITrainingDataset.findMany({ orderBy: { createdAt: 'desc' } });
    return items.map((d: any) => this.toDatasetDto(d));
  }

  async generateDataset(datasetId: string): Promise<AIExportResult> {
    const dataset = await this.prisma.client.aITrainingDataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException('Dataset bulunamadı');

    const where: any = { isExported: false };
    if (dataset.filterModel) where.model = dataset.filterModel;
    if (dataset.filterFrom) where.createdAt = { ...(where.createdAt ?? {}), gte: dataset.filterFrom };
    if (dataset.filterTo) where.createdAt = { ...(where.createdAt ?? {}), lte: dataset.filterTo };
    if (dataset.includeOnlyPositive) where.feedback = AIFeedbackType.POSITIVE;
    else if (!dataset.includeCorrected) where.feedback = { in: [AIFeedbackType.POSITIVE, AIFeedbackType.NEUTRAL] };

    const entries = await this.prisma.client.aITrainingEntry.findMany({ where, orderBy: { createdAt: 'asc' } });
    if (entries.length === 0) throw new BadRequestException('Filtreye uyan training entry yok');

    // Format'a göre dönüştür
    let content = '';
    for (const e of (entries as any[])) {
      const finalAnswer = e.correctedAnswer ?? e.assistantAnswer;
      if (dataset.format === 'OPENAI_JSONL') {
        content += JSON.stringify({ messages: [{ role: 'user', content: e.userQuery }, { role: 'assistant', content: finalAnswer }] }) + '\n';
      } else if (dataset.format === 'ALPACA') {
        content += JSON.stringify({ instruction: e.userQuery, input: '', output: finalAnswer }) + '\n';
      } else {
        // ShareGPT
        content += JSON.stringify({ conversations: [{ from: 'human', value: e.userQuery }, { from: 'gpt', value: finalAnswer }] }) + '\n';
      }
    }

    // Base64 encode
    const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');
    const filename = `${dataset.name.replace(/\s/g, '_')}_${dataset.format.toLowerCase()}.jsonl`;

    // Mark exported
    await this.prisma.client.aITrainingEntry.updateMany({ where: { id: { in: entries.map((e: any) => e.id) } }, data: { isExported: true, exportedAt: new Date() } });
    await this.prisma.client.aITrainingDataset.update({ where: { id: datasetId }, data: { entryCount: entries.length, generatedAt: new Date() } });

    return { datasetId, entryCount: entries.length, format: dataset.format as any, contentBase64, filename };
  }

  async deleteDataset(id: string) {
    await this.prisma.client.aITrainingDataset.delete({ where: { id } });
  }

  // ===== DTOs =====
  private toDatasetDto(d: any): AITrainingDataset {
    return { id: d.id, tenantId: d.tenantId, name: d.name, description: d.description, format: d.format, entryCount: d.entryCount, includeOnlyPositive: d.includeOnlyPositive, includeCorrected: d.includeCorrected, filterModel: d.filterModel, filterFrom: d.filterFrom?.toISOString(), filterTo: d.filterTo?.toISOString(), generatedAt: d.generatedAt?.toISOString(), fileUrl: d.fileUrl, createdById: d.createdById, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() };
  }
}
