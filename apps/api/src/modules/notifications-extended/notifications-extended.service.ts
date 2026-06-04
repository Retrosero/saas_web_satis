import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import {
  NotificationTriggerType,
  NotificationChannelType,
  NotificationLogStatus,
  NotificationRecipientType,
  NotificationRule,
  NotificationChannel,
  NotificationLog,
  NotificationInbox,
} from '@saas/shared';

@Injectable()
export class NotificationsExtendedService {
  private readonly logger = new Logger(NotificationsExtendedService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== KANALLAR =====
  async listChannels(tenantId: string, filters: { type?: string; isActive?: boolean; search?: string }) {
    const where: any = { tenantId, isDeleted: false };
    if (filters.type) where.type = filters.type;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    const channels = await this.prisma.client.notificationChannel.findMany({ where, orderBy: { createdAt: 'desc' } });
    return channels.map((c) => this.toChannelDto(c));
  }

  async getChannel(tenantId: string, id: string): Promise<NotificationChannel> {
    const c = await this.prisma.client.notificationChannel.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!c) throw new NotFoundException('Kanal bulunamadı');
    return this.toChannelDto(c);
  }

  async createChannel(tenantId: string, input: { name: string; type: NotificationChannelType; description?: string; config?: any; isActive?: boolean; isDefault?: boolean }, userId?: string) {
    if (!Object.values(NotificationChannelType).includes(input.type)) throw new BadRequestException('Geçersiz kanal tipi');
    if (input.isDefault) {
      // Diğer default'ları kapat
      await this.prisma.client.notificationChannel.updateMany({ where: { tenantId, isDefault: true, isDeleted: false }, data: { isDefault: false } });
    }
    const c = await this.prisma.client.notificationChannel.create({ data: { tenantId, name: input.name, type: input.type, description: input.description, config: input.config ?? {}, isActive: input.isActive ?? true, isDefault: input.isDefault ?? false, createdById: userId } });
    return this.toChannelDto(c);
  }

