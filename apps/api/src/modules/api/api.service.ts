import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.module.js';
import type {
  ApiKey,
  ApiKeyStatus,
  ApiKeyUsageLog,
  ApiScope,
  PaginatedResponse,
  Webhook,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEventType,
  WebhookStatus,
} from '@saas/shared';

@Injectable()
export class ApiService {
  constructor(private readonly prisma: PrismaService) {}

  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  // ==========================================================================
  // API KEYS
  // ==========================================================================

  async listApiKeys(tenantId: string): Promise<ApiKey[]> {
    const keys = await this.prisma.client.apiKey.findMany({ where: { tenantId, isDeleted: false }, orderBy: { createdAt: 'desc' } });
    return keys.map((k) => this.toKeyDto(k));
  }

  async createApiKey(tenantId: string, input: { name: string; scopes: ApiScope[]; expiresAt?: string }, userId?: string): Promise<{ apiKey: ApiKey; fullKey: string }> {
    if (!input.scopes || input.scopes.length === 0) throw new BadRequestException('En az 1 scope seçilmelidir');
    const random = randomBytes(24).toString('base64url');
    const fullKey = `saas_live_${random}`;
    const keyHash = this.hashSecret(fullKey);
    const keyPrefix = fullKey.slice(0, 16) + '...';
    const keyHint = fullKey.slice(-4);

    const created = await this.prisma.client.apiKey.create({
      data: {
        tenantId, name: input.name, keyHash, keyPrefix, keyHint,
        scopes: input.scopes,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdById: userId,
      },
    });
    return { apiKey: this.toKeyDto(created), fullKey };
  }

