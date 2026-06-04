import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import {
  ApprovalTriggerType,
  ApprovalMode,
  ApprovalStepType,
  ApprovalRequestStatus,
  ApprovalActionType,
  ApprovalPriority,
  ApprovalRule,
  ApprovalRequest,
  ApprovalStep,
  ApprovalAction,
  ApprovalStats,
  ApprovalCondition,
} from '@saas/shared';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== KURALLAR =====
  async listRules(tenantId: string, filters: { triggerType?: string; isActive?: boolean; search?: string }) {
    const where: any = { tenantId, isDeleted: false };
    if (filters.triggerType) where.triggerType = filters.triggerType;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    const rules = await this.prisma.client.approvalRule.findMany({ where, orderBy: { priority: 'asc' }, include: { steps: { orderBy: { stepOrder: 'asc' } } } });
    return rules.map((r) => this.toRuleDto(r));
  }

  async getRule(tenantId: string, id: string): Promise<ApprovalRule> {
    const r = await this.prisma.client.approvalRule.findFirst({ where: { id, tenantId, isDeleted: false }, include: { steps: { orderBy: { stepOrder: 'asc' } } } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    return this.toRuleDto(r);
  }

  async createRule(tenantId: string, input: { name: string; description?: string; triggerType: ApprovalTriggerType; moduleName?: string; conditions?: ApprovalCondition[]; mode?: ApprovalMode; amountField?: string; amountThreshold?: number; expiryHours?: number; isActive?: boolean; priority?: number; settings?: any; steps: any[] }, userId?: string): Promise<ApprovalRule> {
    if (!Object.values(ApprovalTriggerType).includes(input.triggerType)) throw new BadRequestException('Geçersiz trigger tipi');
    if (!input.steps || input.steps.length === 0) throw new BadRequestException('En az 1 adım gerekli');
    const r = await this.prisma.client.approvalRule.create({
      data: {
        tenantId, name: input.name, description: input.description, triggerType: input.triggerType, moduleName: input.moduleName,
        conditions: (input.conditions ?? []) as any, mode: input.mode ?? ApprovalMode.SEQUENTIAL,
        amountField: input.amountField, amountThreshold: input.amountThreshold, expiryHours: input.expiryHours ?? 72,
        isActive: input.isActive ?? true, priority: input.priority ?? 5, settings: (input.settings ?? {}) as any, createdById: userId,
        steps: { create: input.steps.map((s, i) => ({ stepOrder: s.stepOrder ?? i + 1, name: s.name, stepType: s.stepType, config: (s.config ?? {}) as any, requireAll: s.requireAll ?? false, minApprovals: s.minApprovals ?? 1, timeoutHours: s.timeoutHours, isOptional: s.isOptional ?? false, description: s.description })) },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    return this.toRuleDto(r);
  }

  async updateRule(tenantId: string, id: string, input: any): Promise<ApprovalRule> {
    const r = await this.prisma.client.approvalRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    const data: any = {};
    ['name', 'description', 'triggerType', 'moduleName', 'conditions', 'mode', 'amountField', 'amountThreshold', 'expiryHours', 'isActive', 'priority', 'settings'].forEach((k) => { if (input[k] !== undefined) data[k] = input[k]; });
    // Steps güncelleme ayrı
    if (input.steps) {
      await this.prisma.client.approvalStep.deleteMany({ where: { ruleId: id } });
      for (let i = 0; i < input.steps.length; i++) {
        const s = input.steps[i];
        await this.prisma.client.approvalStep.create({ data: { ruleId: id, stepOrder: s.stepOrder ?? i + 1, name: s.name, stepType: s.stepType, config: (s.config ?? {}) as any, requireAll: s.requireAll ?? false, minApprovals: s.minApprovals ?? 1, timeoutHours: s.timeoutHours, isOptional: s.isOptional ?? false, description: s.description } });
      }
    }
    const updated = await this.prisma.client.approvalRule.update({ where: { id }, data, include: { steps: { orderBy: { stepOrder: 'asc' } } } });
    return this.toRuleDto(updated);
  }

  async deleteRule(tenantId: string, id: string) {
    const r = await this.prisma.client.approvalRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    // Aktif bekleyen istekler var mı?
    const pending = await this.prisma.client.approvalRequest.count({ where: { ruleId: id, status: ApprovalRequestStatus.PENDING } });
    if (pending > 0) throw new BadRequestException(`${pending} bekleyen onay isteği var, kural silinemez`);
    await this.prisma.client.approvalRule.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), isActive: false } });
  }

  async toggleRule(tenantId: string, id: string): Promise<ApprovalRule> {
    const r = await this.prisma.client.approvalRule.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!r) throw new NotFoundException('Kural bulunamadı');
    const updated = await this.prisma.client.approvalRule.update({ where: { id }, data: { isActive: !r.isActive }, include: { steps: { orderBy: { stepOrder: 'asc' } } } });
    return this.toRuleDto(updated);
  }

  // ===== REQUEST TETİKLE =====
  async submitRequest(tenantId: string, input: { ruleId: string; entityType: string; entityId: string; entityNumber?: string; entityLabel: string; amount?: number; amountCurrency?: string; requesterId?: string; requesterName?: string; requesterData?: any; priority?: ApprovalPriority; metadata?: any }): Promise<ApprovalRequest> {
    const rule = await this.prisma.client.approvalRule.findFirst({ where: { id: input.ruleId, tenantId, isActive: true, isDeleted: false }, include: { steps: { orderBy: { stepOrder: 'asc' } } } });
    if (!rule) throw new NotFoundException('Aktif kural bulunamadı');
    if (rule.steps.length === 0) throw new BadRequestException('Kuralın adımı yok');

    // Amount threshold kontrolü
    if (rule.amountThreshold && input.amount !== undefined) {
      if (Number(input.amount) < Number(rule.amountThreshold)) {
        throw new BadRequestException(`Tutar (${input.amount}) eşiğin (${rule.amountThreshold}) altında — onay gerekmiyor`);
      }
    }

    const expiresAt = new Date(Date.now() + rule.expiryHours * 3600_000);
    const requester = input.requesterId ? await this.prisma.client.user.findUnique({ where: { id: input.requesterId } }) : null;
    const r = await this.prisma.client.approvalRequest.create({
      data: {
        tenantId, ruleId: rule.id, ruleName: rule.name, triggerType: rule.triggerType,
        entityType: input.entityType, entityId: input.entityId, entityNumber: input.entityNumber, entityLabel: input.entityLabel,
        amount: input.amount, amountCurrency: input.amountCurrency ?? 'TRY',
        requesterId: input.requesterId ?? 'system', requesterName: input.requesterName ?? requester?.fullName,
        requesterData: (input.requesterData ?? {}) as any, priority: input.priority ?? ApprovalPriority.NORMAL,
        status: ApprovalRequestStatus.PENDING, currentStep: 1, totalSteps: rule.steps.length,
        expiresAt, metadata: (input.metadata ?? {}) as any,
      },
    });
    await this.prisma.client.approvalRule.update({ where: { id: rule.id }, data: { triggerCount: { increment: 1 }, lastTriggeredAt: new Date() } });
    return this.toRequestDto(r, [], rule.steps[0]);
  }

  // ===== REQUEST LİSTELE =====
  async listRequests(tenantId: string, filters: { status?: string; ruleId?: string; triggerType?: string; requesterId?: string; assigneeId?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.ruleId) where.ruleId = filters.ruleId;
    if (filters.triggerType) where.triggerType = filters.triggerType;
    if (filters.requesterId) where.requesterId = filters.requesterId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.client.approvalRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.client.approvalRequest.count({ where }),
    ]);
    const enriched = await Promise.all(items.map(async (r) => {
      const actions = await this.prisma.client.approvalAction.findMany({ where: { requestId: r.id }, orderBy: { createdAt: 'asc' } });
      const steps = await this.prisma.client.approvalStep.findMany({ where: { ruleId: r.ruleId }, orderBy: { stepOrder: 'asc' } });
      const currentStepInfo = steps.find((s) => s.stepOrder === r.currentStep);
      return this.toRequestDto(r, actions, currentStepInfo);
    }));
    return { items: enriched, total, page, pageSize };
  }

  async getRequest(tenantId: string, id: string): Promise<ApprovalRequest> {
    const r = await this.prisma.client.approvalRequest.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('İstek bulunamadı');
    const actions = await this.prisma.client.approvalAction.findMany({ where: { requestId: r.id }, orderBy: { createdAt: 'asc' } });
    const steps = await this.prisma.client.approvalStep.findMany({ where: { ruleId: r.ruleId }, orderBy: { stepOrder: 'asc' } });
    const currentStepInfo = steps.find((s) => s.stepOrder === r.currentStep);
    return this.toRequestDto(r, actions, currentStepInfo);
  }

  async myPendingRequests(tenantId: string, userId: string): Promise<ApprovalRequest[]> {
    const requests = await this.prisma.client.approvalRequest.findMany({ where: { tenantId, status: ApprovalRequestStatus.PENDING }, orderBy: { createdAt: 'desc' } });
    const filtered: ApprovalRequest[] = [];
    for (const r of requests) {
      const steps = await this.prisma.client.approvalStep.findMany({ where: { ruleId: r.ruleId }, orderBy: { stepOrder: 'asc' } });
      const step = steps.find((s) => s.stepOrder === r.currentStep);
      if (step && (await this.isApprover(step, userId))) {
        const actions = await this.prisma.client.approvalAction.findMany({ where: { requestId: r.id }, orderBy: { createdAt: 'asc' } });
        filtered.push(await this.toRequestDto(r, actions, step));
      }
    }
    return filtered;
  }

  async myRequests(tenantId: string, userId: string): Promise<ApprovalRequest[]> {
    const items = await this.prisma.client.approvalRequest.findMany({ where: { tenantId, requesterId: userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    return Promise.all(items.map(async (r) => {
      const actions = await this.prisma.client.approvalAction.findMany({ where: { requestId: r.id }, orderBy: { createdAt: 'asc' } });
      const steps = await this.prisma.client.approvalStep.findMany({ where: { ruleId: r.ruleId }, orderBy: { stepOrder: 'asc' } });
      const currentStepInfo = steps.find((s) => s.stepOrder === r.currentStep);
      return this.toRequestDto(r, actions, currentStepInfo);
    }));
  }

  // ===== AKSİYON =====
  async act(tenantId: string, requestId: string, input: { actionType: ApprovalActionType; comment?: string; actorId: string; actorName?: string; actorRole?: string; delegatedToId?: string; delegatedToName?: string; attachments?: any[] }): Promise<ApprovalRequest> {
    const r = await this.prisma.client.approvalRequest.findFirst({ where: { id: requestId, tenantId } });
    if (!r) throw new NotFoundException('İstek bulunamadı');
    if (r.status !== ApprovalRequestStatus.PENDING) throw new BadRequestException('İstek zaten tamamlanmış');
    if (r.expiresAt && r.expiresAt < new Date()) {
      await this.prisma.client.approvalRequest.update({ where: { id: r.id }, data: { status: ApprovalRequestStatus.EXPIRED, expiredAt: new Date() } });
      throw new BadRequestException('İsteğin süresi dolmuş');
    }
    const steps = await this.prisma.client.approvalStep.findMany({ where: { ruleId: r.ruleId }, orderBy: { stepOrder: 'asc' } });
    const currentStep = steps.find((s) => s.stepOrder === r.currentStep);
    if (!currentStep) throw new BadRequestException('Aktif adım bulunamadı');

    // Yetki kontrolü
    const isApprover = await this.isApprover(currentStep, input.actorId);
    if (!isApprover) throw new ForbiddenException('Bu adımı onaylama yetkiniz yok');

    // Aynı kişi tekrar onaylayamaz
    const existing = await this.prisma.client.approvalAction.findFirst({ where: { requestId, stepId: currentStep.id, actorId: input.actorId, actionType: { in: [ApprovalActionType.APPROVED, ApprovalActionType.REJECTED] } } });
    if (existing) throw new BadRequestException('Bu adım için zaten karar verilmiş');

    // Aksiyonu kaydet
    await this.prisma.client.approvalAction.create({
      data: {
        requestId, stepId: currentStep.id, stepOrder: currentStep.stepOrder, stepName: currentStep.name,
        actionType: input.actionType, actorId: input.actorId, actorName: input.actorName, actorRole: input.actorRole,
        comment: input.comment, attachments: input.attachments ?? [],
        delegatedToId: input.delegatedToId, delegatedToName: input.delegatedToName,
      },
    });

    if (input.actionType === ApprovalActionType.REJECTED) {
      // RED → tüm istek reddedildi
      return this.getRequest(tenantId, requestId).then(async (req) => {
        await this.prisma.client.approvalRequest.update({ where: { id: requestId }, data: { status: ApprovalRequestStatus.REJECTED, rejectedAt: new Date(), finalComment: input.comment } });
        return this.getRequest(tenantId, requestId);
      });
    }

    if (input.actionType === ApprovalActionType.DELEGATED) {
      // Devir → sadece kayıt, durum aynı
      return this.getRequest(tenantId, requestId);
    }

    if (input.actionType === ApprovalActionType.COMMENTED || input.actionType === ApprovalActionType.RETURNED) {
      return this.getRequest(tenantId, requestId);
    }

    // APPROVED — adım tamamlandı mı?
    const rule = await this.prisma.client.approvalRule.findUnique({ where: { id: r.ruleId } });
    const mode = rule?.mode;
    if (mode === ApprovalMode.SEQUENTIAL || mode === ApprovalMode.UNANIMOUS) {
      // Sıradaki adıma geç
      const nextStepOrder = r.currentStep + 1;
      if (nextStepOrder > r.totalSteps) {
        // Tüm adımlar tamamlandı
        await this.prisma.client.approvalRequest.update({ where: { id: requestId }, data: { status: ApprovalRequestStatus.APPROVED, approvedAt: new Date(), finalComment: input.comment } });
      } else {
        await this.prisma.client.approvalRequest.update({ where: { id: requestId }, data: { currentStep: nextStepOrder } });
      }
    } else if (mode === ApprovalMode.PARALLEL) {
      // PARALEL: step.requireAll ise tüm adımlar onaylanmalı, değilse minApprovals kadar
      const stepActions = await this.prisma.client.approvalAction.count({ where: { requestId, stepId: currentStep.id, actionType: ApprovalActionType.APPROVED } });
      const isDone = currentStep.requireAll
        ? stepActions >= 1
        : stepActions >= currentStep.minApprovals;
      if (isDone) {
        const nextStepOrder = r.currentStep + 1;
        if (nextStepOrder > r.totalSteps) {
          await this.prisma.client.approvalRequest.update({ where: { id: requestId }, data: { status: ApprovalRequestStatus.APPROVED, approvedAt: new Date(), finalComment: input.comment } });
        } else {
          await this.prisma.client.approvalRequest.update({ where: { id: requestId }, data: { currentStep: nextStepOrder } });
        }
      }
    }
    return this.getRequest(tenantId, requestId);
  }

  async cancelRequest(tenantId: string, requestId: string, userId: string, comment?: string) {
    const r = await this.prisma.client.approvalRequest.findFirst({ where: { id: requestId, tenantId } });
    if (!r) throw new NotFoundException('İstek bulunamadı');
    if (r.requesterId !== userId) throw new ForbiddenException('Sadece talep eden iptal edebilir');
    if (r.status !== ApprovalRequestStatus.PENDING) throw new BadRequestException('Sadece bekleyen istekler iptal edilebilir');
    await this.prisma.client.approvalRequest.update({ where: { id: requestId }, data: { status: ApprovalRequestStatus.CANCELLED, cancelledAt: new Date(), finalComment: comment } });
    return this.getRequest(tenantId, requestId);
  }

  // ===== İSTATİSTİK =====
  async getStats(tenantId: string, filters: { from?: string; to?: string }): Promise<ApprovalStats> {
    const where: any = { tenantId };
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const [total, byStatus, byTrigger, byPriority, approvedWithTime] = await Promise.all([
      this.prisma.client.approvalRequest.count({ where }),
      this.prisma.client.approvalRequest.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.client.approvalRequest.groupBy({ by: ['triggerType'], where, _count: true }),
      this.prisma.client.approvalRequest.groupBy({ by: ['priority'], where, _count: true }),
      this.prisma.client.approvalRequest.findMany({ where: { ...where, status: ApprovalRequestStatus.APPROVED, approvedAt: { not: null } }, select: { createdAt: true, approvedAt: true } }),
    ]);
    const get = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
    const avgMs = approvedWithTime.length > 0 ? approvedWithTime.reduce((s, a) => s + (a.approvedAt!.getTime() - a.createdAt.getTime()), 0) / approvedWithTime.length : undefined;
    return {
      total,
      pending: get(ApprovalRequestStatus.PENDING),
      approved: get(ApprovalRequestStatus.APPROVED),
      rejected: get(ApprovalRequestStatus.REJECTED),
      expired: get(ApprovalRequestStatus.EXPIRED),
      cancelled: get(ApprovalRequestStatus.CANCELLED),
      avgApprovalTimeMs: avgMs,
      byTrigger: byTrigger.map((b) => ({ triggerType: b.triggerType as any, count: b._count })),
      byPriority: byPriority.map((b) => ({ priority: b.priority as any, count: b._count })),
    };
  }

  // ===== HELPERS =====
  private async isApprover(step: any, userId: string): Promise<boolean> {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId }, include: { userRoles: { include: { role: true } } } });
    if (!user) return false;
    if (step.stepType === ApprovalStepType.USER_BASED) {
      return step.config?.userId === userId;
    } else if (step.stepType === ApprovalStepType.ROLE_BASED) {
      const userRoleIds = user.userRoles.map((ur: any) => ur.roleId);
      const userRoleNames = user.userRoles.map((ur: any) => ur.role.name);
      const stepRoleIds = step.config?.roleIds ?? [];
      const stepRoleNames = step.config?.roleNames ?? [];
      return stepRoleIds.some((rid: string) => userRoleIds.includes(rid)) || stepRoleNames.some((n: string) => userRoleNames.includes(n));
    } else if (step.stepType === ApprovalStepType.SPECIFIC_USERS) {
      return ((step.config as any)?.userIds ?? []).includes(userId);
    } else if (step.stepType === ApprovalStepType.DYNAMIC_FIELD) {
      // Bu durumda context gerekir, burada basitçe userId ile eşleşmeyi kontrol etmiyoruz
      // Daha karmaşık senaryo — requesterData'dan dinamik alıcı çıkarılır
      return true; // Geniş kapsamlı — frontend'de requesterData ile kontrol
    }
    return false;
  }

  // ===== DTOs =====
  private toRuleDto(r: any): ApprovalRule {
    return {
      id: r.id, tenantId: r.tenantId, name: r.name, description: r.description, triggerType: r.triggerType, moduleName: r.moduleName,
      conditions: r.conditions, mode: r.mode, amountField: r.amountField, amountThreshold: r.amountThreshold ? Number(r.amountThreshold) : undefined,
      expiryHours: r.expiryHours, isActive: r.isActive, priority: r.priority, triggerCount: r.triggerCount,
      lastTriggeredAt: r.lastTriggeredAt?.toISOString(), settings: r.settings as any, steps: ((r.steps ?? []) as any[]).map((s: any) => this.toStepDto(s)),
      createdById: r.createdById, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
    };
  }

  private toStepDto(s: any): ApprovalStep {
    return { id: s.id, ruleId: s.ruleId, stepOrder: s.stepOrder, name: s.name, stepType: s.stepType, config: s.config, requireAll: s.requireAll, minApprovals: s.minApprovals, timeoutHours: s.timeoutHours, isOptional: s.isOptional, description: s.description };
  }

  private toRequestDto(r: any, actions: any[], currentStep: any): ApprovalRequest {
    return {
      id: r.id, tenantId: r.tenantId, ruleId: r.ruleId, ruleName: r.ruleName, triggerType: r.triggerType,
      entityType: r.entityType, entityId: r.entityId, entityNumber: r.entityNumber, entityLabel: r.entityLabel,
      amount: r.amount ? Number(r.amount) : undefined, amountCurrency: r.amountCurrency,
      requesterId: r.requesterId, requesterName: r.requesterName, requesterData: r.requesterData as any,
      priority: r.priority, status: r.status, currentStep: r.currentStep, totalSteps: r.totalSteps,
      approvedAt: r.approvedAt?.toISOString(), rejectedAt: r.rejectedAt?.toISOString(),
      cancelledAt: r.cancelledAt?.toISOString(), expiredAt: r.expiredAt?.toISOString(),
      expiresAt: r.expiresAt?.toISOString(), finalComment: r.finalComment, metadata: r.metadata as any,
      createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
      actions: actions.map((a) => this.toActionDto(a)),
      currentStepInfo: currentStep ? this.toStepDto(currentStep) : undefined,
    };
  }

  private toActionDto(a: any): ApprovalAction {
    return {
      id: a.id, requestId: a.requestId, stepId: a.stepId, stepOrder: a.stepOrder, stepName: a.stepName,
      actionType: a.actionType, actorId: a.actorId, actorName: a.actorName, actorRole: a.actorRole,
      comment: a.comment, attachments: a.attachments,
      delegatedToId: a.delegatedToId, delegatedToName: a.delegatedToName,
      createdAt: a.createdAt.toISOString(),
    };
  }
}