  async updateChannel(tenantId: string, id: string, input: any): Promise<NotificationChannel> {
    const c = await this.prisma.client.notificationChannel.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!c) throw new NotFoundException('Kanal bulunamadı');
    if (input.isDefault === true) {
      await this.prisma.client.notificationChannel.updateMany({ where: { tenantId, isDefault: true, isDeleted: false, NOT: { id } }, data: { isDefault: false } });
    }
    const data: any = {};
    ['name', 'description', 'config', 'isActive', 'isDefault'].forEach((k) => { if (input[k] !== undefined) data[k] = input[k]; });
    const updated = await this.prisma.client.notificationChannel.update({ where: { id }, data });
    return this.toChannelDto(updated);
  }

  async deleteChannel(tenantId: string, id: string) {
    const c = await this.prisma.client.notificationChannel.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!c) throw new NotFoundException('Kanal bulunamadı');
    await this.prisma.client.notificationChannel.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), isActive: false } });
  }

  async testChannel(tenantId: string, id: string): Promise<{ status: 'OK' | 'FAILED'; message: string; durationMs: number }> {
    const c = await this.prisma.client.notificationChannel.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!c) throw new NotFoundException('Kanal bulunamadı');
    const start = Date.now();
    let status: 'OK' | 'FAILED' = 'OK';
    let message = 'Test başarılı';
    try {
      if (c.type === 'WEBHOOK') {
        const cfg = c.config as any;
        if (!cfg?.webhookUrl) throw new Error('Webhook URL tanımlı değil');
        const res = await fetch(cfg.webhookUrl, { method: cfg.webhookMethod ?? 'POST', headers: { 'Content-Type': 'application/json', ...(cfg.webhookHeaders ?? {}) }, body: JSON.stringify({ test: true, channel: c.name, timestamp: new Date().toISOString() }) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (c.type === 'EMAIL') {
        const cfg = c.config as any;
        if (!cfg?.smtpHost) throw new Error('SMTP host tanımlı değil');
        // SMTP bağlantısı simülasyonu — gerçek gönderim isteğe bağlı
        message = `SMTP ${cfg.smtpHost}:${cfg.smtpPort} bağlantı testi başarılı (simüle)`;
      } else if (c.type === 'SMS') {
        message = 'SMS sağlayıcı testi başarılı (simüle)';
      } else {
        message = 'Uygulama içi kanal test edildi';
      }
    } catch (e: any) {
      status = 'FAILED';
      message = e.message ?? 'Bilinmeyen hata';
    }
    const durationMs = Date.now() - start;
    await this.prisma.client.notificationChannel.update({ where: { id }, data: { testStatus: status, testAt: new Date(), testError: status === 'FAILED' ? message : null } });
    return { status, message, durationMs };
  }

  // ===== KURALLAR =====
  async listRules(tenantId: string, filters: { triggerType?: string; isActive?: boolean; search?: string }) {
    const where: any = { tenantId, isDeleted: false };
    if (filters.triggerType) where.triggerType = filters.triggerType;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    const rules = await this.prisma.client.notificationRule.findMany({ where, orderBy: { priority: 'asc' } });
    return rules.map((r) => this.toRuleDto(r));
  }

  async getRule(tenantId: string, id: string): Promise<NotificationRule> {
    const r = await this.prisma.client.notificationRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    return this.toRuleDto(r);
  }

  async createRule(tenantId: string, input: { name: string; description?: string; triggerType: NotificationTriggerType; conditions?: any[]; actions?: any[]; recipients?: any[]; channelIds?: string[]; priority?: number; isActive?: boolean; cooldownMinutes?: number; settings?: any }, userId?: string) {
    if (!Object.values(NotificationTriggerType).includes(input.triggerType)) throw new BadRequestException('Geçersiz trigger tipi');
    const r = await this.prisma.client.notificationRule.create({ data: { tenantId, name: input.name, description: input.description, triggerType: input.triggerType, conditions: input.conditions ?? [], actions: input.actions ?? [], recipients: input.recipients ?? [], channels: input.channelIds ?? [], priority: input.priority ?? 5, isActive: input.isActive ?? true, cooldownMinutes: input.cooldownMinutes ?? 0, settings: input.settings ?? {}, createdById: userId } });
    return this.toRuleDto(r);
  }

  async updateRule(tenantId: string, id: string, input: any): Promise<NotificationRule> {
    const r = await this.prisma.client.notificationRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    const data: any = {};
    ['name', 'description', 'triggerType', 'conditions', 'actions', 'recipients', 'channelIds', 'priority', 'isActive', 'cooldownMinutes', 'settings'].forEach((k) => { if (input[k] !== undefined) data[k === 'channelIds' ? 'channels' : k] = input[k]; });
    const updated = await this.prisma.client.notificationRule.update({ where: { id }, data });
    return this.toRuleDto(updated);
  }

  async deleteRule(tenantId: string, id: string) {
    const r = await this.prisma.client.notificationRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    await this.prisma.client.notificationRule.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), isActive: false } });
  }

  async toggleRule(tenantId: string, id: string): Promise<NotificationRule> {
    const r = await this.prisma.client.notificationRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    const updated = await this.prisma.client.notificationRule.update({ where: { id }, data: { isActive: !r.isActive } });
    return this.toRuleDto(updated);
  }

  async previewRule(tenantId: string, id: string, sampleData: Record<string, any>): Promise<{ renderedSubject?: string; renderedBody: string; matchedRecipients: number }> {
    const rule = await this.getRule(tenantId, id);
    // Şablon render
    const action = rule.actions[0];
    if (!action) return { renderedBody: 'Aksiyon tanımlı değil', matchedRecipients: 0 };
    const renderedBody = this.renderTemplate(action.template, sampleData);
    const renderedSubject = action.subject ? this.renderTemplate(action.subject, sampleData) : undefined;
    // Alıcı sayısı (basit)
    const matchedRecipients = await this.countRecipients(tenantId, rule.recipients, sampleData);
    return { renderedSubject, renderedBody, matchedRecipients };
  }

  // ===== TRIGGER & LOG =====
  async trigger(tenantId: string, triggerType: NotificationTriggerType, payload: Record<string, any>, sampleData?: Record<string, any>) {
    // Eşleşen aktif kuralları bul
    const rules = await this.prisma.client.notificationRule.findMany({ where: { tenantId, isDeleted: false, isActive: true, triggerType } });
    const data = sampleData ?? payload;
    const dispatched: any[] = [];
    for (const r of rules) {
      // Cooldown kontrolü
      if (r.cooldownMinutes > 0 && r.lastTriggeredAt) {
        const diff = Date.now() - r.lastTriggeredAt.getTime();
        if (diff < r.cooldownMinutes * 60_000) {
          this.logger.log(`Rule ${r.name} cooldown nedeniyle atlandı`);
          continue;
        }
      }
      // Condition kontrolü
      if (!(await this.matchConditions(r.conditions as any[], data))) continue;
      // Trigger count artır
      await this.prisma.client.notificationRule.update({ where: { id: r.id }, data: { triggerCount: { increment: 1 }, lastTriggeredAt: new Date() } });
      // Her aksiyon + kanal için log
      for (const action of (r.actions as any[])) {
        const subject = action.subject ? this.renderTemplate(action.subject, data) : undefined;
        const body = this.renderTemplate(action.template, data);
        // Recipient'ları resolve et
        const recipients = await this.resolveRecipients(tenantId, r.recipients as any[], data);
        for (const rcpt of recipients) {
          for (const channelId of (r.channels as string[])) {
            const log = await this.prisma.client.notificationLog.create({
              data: {
                tenantId, ruleId: r.id, channelId, triggerType,
                recipientType: rcpt.type, recipientId: rcpt.id, recipientName: rcpt.name, recipientContact: rcpt.contact,
                subject, body, payload: data, status: NotificationLogStatus.PENDING,
                metadata: { action: action.type },
              },
            });
            // Simüle gönderim (gerçek SMTP/SMS/Webhook servisi daha sonra entegre)
            const sent = await this.simulateSend(channelId, rcpt, subject, body);
            await this.prisma.client.notificationLog.update({
              where: { id: log.id },
              data: { status: sent.status, attempts: 1, sentAt: sent.status === NotificationLogStatus.SENT ? new Date() : null, failedAt: sent.status === NotificationLogStatus.FAILED ? new Date() : null, error: sent.error ?? null, durationMs: sent.durationMs, lastAttemptAt: new Date() },
            });
            dispatched.push({ ruleId: r.id, logId: log.id, status: sent.status });
          }
        }
      }
    }
    return { matchedRules: rules.length, dispatched };
  }

  async listLogs(tenantId: string, filters: { status?: string; ruleId?: string; channelId?: string; triggerType?: string; recipientId?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.ruleId) where.ruleId = filters.ruleId;
    if (filters.channelId) where.channelId = filters.channelId;
    if (filters.triggerType) where.triggerType = filters.triggerType;
    if (filters.recipientId) where.recipientId = filters.recipientId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const [logs, total] = await Promise.all([
      this.prisma.client.notificationLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.notificationLog.count({ where }),
    ]);
    const items = await Promise.all(logs.map(async (l) => this.toLogDto(l)));
    return { items, total, page, pageSize };
  }

  // ===== INBOX =====
  async listInbox(tenantId: string, userId: string, filters: { isRead?: boolean; category?: string; page?: number; pageSize?: number }): Promise<{ items: NotificationInbox[]; total: number; unread: number }> {
    const where: any = { tenantId, OR: [{ userId }, { userId: null }] };
    if (filters.isRead !== undefined) where.isRead = filters.isRead;
    if (filters.category) where.category = filters.category;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const [notifs, total, unread] = await Promise.all([
      this.prisma.client.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.notification.count({ where }),
      this.prisma.client.notification.count({ where: { tenantId, OR: [{ userId }, { userId: null }], isRead: false } }),
    ]);
    return { items: notifs as any, total, unread };
  }

  async markRead(tenantId: string, userId: string, ids: string[]) {
    await this.prisma.client.notification.updateMany({ where: { tenantId, OR: [{ userId }, { userId: null }], id: { in: ids } }, data: { isRead: true, readAt: new Date() } });
  }

  async markAllRead(tenantId: string, userId: string) {
    await this.prisma.client.notification.updateMany({ where: { tenantId, OR: [{ userId }, { userId: null }], isRead: false }, data: { isRead: true, readAt: new Date() } });
  }

  // ===== HELPERS =====
  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const parts = key.split('.');
      let val: any = data;
      for (const p of parts) { if (val == null) return `{{${key}}}`; val = val[p]; }
      return val == null ? `{{${key}}}` : String(val);
    });
  }

  private async matchConditions(conditions: any[], data: Record<string, any>): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;
    let result = true;
    let prevOp: 'AND' | 'OR' = 'AND';
    for (const cond of conditions) {
      const val = this.resolveField(cond.field, data);
      const matched = this.evalCondition(val, cond.operator, cond.value);
      if (prevOp === 'AND') result = result && matched;
      else result = result || matched;
      prevOp = cond.joinWith ?? 'AND';
    }
    return result;
  }

  private resolveField(field: string, data: Record<string, any>): any {
    const parts = field.split('.');
    let val: any = data;
    for (const p of parts) { if (val == null) return undefined; val = val[p]; }
    return val;
  }

  private evalCondition(val: any, op: string, target: any): boolean {
    if (val == null) return false;
    switch (op) {
      case 'EQUALS': return val === target;
      case 'NOT_EQUALS': return val !== target;
      case 'GREATER_THAN': return Number(val) > Number(target);
      case 'LESS_THAN': return Number(val) < Number(target);
      case 'GREATER_OR_EQUAL': return Number(val) >= Number(target);
      case 'LESS_OR_EQUAL': return Number(val) <= Number(target);
      case 'CONTAINS': return String(val).toLowerCase().includes(String(target).toLowerCase());
      case 'IN': return Array.isArray(target) ? target.includes(val) : false;
      case 'BETWEEN': return Array.isArray(target) && target.length === 2 ? Number(val) >= Number(target[0]) && Number(val) <= Number(target[1]) : false;
      default: return false;
    }
  }

  private async countRecipients(tenantId: string, recipients: any[], data: Record<string, any>): Promise<number> {
    const result = await this.resolveRecipients(tenantId, recipients, data);
    return result.length;
  }

  private async resolveRecipients(tenantId: string, recipients: any[], data: Record<string, any>): Promise<Array<{ type: NotificationRecipientType; id?: string; name?: string; contact?: string }>> {
    const result: any[] = [];
    for (const r of recipients) {
      if (r.type === NotificationRecipientType.ALL_TENANT_USERS) {
        const users = await this.prisma.client.user.findMany({ where: { tenantId, isActive: true, isDeleted: false } });
        for (const u of users) result.push({ type: r.type, id: u.id, name: u.fullName ?? u.email, contact: u.email });
      } else if (r.type === NotificationRecipientType.ROLE) {
        const users = await this.prisma.client.user.findMany({ where: { tenantId, userRoles: { some: { roleId: { in: r.roleIds ?? [] } } }, isActive: true, isDeleted: false } });
        for (const u of users) result.push({ type: r.type, id: u.id, name: u.fullName ?? u.email, contact: u.email });
      } else if (r.type === NotificationRecipientType.SPECIFIC_USERS) {
        const users = await this.prisma.client.user.findMany({ where: { id: { in: r.targetIds ?? [] }, tenantId } });
        for (const u of users) result.push({ type: r.type, id: u.id, name: u.fullName ?? u.email, contact: u.email });
      } else if (r.type === NotificationRecipientType.SALESPERSON) {
        if (r.fieldRef) {
          const userId = this.resolveField(r.fieldRef, data);
          if (userId) {
            const u = await this.prisma.client.user.findFirst({ where: { id: userId, tenantId } });
            if (u) result.push({ type: r.type, id: u.id, name: u.fullName ?? u.email, contact: u.email });
          }
        }
      } else if (r.type === NotificationRecipientType.CUSTOMER) {
        if (r.fieldRef) {
          const custId = this.resolveField(r.fieldRef, data);
          if (custId) {
            const c = await this.prisma.client.customer.findFirst({ where: { id: custId, tenantId } });
            if (c) result.push({ type: r.type, id: c.id, name: c.name, contact: (c as any).email ?? (c as any).phone });
          }
        }
      }
    }
    return result;
  }

  private async simulateSend(channelId: string, recipient: any, subject: string | undefined, body: string): Promise<{ status: NotificationLogStatus; error?: string; durationMs: number }> {
    const start = Date.now();
    const channel = await this.prisma.client.notificationChannel.findUnique({ where: { id: channelId } });
    if (!channel) return { status: NotificationLogStatus.FAILED, error: 'Kanal bulunamadı', durationMs: Date.now() - start };
    if (!channel.isActive) return { status: NotificationLogStatus.CANCELLED, error: 'Kanal pasif', durationMs: Date.now() - start };
    // Simüle: %90 başarı
    await new Promise((r) => setTimeout(r, 50));
    const success = Math.random() < 0.9;
    return { status: success ? NotificationLogStatus.SENT : NotificationLogStatus.FAILED, error: success ? undefined : 'SMTP timeout (simüle)', durationMs: Date.now() - start };
  }

  // ===== DTOs =====
  private toChannelDto(c: any): NotificationChannel {
    return { id: c.id, tenantId: c.tenantId, name: c.name, type: c.type, description: c.description, config: c.config, isActive: c.isActive, isDefault: c.isDefault, testStatus: c.testStatus, testAt: c.testAt?.toISOString(), testError: c.testError, createdById: c.createdById, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
  }

  private toRuleDto(r: any): NotificationRule {
    return { id: r.id, tenantId: r.tenantId, name: r.name, description: r.description, triggerType: r.triggerType, conditions: r.conditions, actions: r.actions, recipients: r.recipients, channelIds: r.channels, priority: r.priority, isActive: r.isActive, cooldownMinutes: r.cooldownMinutes, lastTriggeredAt: r.lastTriggeredAt?.toISOString(), triggerCount: r.triggerCount, settings: r.settings, createdById: r.createdById, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
  }

  private async toLogDto(l: any): Promise<NotificationLog> {
    let ruleName: string | undefined; let channelName: string | undefined; let channelType: NotificationChannelType | undefined;
    if (l.ruleId) { const r = await this.prisma.client.notificationRule.findUnique({ where: { id: l.ruleId } }); ruleName = r?.name; }
    if (l.channelId) { const c = await this.prisma.client.notificationChannel.findUnique({ where: { id: l.channelId } }); channelName = c?.name; channelType = c?.type as any; }
    return { id: l.id, tenantId: l.tenantId, ruleId: l.ruleId, ruleName, channelId: l.channelId, channelName, channelType, triggerType: l.triggerType, recipientType: l.recipientType, recipientId: l.recipientId, recipientName: l.recipientName, recipientContact: l.recipientContact, subject: l.subject, body: l.body, payload: l.payload, status: l.status, attempts: l.attempts, lastAttemptAt: l.lastAttemptAt?.toISOString(), sentAt: l.sentAt?.toISOString(), failedAt: l.failedAt?.toISOString(), error: l.error, durationMs: l.durationMs, createdAt: l.createdAt.toISOString() };
  }
}
