import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import { OFFBOARDING_TEMPLATE, ONBOARDING_TEMPLATE } from '@saas/shared';
import type { HrOnboardingChecklist, HrOffboardingChecklist, JwtPayload, HrOnboardingStatus, HrOnboardingItemStatus } from '@saas/shared';

@Injectable()
export class HrChecklistsService {
  private readonly logger = new Logger(HrChecklistsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // ONBOARDING
  // ==========================================================================

  /**
   * Personelin tüm onboarding süreçleri.
   */
  async listOnboardings(tenantId: string, params: { status?: HrOnboardingStatus; employeeId?: string }) {
    const where: any = { tenantId, isDeleted: false };
    if (params.status) where.status = params.status;
    if (params.employeeId) where.employeeId = params.employeeId;

    const rows = await this.prisma.client.hrOnboardingChecklist.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, employment: { select: { department: true } } } },
        _count: { select: { items: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return rows.map((r: any) => ({
      id: r.id,
      employeeId: r.employeeId,
      employee: {
        id: r.employee.id,
        fullName: `${r.employee.firstName} ${r.employee.lastName}`,
        employeeNo: r.employee.employeeNo,
        department: r.employee.employment?.department ?? null,
      },
      startDate: r.startDate.toISOString(),
      targetCompletionDate: r.targetCompletionDate?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
      status: r.status,
      notes: r.notes,
      itemCount: r._count.items,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Yeni onboarding süreci başlat.
   * Template'ten item'lar otomatik oluşturulur.
   */
  async startOnboarding(tenantId: string, input: {
    employeeId: string;
    startDate: string;
    targetCompletionDate?: string;
    notes?: string;
  }, user: JwtPayload): Promise<HrOnboardingChecklist> {
    // Personel var mı, zaten aktif onboarding var mı
    const employee = await this.prisma.client.hrEmployee.findFirst({
      where: { id: input.employeeId, tenantId, isDeleted: false },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    const existing = await this.prisma.client.hrOnboardingChecklist.findFirst({
      where: { tenantId, employeeId: input.employeeId, status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_DOCS'] } },
    });
    if (existing) {
      throw new BadRequestException('Bu personelin aktif onboarding süreci zaten var');
    }

    // Checklist + items atomik oluştur
    const checklist = await this.prisma.client.hrOnboardingChecklist.create({
      data: {
        tenantId,
        employeeId: input.employeeId,
        startDate: new Date(input.startDate),
        targetCompletionDate: input.targetCompletionDate ? new Date(input.targetCompletionDate) : null,
        status: 'IN_PROGRESS',
        notes: input.notes,
        createdBy: user.sub,
        items: {
          create: ONBOARDING_TEMPLATE.items.map((item) => ({
            tenantId,
            itemKey: item.itemKey,
            title: item.title,
            description: item.description,
            isRequired: item.isRequired,
            sortOrder: item.sortOrder,
            status: 'PENDING' as HrOnboardingItemStatus,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.auditLog(tenantId, user.sub, 'hr.onboarding.start', 'HrOnboardingChecklist', checklist.id, {
      employeeId: input.employeeId,
    });

    return this.toOnboardingDto(checklist, []);
  }

  /**
   * Checklist detayı.
   */
  async getOnboarding(tenantId: string, id: string): Promise<HrOnboardingChecklist> {
    const row = await this.prisma.client.hrOnboardingChecklist.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, employment: { select: { department: true } } } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Onboarding süreci bulunamadı');
    return this.toOnboardingDto(row, []);
  }

  /**
   * Checklist item durumunu güncelle.
   */
  async updateOnboardingItem(tenantId: string, checklistId: string, itemId: string, input: {
    status: HrOnboardingItemStatus;
    notes?: string;
    documentId?: string;
  }, user: JwtPayload): Promise<HrOnboardingChecklist> {
    const checklist = await this.prisma.client.hrOnboardingChecklist.findFirst({
      where: { id: checklistId, tenantId, isDeleted: false },
    });
    if (!checklist) throw new NotFoundException('Onboarding süreci bulunamadı');
    if (checklist.status === 'COMPLETED' || checklist.status === 'CANCELLED') {
      throw new BadRequestException('Tamamlanmış/işlemden kaldırılmış süreç güncellenemez');
    }

    const item = await this.prisma.client.hrOnboardingChecklistItem.findFirst({
      where: { id: itemId, tenantId, checklistId },
    });
    if (!item) throw new NotFoundException('Madde bulunamadı');

    const isCompleted = input.status === 'DONE' || input.status === 'NOT_APPLICABLE';
    await this.prisma.client.hrOnboardingChecklistItem.update({
      where: { id: itemId },
      data: {
        status: input.status,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedBy: isCompleted ? user.sub : null,
        notes: input.notes,
        documentId: input.documentId,
      },
    });

    // Checklist genel durumunu hesapla
    await this.recalcOnboardingStatus(tenantId, checklistId);

    return this.getOnboarding(tenantId, checklistId);
  }

  /**
   * Onboarding'i tamamla (tüm zorunlu maddeler DONE ise).
   */
  async completeOnboarding(tenantId: string, id: string, user: JwtPayload): Promise<HrOnboardingChecklist> {
    const checklist = await this.prisma.client.hrOnboardingChecklist.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { items: true },
    });
    if (!checklist) throw new NotFoundException('Onboarding bulunamadı');
    if (checklist.status === 'COMPLETED') return this.toOnboardingDto(checklist, []);

    const requiredPending = checklist.items.filter((i: any) => i.isRequired && !i.isCompleted);
    if (requiredPending.length > 0) {
      throw new BadRequestException(
        `Zorunlu ${requiredPending.length} madde tamamlanmamış. Önce onları işaretleyin.`,
      );
    }

    await this.prisma.client.hrOnboardingChecklist.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    await this.auditLog(tenantId, user.sub, 'hr.onboarding.complete', 'HrOnboardingChecklist', id, {});
    return this.getOnboarding(tenantId, id);
  }

  /**
   * Onboarding iptal.
   */
  async cancelOnboarding(tenantId: string, id: string, user: JwtPayload): Promise<HrOnboardingChecklist> {
    const checklist = await this.prisma.client.hrOnboardingChecklist.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!checklist) throw new NotFoundException('Onboarding bulunamadı');

    await this.prisma.client.hrOnboardingChecklist.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    await this.auditLog(tenantId, user.sub, 'hr.onboarding.cancel', 'HrOnboardingChecklist', id, {});
    return this.getOnboarding(tenantId, id);
  }

  // ==========================================================================
  // OFFBOARDING
  // ==========================================================================

  async listOffboardings(tenantId: string, params: { status?: HrOnboardingStatus; employeeId?: string }) {
    const where: any = { tenantId, isDeleted: false };
    if (params.status) where.status = params.status;
    if (params.employeeId) where.employeeId = params.employeeId;

    const rows = await this.prisma.client.hrOffboardingChecklist.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, employment: { select: { department: true } } } },
        _count: { select: { items: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return rows.map((r: any) => ({
      id: r.id,
      employeeId: r.employeeId,
      employee: {
        id: r.employee.id,
        fullName: `${r.employee.firstName} ${r.employee.lastName}`,
        employeeNo: r.employee.employeeNo,
        department: r.employee.employment?.department ?? null,
      },
      terminationDate: r.terminationDate.toISOString(),
      reason: r.reason,
      completedAt: r.completedAt?.toISOString() ?? null,
      status: r.status,
      itemCount: r._count.items,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async startOffboarding(tenantId: string, input: {
    employeeId: string;
    terminationDate: string;
    reason?: string;
    notes?: string;
  }, user: JwtPayload): Promise<HrOffboardingChecklist> {
    const employee = await this.prisma.client.hrEmployee.findFirst({
      where: { id: input.employeeId, tenantId, isDeleted: false },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    const existing = await this.prisma.client.hrOffboardingChecklist.findFirst({
      where: { tenantId, employeeId: input.employeeId, status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_DOCS'] } },
    });
    if (existing) {
      throw new BadRequestException('Bu personelin aktif offboarding süreci zaten var');
    }

    const checklist = await this.prisma.client.hrOffboardingChecklist.create({
      data: {
        tenantId,
        employeeId: input.employeeId,
        terminationDate: new Date(input.terminationDate),
        reason: input.reason,
        status: 'IN_PROGRESS',
        notes: input.notes,
        createdBy: user.sub,
        items: {
          create: OFFBOARDING_TEMPLATE.items.map((item) => ({
            tenantId,
            itemKey: item.itemKey,
            title: item.title,
            description: item.description,
            isRequired: item.isRequired,
            sortOrder: item.sortOrder,
            status: 'PENDING' as HrOnboardingItemStatus,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.auditLog(tenantId, user.sub, 'hr.offboarding.start', 'HrOffboardingChecklist', checklist.id, {
      employeeId: input.employeeId,
    });

    return this.toOffboardingDto(checklist);
  }

  async getOffboarding(tenantId: string, id: string): Promise<HrOffboardingChecklist> {
    const row = await this.prisma.client.hrOffboardingChecklist.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, employment: { select: { department: true } } } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Offboarding süreci bulunamadı');
    return this.toOffboardingDto(row);
  }

  async updateOffboardingItem(tenantId: string, checklistId: string, itemId: string, input: {
    status: HrOnboardingItemStatus;
    notes?: string;
    documentId?: string;
  }, user: JwtPayload): Promise<HrOffboardingChecklist> {
    const checklist = await this.prisma.client.hrOffboardingChecklist.findFirst({
      where: { id: checklistId, tenantId, isDeleted: false },
    });
    if (!checklist) throw new NotFoundException('Offboarding süreci bulunamadı');
    if (checklist.status === 'COMPLETED' || checklist.status === 'CANCELLED') {
      throw new BadRequestException('Tamamlanmış/işlemden kaldırılmış süreç güncellenemez');
    }

    const item = await this.prisma.client.hrOffboardingChecklistItem.findFirst({
      where: { id: itemId, tenantId, checklistId },
    });
    if (!item) throw new NotFoundException('Madde bulunamadı');

    const isCompleted = input.status === 'DONE' || input.status === 'NOT_APPLICABLE';
    await this.prisma.client.hrOffboardingChecklistItem.update({
      where: { id: itemId },
      data: {
        status: input.status,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedBy: isCompleted ? user.sub : null,
        notes: input.notes,
        documentId: input.documentId,
      },
    });

    await this.recalcOffboardingStatus(tenantId, checklistId);
    return this.getOffboarding(tenantId, checklistId);
  }

  async completeOffboarding(tenantId: string, id: string, user: JwtPayload): Promise<HrOffboardingChecklist> {
    const checklist = await this.prisma.client.hrOffboardingChecklist.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { items: true },
    });
    if (!checklist) throw new NotFoundException('Offboarding bulunamadı');

    const requiredPending = checklist.items.filter((i: any) => i.isRequired && !i.isCompleted);
    if (requiredPending.length > 0) {
      throw new BadRequestException(`Zorunlu ${requiredPending.length} madde tamamlanmamış`);
    }

    await this.prisma.client.hrOffboardingChecklist.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Personel status'ünü güncelle
    await this.prisma.client.hrEmployee.update({
      where: { id: checklist.employeeId },
      data: { status: 'TERMINATED' },
    });

    await this.auditLog(tenantId, user.sub, 'hr.offboarding.complete', 'HrOffboardingChecklist', id, {});
    return this.getOffboarding(tenantId, id);
  }

  async cancelOffboarding(tenantId: string, id: string, user: JwtPayload): Promise<HrOffboardingChecklist> {
    const checklist = await this.prisma.client.hrOffboardingChecklist.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!checklist) throw new NotFoundException('Offboarding bulunamadı');

    await this.prisma.client.hrOffboardingChecklist.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    await this.auditLog(tenantId, user.sub, 'hr.offboarding.cancel', 'HrOffboardingChecklist', id, {});
    return this.getOffboarding(tenantId, id);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private async recalcOnboardingStatus(tenantId: string, checklistId: string) {
    const items = await this.prisma.client.hrOnboardingChecklistItem.findMany({
      where: { tenantId, checklistId },
    });
    const requiredPending = items.filter((i: any) => i.isRequired && !i.isCompleted);
    const allDone = items.every((i: any) => i.isCompleted);

    let newStatus: HrOnboardingStatus = 'IN_PROGRESS';
    if (allDone) newStatus = 'PENDING_DOCS'; // tüm item'lar done ama henüz complete çağrılmadı
    else if (requiredPending.length > 0) newStatus = 'IN_PROGRESS';

    await this.prisma.client.hrOnboardingChecklist.update({
      where: { id: checklistId },
      data: { status: newStatus },
    });
  }

  private async recalcOffboardingStatus(tenantId: string, checklistId: string) {
    const items = await this.prisma.client.hrOffboardingChecklistItem.findMany({
      where: { tenantId, checklistId },
    });
    const allDone = items.every((i: any) => i.isCompleted);
    const newStatus: HrOnboardingStatus = allDone ? 'PENDING_DOCS' : 'IN_PROGRESS';
    await this.prisma.client.hrOffboardingChecklist.update({
      where: { id: checklistId },
      data: { status: newStatus },
    });
  }

  private computeProgress(items: any[]) {
    const total = items.length;
    const completed = items.filter((i) => i.isCompleted).length;
    const required = items.filter((i) => i.isRequired).length;
    const requiredCompleted = items.filter((i) => i.isRequired && i.isCompleted).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return {
      total,
      completed,
      required,
      requiredCompleted,
      percent,
      isReadyToComplete: required === requiredCompleted,
    };
  }

  private toOnboardingDto(row: any, _extra: any[]): HrOnboardingChecklist {
    return {
      id: row.id,
      employeeId: row.employeeId,
      employee: row.employee
        ? {
            id: row.employee.id,
            fullName: `${row.employee.firstName} ${row.employee.lastName}`,
            employeeNo: row.employee.employeeNo,
            department: row.employee.employment?.department ?? null,
          }
        : undefined,
      startDate: row.startDate.toISOString(),
      targetCompletionDate: row.targetCompletionDate?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      status: row.status,
      notes: row.notes,
      progress: this.computeProgress(row.items),
      items: (row.items ?? []).map((i: any) => ({
        id: i.id,
        itemKey: i.itemKey,
        title: i.title,
        description: i.description,
        isRequired: i.isRequired,
        isCompleted: i.isCompleted,
        completedAt: i.completedAt?.toISOString() ?? null,
        completedBy: i.completedBy,
        status: i.status,
        notes: i.notes,
        documentId: i.documentId,
        sortOrder: i.sortOrder,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toOffboardingDto(row: any): HrOffboardingChecklist {
    return {
      id: row.id,
      employeeId: row.employeeId,
      employee: row.employee
        ? {
            id: row.employee.id,
            fullName: `${row.employee.firstName} ${row.employee.lastName}`,
            employeeNo: row.employee.employeeNo,
            department: row.employee.employment?.department ?? null,
          }
        : undefined,
      terminationDate: row.terminationDate.toISOString(),
      reason: row.reason,
      completedAt: row.completedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      status: row.status,
      notes: row.notes,
      progress: this.computeProgress(row.items ?? []),
      items: (row.items ?? []).map((i: any) => ({
        id: i.id,
        itemKey: i.itemKey,
        title: i.title,
        description: i.description,
        isRequired: i.isRequired,
        isCompleted: i.isCompleted,
        completedAt: i.completedAt?.toISOString() ?? null,
        completedBy: i.completedBy,
        status: i.status,
        notes: i.notes,
        documentId: i.documentId,
        sortOrder: i.sortOrder,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async auditLog(tenantId: string, userId: string, event: string, resource: string, resourceId: string, metadata: any) {
    try {
      await (this.prisma.client as any).securityLog?.create?.({
        data: { tenantId, userId, event, resource, resourceId, metadata, createdAt: new Date() },
      });
    } catch (err) {
      this.logger.warn(`Audit log yazılamadı: ${(err as Error).message}`);
    }
  }
}