  async revokeApiKey(tenantId: string, id: string): Promise<ApiKey> {
    const k = await this.prisma.client.apiKey.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!k) throw new NotFoundException('API anahtarı bulunamadı');
    const updated = await this.prisma.client.apiKey.update({ where: { id }, data: { status: 'REVOKED' } });
    return this.toKeyDto(updated);
  }

  async deleteApiKey(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.apiKey.updateMany({ where: { id, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async listUsageLogs(tenantId: string, params: { page?: number; pageSize?: number; apiKeyId?: string; statusCode?: number }): Promise<PaginatedResponse<ApiKeyUsageLog>> {
    const { page = 1, pageSize = 50, apiKeyId, statusCode } = params;
    const where: any = { tenantId };
    if (apiKeyId) where.apiKeyId = apiKeyId;
    if (statusCode !== undefined) where.statusCode = statusCode;
    const [total, items] = await Promise.all([
      this.prisma.client.apiKeyUsageLog.count({ where }),
      this.prisma.client.apiKeyUsageLog.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
    ]);
    return {
      data: items.map((l) => ({
        id: l.id, tenantId: l.tenantId, apiKeyId: l.apiKeyId, endpoint: l.endpoint, method: l.method,
        statusCode: l.statusCode, duration: l.duration, ip: l.ip, userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  // ==========================================================================
  // WEBHOOKS
  // ==========================================================================

  async listWebhooks(tenantId: string): Promise<Webhook[]> {
    const ws = await this.prisma.client.webhook.findMany({ where: { tenantId, isDeleted: false }, orderBy: { createdAt: 'desc' } });
    return ws.map((w) => this.toWebhookDto(w));
  }

  async getWebhook(tenantId: string, id: string): Promise<Webhook> {
    const w = await this.prisma.client.webhook.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!w) throw new NotFoundException('Webhook bulunamadı');
    return this.toWebhookDto(w);
  }

  async createWebhook(tenantId: string, input: { name: string; url: string; events: WebhookEventType[] }, userId?: string): Promise<{ webhook: Webhook; secret: string }> {
    if (!input.events || input.events.length === 0) throw new BadRequestException('En az 1 olay seçilmelidir');
    if (!input.url.startsWith('https://')) throw new BadRequestException('URL https:// ile başlamalıdır');
    const secret = `whsec_${randomBytes(24).toString('base64url')}`;
    const secretHash = this.hashSecret(secret);
    const secretPrefix = secret.slice(0, 12) + '...';
    const created = await this.prisma.client.webhook.create({
      data: { tenantId, name: input.name, url: input.url, events: input.events, secretHash, secretPrefix, createdById: userId },
    });
    return { webhook: this.toWebhookDto(created), secret };
  }

  async updateWebhookStatus(tenantId: string, id: string, status: WebhookStatus): Promise<Webhook> {
    const w = await this.prisma.client.webhook.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!w) throw new NotFoundException('Webhook bulunamadı');
    const updated = await this.prisma.client.webhook.update({ where: { id }, data: { status } });
    return this.toWebhookDto(updated);
  }

  async deleteWebhook(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.webhook.updateMany({ where: { id, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async testWebhook(tenantId: string, id: string, payload: any): Promise<{ success: boolean; statusCode?: number; errorMessage?: string; duration: number }> {
    const w = await this.prisma.client.webhook.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!w) throw new NotFoundException('Webhook bulunamadı');

    const start = Date.now();
    let success = false, statusCode: number | undefined, errorMessage: string | undefined;
    try {
      const res = await fetch(w.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-SaaS-Event': 'test', 'X-Webhook-Id': w.id },
        body: JSON.stringify({ event: 'test', timestamp: new Date().toISOString(), data: payload ?? { message: 'Bu bir test webhook çağrısıdır' } }),
        signal: AbortSignal.timeout(10000),
      });
      statusCode = res.status;
      success = res.ok;
      if (!res.ok) errorMessage = `HTTP ${res.status}`;
    } catch (e: any) {
      errorMessage = e?.message ?? 'Bilinmeyen hata';
    }
    const duration = Date.now() - start;

    // Teslimat logla
    await this.prisma.client.webhookDelivery.create({
      data: {
        tenantId, webhookId: w.id, eventType: 'test',
        payload: { test: true, ...payload },
        responseStatus: statusCode ?? null, duration, status: success ? 'SUCCESS' : 'FAILED',
        errorMessage,
      },
    });

    // Webhook istatistiklerini güncelle
    await this.prisma.client.webhook.update({
      where: { id },
      data: {
        lastDeliveryAt: new Date(),
        lastDeliveryStatus: success ? 'SUCCESS' : 'FAILED',
        successCount: success ? { increment: 1 } : undefined,
        failureCount: success ? undefined : { increment: 1 },
      },
    });

    return { success, statusCode, errorMessage, duration };
  }

  async listDeliveries(tenantId: string, params: { webhookId?: string; status?: WebhookDeliveryStatus; eventType?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<WebhookDelivery>> {
    const { webhookId, status, eventType, page = 1, pageSize = 50 } = params;
    const where: any = { tenantId };
    if (webhookId) where.webhookId = webhookId;
    if (status) where.status = status;
    if (eventType) where.eventType = eventType;
    const [total, items] = await Promise.all([
      this.prisma.client.webhookDelivery.count({ where }),
      this.prisma.client.webhookDelivery.findMany({
        where, orderBy: { deliveredAt: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
    ]);
    return {
      data: items.map((d) => ({
        id: d.id, tenantId: d.tenantId, webhookId: d.webhookId, eventType: d.eventType as any,
        payload: d.payload as Record<string, any>, responseStatus: d.responseStatus, responseBody: d.responseBody,
        duration: d.duration, attempt: d.attempt, status: d.status as WebhookDeliveryStatus,
        errorMessage: d.errorMessage, deliveredAt: d.deliveredAt.toISOString(),
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private toKeyDto(k: any): ApiKey {
    return {
      id: k.id, tenantId: k.tenantId, name: k.name,
      keyPrefix: k.keyPrefix, keyHint: k.keyHint, scopes: k.scopes, status: k.status as ApiKeyStatus,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      createdById: k.createdById,
      createdAt: k.createdAt.toISOString(), updatedAt: k.updatedAt.toISOString(),
    };
  }

  private toWebhookDto(w: any): Webhook {
    return {
      id: w.id, tenantId: w.tenantId, name: w.name, url: w.url,
      events: w.events as WebhookEventType[], status: w.status as WebhookStatus,
      secretPrefix: w.secretPrefix,
      successCount: w.successCount, failureCount: w.failureCount,
      lastDeliveryAt: w.lastDeliveryAt?.toISOString() ?? null,
      lastDeliveryStatus: w.lastDeliveryStatus as WebhookDeliveryStatus | null,
      createdById: w.createdById,
      createdAt: w.createdAt.toISOString(), updatedAt: w.updatedAt.toISOString(),
    };
  }
}
