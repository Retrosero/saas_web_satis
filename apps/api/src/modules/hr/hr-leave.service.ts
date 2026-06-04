import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import { LEAVE_TYPE_DEFAULTS, calculateAnnualLeaveDays } from '@saas/shared';
import type { JwtPayload, HrLeaveTypeCode, HrLeaveRequestStatus } from '@saas/shared';

@Injectable()
export class HrLeaveService {
  private readonly logger = new Logger(HrLeaveService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // LEAVE TYPES
  // ==========================================================================

  /**
   * Tüm izin türlerini listele.
   */
  async listLeaveTypes(tenantId: string) {
    return this.prisma.client.hrLeaveType.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Yeni izin türü oluştur.
   */
  async createLeaveType(tenantId: string, input: any) {
    const exists = await this.prisma.client.hrLeaveType.findFirst({
      where: { tenantId, code: input.code as any, isActive: true },
    });
    if (exists) throw new ConflictException(`"${input.code}" kodlu izin türü zaten mevcut`);

    return this.prisma.client.hrLeaveType.create({
      data: { tenantId, ...input, code: input.code as any } as any,
    });
  }

  /**
   * İzin türü güncelle.
   */
  async updateLeaveType(tenantId: string, id: string, input: any) {
    const row = await this.prisma.client.hrLeaveType.findFirst({
      where: { id, tenantId, isActive: true },
    });
    if (!row) throw new NotFoundException('İzin türü bulunamadı');

    return this.prisma.client.hrLeaveType.update({
      where: { id },
      data: { ...input, code: input.code as any } as any,
    });
  }

  // ==========================================================================
  // LEAVE BALANCES
  // ==========================================================================

  /**
   * Bir personelin tüm yıllık bakiyelerini getir.
   */
  async getEmployeeBalances(tenantId: string, employeeId: string, year: number) {
    const rows = await this.prisma.client.hrLeaveBalance.findMany({
      where: { tenantId, employeeId, year },
      include: { leaveType: true },
    });

    return rows.map((r: any) => ({
      id: r.id,
      tenantId: r.tenantId,
      employeeId: r.employeeId,
      leaveTypeId: r.leaveTypeId,
      leaveType: {
        id: r.leaveType.id,
        name: r.leaveType.name,
        code: r.leaveType.code,
        color: r.leaveType.color,
        icon: r.leaveType.icon,
        isPaid: r.leaveType.isPaid,
      },
      year: r.year,
      entitledDays: Number(r.entitledDays),
      accruedDays: Number(r.accruedDays),
      usedDays: Number(r.usedDays),
      pendingDays: Number(r.pendingDays),
      carriedOverDays: r.carriedOverDays,
      availableDays: Number(r.accruedDays) + r.carriedOverDays - Number(r.usedDays) - Number(r.pendingDays),
      expiresAt: r.expiresAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Tüm personellerin bakiyelerini listele.
   */
  async listBalances(tenantId: string, params: { employeeId?: string; year?: number; leaveTypeId?: string }) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.year) where.year = params.year;
    if (params.leaveTypeId) where.leaveTypeId = params.leaveTypeId;

    const rows = await this.prisma.client.hrLeaveBalance.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
        leaveType: { select: { id: true, name: true, code: true, color: true, icon: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r: any) => ({
      id: r.id,
      employee: {
        id: r.employee.id,
        fullName: `${r.employee.firstName} ${r.employee.lastName}`,
        employeeNo: r.employee.employeeNo,
      },
      leaveType: r.leaveType,
      year: r.year,
      entitledDays: Number(r.entitledDays),
      accruedDays: Number(r.accruedDays),
      usedDays: Number(r.usedDays),
      pendingDays: Number(r.pendingDays),
      carriedOverDays: r.carriedOverDays,
      availableDays: Number(r.accruedDays) + r.carriedOverDays - Number(r.usedDays) - Number(r.pendingDays),
    }));
  }

  /**
   * Yıl başında tüm personeller için bakiye oluştur.
   * Kıdem yılına göre yıllık izin günü hesaplanır.
   */
  async initializeYearBalances(tenantId: string, year: number) {
    // Önce mevcut tüm aktif personeli al
    const employees = await this.prisma.client.hrEmployee.findMany({
      where: { tenantId, status: 'ACTIVE', isDeleted: false },
      include: { employment: true },
    });

    // Yıllık izin türünü bul
    const annualType = await this.prisma.client.hrLeaveType.findFirst({
      where: { tenantId, code: 'ANNUAL', isActive: true },
    });

    if (!annualType) {
      this.logger.warn('Yıllık izin türü bulunamadı, bakiye oluşturulamadı');
      return;
    }

    const results = [];
    for (const emp of employees) {
      const hireDate = emp.employment?.contractStartDate ?? emp.createdAt;
      const kidemYili = year - hireDate.getFullYear();
      const annualDays = calculateAnnualLeaveDays(kidemYili);

      // Mevcut bakiye var mı kontrol et
      const existing = await this.prisma.client.hrLeaveBalance.findUnique({
        where: {
          tenantId_employeeId_leaveTypeId_year: {
            tenantId,
            employeeId: emp.id,
            leaveTypeId: annualType.id,
            year,
          },
        },
      });

      if (existing) {
        // Yıl başında devir varsa (önceki yılın kullanılmayan günleri)
        const prevYear = year - 1;
        const prevBalance = await this.prisma.client.hrLeaveBalance.findUnique({
          where: { tenantId_employeeId_leaveTypeId_year: { tenantId, employeeId: emp.id, leaveTypeId: annualType.id, year: prevYear } },
        });

        let carriedOver = 0;
        if (prevBalance && annualType.canCarryOver) {
          const unused = Number(prevBalance.accruedDays) + prevBalance.carriedOverDays - Number(prevBalance.usedDays);
          carriedOver = Math.min(Math.max(unused, 0), annualType.carryOverDays);
        }

        results.push(
          await this.prisma.client.hrLeaveBalance.update({
            where: { id: existing.id },
            data: {
              entitledDays: annualDays,
              accruedDays: annualDays,
              carriedOverDays: carriedOver,
            },
          }),
        );
      } else {
        results.push(
          await this.prisma.client.hrLeaveBalance.create({
            data: {
              tenantId,
              employeeId: emp.id,
              leaveTypeId: annualType.id,
              year,
              entitledDays: annualDays,
              accruedDays: annualDays,
              usedDays: 0,
              pendingDays: 0,
              carriedOverDays: 0,
            },
          }),
        );
      }
    }

    return { created: results.length, year };
  }

  /**
   * Manuel bakiye düzeltme.
   */
  async adjustBalance(tenantId: string, input: {
    employeeId: string;
    leaveTypeId: string;
    year: number;
    adjustment: number;
    reason: string;
  }, user: JwtPayload) {
    // Düzeltme kaydı
    await this.prisma.client.hrLeaveAdjustment.create({
      data: {
        tenantId,
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        year: input.year,
        adjustment: input.adjustment,
        reason: input.reason,
        adjustedBy: user.sub,
      },
    });

    // Bakiyeyi güncelle
    const balance = await this.prisma.client.hrLeaveBalance.findUnique({
      where: {
        tenantId_employeeId_leaveTypeId_year: {
          tenantId,
          employeeId: input.employeeId,
          leaveTypeId: input.leaveTypeId,
          year: input.year,
        },
      },
    });

    if (balance) {
      return this.prisma.client.hrLeaveBalance.update({
        where: { id: balance.id },
        data: { accruedDays: { increment: input.adjustment } },
        include: { leaveType: true },
      });
    }

    // Bakiye yoksa oluştur
    return this.prisma.client.hrLeaveBalance.create({
      data: {
        tenantId,
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        year: input.year,
        entitledDays: input.adjustment,
        accruedDays: input.adjustment,
        usedDays: 0,
        pendingDays: 0,
        carriedOverDays: 0,
      },
    });
  }

  // ==========================================================================
  // LEAVE REQUESTS
  // ==========================================================================

  /**
   * Talepleri listele (filtre ile).
   */
  async listRequests(tenantId: string, params: {
    status?: HrLeaveRequestStatus;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    approverId?: string;
  }) {
    const where: any = { tenantId, isDeleted: false };
    if (params.status) where.status = params.status as any;
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.approverId) where.approverId = params.approverId;
    if (params.startDate || params.endDate) {
      where.startDate = {};
      if (params.startDate) where.startDate.gte = new Date(params.startDate);
      if (params.endDate) where.endDate.lte = new Date(params.endDate);
    }

    const rows = await this.prisma.client.hrLeaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, employment: { select: { department: true } } } },
        leaveType: true,
        approver: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r: any) => this.toRequestDto(r));
  }

  /**
   * Yeni izin talebi oluştur.
   */
  async createRequest(tenantId: string, input: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
    documentUrl?: string;
    replacementEmployeeId?: string;
  }, user: JwtPayload) {
    // Personel kontrolü
    const employee = await this.prisma.client.hrEmployee.findFirst({
      where: { id: input.employeeId, tenantId, isDeleted: false },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    // İzin türü kontrolü
    const leaveType = await this.prisma.client.hrLeaveType.findFirst({
      where: { id: input.leaveTypeId, tenantId, isActive: true },
    });
    if (!leaveType) throw new NotFoundException('İzin türü bulunamadı');

    // Tarih kontrolü
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (endDate < startDate) throw new BadRequestException('Bitiş tarihi başlangıçтан önce olamaz');

    // Çalışma günü hesapla
    const workingDays = this.calcWorkingDays(startDate, endDate);

    // Bakiye kontrolü (sınırsız değilse)
    if (leaveType.accrualMethod !== 'NONE') {
      const currentYear = startDate.getFullYear();
      const balance = await this.prisma.client.hrLeaveBalance.findUnique({
        where: {
          tenantId_employeeId_leaveTypeId_year: {
            tenantId,
            employeeId: input.employeeId,
            leaveTypeId: input.leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (!balance) throw new BadRequestException(`${leaveType.name} için bakiye bulunamadı`);

      const available = Number(balance.accruedDays) + balance.carriedOverDays - Number(balance.usedDays) - Number(balance.pendingDays);
      if (workingDays > available) {
        throw new BadRequestException(
          `Yetersiz bakiye. Kullanılabilir: ${available.toFixed(1)} gün, Talep: ${workingDays} gün`,
        );
      }
    }

    // Çakışma kontrolü (ayın aynı günleri için)
    const overlap = await this.prisma.client.hrLeaveRequest.findFirst({
      where: {
        tenantId,
        employeeId: input.employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        isDeleted: false,
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });
    if (overlap) throw new ConflictException('Bu tarih aralığında zaten bir izin talebi mevcut');

    // Talep oluştur
    const request = await this.prisma.client.hrLeaveRequest.create({
      data: {
        tenantId,
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        startDate,
        endDate,
        totalDays: workingDays,
        workingDays,
        reason: input.reason,
        documentUrl: input.documentUrl,
        replacementEmployeeId: input.replacementEmployeeId,
        status: leaveType.requiresApproval ? 'PENDING' : 'APPROVED',
        approverId: leaveType.requiresApproval ? null : user.sub,
        approvedAt: leaveType.requiresApproval ? null : new Date(),
        createdBy: user.sub,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        leaveType: true,
      },
    });

    // Bakiyeyi güncelle (pending'e rezerve et)
    if (leaveType.accrualMethod !== 'NONE') {
      const currentYear = startDate.getFullYear();
      const balance = await this.prisma.client.hrLeaveBalance.findUnique({
        where: {
          tenantId_employeeId_leaveTypeId_year: {
            tenantId,
            employeeId: input.employeeId,
            leaveTypeId: input.leaveTypeId,
            year: currentYear,
          },
        },
      });
      if (balance) {
        await this.prisma.client.hrLeaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { increment: workingDays } },
        });
      }

      // Personel durumunu izinli yap
      await this.prisma.client.hrEmployee.update({
        where: { id: input.employeeId },
        data: { status: 'ON_LEAVE' },
      });
    }

    await this.auditLog(tenantId, user.sub, 'hr.leave.request', 'HrLeaveRequest', request.id, {
      employeeId: input.employeeId,
      leaveType: leaveType.name,
      days: workingDays,
    });

    return this.toRequestDto({ ...request, approver: null });
  }

  /**
   * Talep detayı.
   */
  async getRequest(tenantId: string, id: string) {
    const row = await this.prisma.client.hrLeaveRequest.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, employment: { select: { department: true } } } },
        leaveType: true,
        approver: { select: { id: true, fullName: true } },
      },
    });
    if (!row) throw new NotFoundException('Talep bulunamadı');
    return this.toRequestDto(row);
  }

  /**
   * Talebi onayla.
   */
  async approveRequest(tenantId: string, id: string, user: JwtPayload) {
    const request = await this.prisma.client.hrLeaveRequest.findFirst({
      where: { id, tenantId, isDeleted: false, status: 'PENDING' },
    });
    if (!request) throw new NotFoundException('Bekleyen talep bulunamadı');

    const updated = await this.prisma.client.hrLeaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', approverId: user.sub, approvedAt: new Date() },
    });

    // Pending → used geçişi
    const currentYear = new Date(request.startDate).getFullYear();
    const balance = await this.prisma.client.hrLeaveBalance.findUnique({
      where: {
        tenantId_employeeId_leaveTypeId_year: {
          tenantId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: currentYear,
        },
      },
    });
    if (balance) {
      await this.prisma.client.hrLeaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: { decrement: Number(request.workingDays) },
          usedDays: { increment: Number(request.workingDays) },
        },
      });
    }

    await this.auditLog(tenantId, user.sub, 'hr.leave.approve', 'HrLeaveRequest', id, {});
    return this.getRequest(tenantId, id);
  }

  /**
   * Talebi reddet.
   */
  async rejectRequest(tenantId: string, id: string, input: { reason?: string }, user: JwtPayload) {
    const request = await this.prisma.client.hrLeaveRequest.findFirst({
      where: { id, tenantId, isDeleted: false, status: 'PENDING' },
    });
    if (!request) throw new NotFoundException('Bekleyen talep bulunamadı');

    const updated = await this.prisma.client.hrLeaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: input.reason, approverId: user.sub, rejectedAt: new Date() },
    });

    // Pending rezervasyonu kaldır
    const currentYear = new Date(request.startDate).getFullYear();
    const balance = await this.prisma.client.hrLeaveBalance.findUnique({
      where: {
        tenantId_employeeId_leaveTypeId_year: {
          tenantId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: currentYear,
        },
      },
    });
    if (balance) {
      await this.prisma.client.hrLeaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { decrement: Number(request.workingDays) } },
      });
    }

    await this.auditLog(tenantId, user.sub, 'hr.leave.reject', 'HrLeaveRequest', id, { reason: input.reason });
    return this.getRequest(tenantId, id);
  }

  /**
   * Talebi iptal et (personel kendisi veya yönetici).
   */
  async cancelRequest(tenantId: string, id: string, input: { reason?: string }, user: JwtPayload) {
    const request = await this.prisma.client.hrLeaveRequest.findFirst({
      where: { id, tenantId, isDeleted: false, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (!request) throw new NotFoundException('Talep bulunamadı veya zaten tamamlanmış');

    const updated = await this.prisma.client.hrLeaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED', cancellationReason: input.reason },
    });

    // Bakiye iadesi
    const currentYear = new Date(request.startDate).getFullYear();
    const balance = await this.prisma.client.hrLeaveBalance.findUnique({
      where: {
        tenantId_employeeId_leaveTypeId_year: {
          tenantId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: currentYear,
        },
      },
    });
    if (balance) {
      const adjustment = request.status === 'APPROVED'
        ? { usedDays: { decrement: Number(request.workingDays) } }
        : { pendingDays: { decrement: Number(request.workingDays) } };

      await this.prisma.client.hrLeaveBalance.update({
        where: { id: balance.id },
        data: adjustment,
      });

      // Personel durumunu aktif yap (başka aktif izin yoksa kontrol et)
      const otherActive = await this.prisma.client.hrLeaveRequest.findFirst({
        where: {
          tenantId,
          employeeId: request.employeeId,
          status: 'APPROVED',
          isDeleted: false,
          id: { not: id },
          OR: [
            { startDate: { lte: new Date() }, endDate: { gte: new Date() } },
          ],
        },
      });
      if (!otherActive) {
        await this.prisma.client.hrEmployee.update({
          where: { id: request.employeeId },
          data: { status: 'ACTIVE' },
        });
      }
    }

    await this.auditLog(tenantId, user.sub, 'hr.leave.cancel', 'HrLeaveRequest', id, { reason: input.reason });
    return this.getRequest(tenantId, id);
  }

  /**
   * Yeni tenant için varsayılan izin türlerini oluştur.
   */
  async seedLeaveTypes(tenantId: string) {
    for (const template of LEAVE_TYPE_DEFAULTS) {
      const exists = await this.prisma.client.hrLeaveType.findFirst({
        where: { tenantId, code: template.code as any },
      });
      if (!exists) {
        await this.prisma.client.hrLeaveType.create({
          data: { tenantId, ...template, code: template.code as any } as any,
        });
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Hafta sonu hariç çalışma günü hesapla.
   */
  private calcWorkingDays(start: Date, end: Date): number {
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  private toRequestDto(row: any): any {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      employee: row.employee ? {
        id: row.employee.id,
        fullName: `${row.employee.firstName} ${row.employee.lastName}`,
        employeeNo: row.employee.employeeNo,
        department: row.employee.employment?.department ?? null,
      } : undefined,
      leaveTypeId: row.leaveTypeId,
      leaveType: row.leaveType ? {
        id: row.leaveType.id,
        name: row.leaveType.name,
        code: row.leaveType.code,
        color: row.leaveType.color,
        icon: row.leaveType.icon,
        isPaid: row.leaveType.isPaid,
      } : undefined,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      totalDays: Number(row.totalDays),
      workingDays: Number(row.workingDays),
      reason: row.reason,
      status: row.status,
      approverId: row.approverId,
      approver: row.approver ? {
        id: row.approver.id,
        fullName: row.approver.fullName,
      } : undefined,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      rejectedAt: row.rejectedAt?.toISOString() ?? null,
      rejectionReason: row.rejectionReason,
      documentUrl: row.documentUrl,
      replacementEmployeeId: row.replacementEmployeeId,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
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