import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { JwtPayload } from '@saas/shared';

@Injectable()
export class HrPunchService {
  private readonly logger = new Logger(HrPunchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Giriş-çıkış kaydı oluştur veya güncelle (upsert).
   */
  async upsertPunch(tenantId: string, input: {
    employeeId: string;
    punchDate: string;
    clockIn?: string;
    clockOut?: string;
    breakStart?: string;
    breakEnd?: string;
    status?: string;
    notes?: string;
  }, user: JwtPayload) {
    const punchDate = new Date(input.punchDate);

    // Saat farkı hesapla
    let totalHours = 0;
    let overtimeHours = 0;
    let lateMinutes = 0;
    let earlyMinutes = 0;

    if (input.clockIn && input.clockOut) {
      const inTime = new Date(input.clockIn);
      const outTime = new Date(input.clockOut);
      const diffMs = outTime.getTime() - inTime.getTime();
      totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

      // 8 saat üzeri mesai
      if (totalHours > 8) {
        overtimeHours = Number((totalHours - 8).toFixed(2));
        totalHours = 8;
      }

      // Geç kalma (9:00'dan sonra giriş)
      const startHour = 9;
      const inHour = inTime.getHours() + inTime.getMinutes() / 60;
      if (inHour > startHour) {
        lateMinutes = Math.round((inHour - startHour) * 60);
      }

      // Erken çıkış (18:00'den önce)
      const endHour = 18;
      const outHour = outTime.getHours() + outTime.getMinutes() / 60;
      if (outHour < endHour && !overtimeHours) {
        earlyMinutes = Math.round((endHour - outHour) * 60);
      }
    }

    const record = await this.prisma.client.hrPunchRecord.upsert({
      where: {
        tenantId_employeeId_punchDate: {
          tenantId,
          employeeId: input.employeeId,
          punchDate,
        },
      },
      create: {
        tenantId,
        employeeId: input.employeeId,
        punchDate,
        clockIn: input.clockIn ? new Date(input.clockIn) : null,
        clockOut: input.clockOut ? new Date(input.clockOut) : null,
        breakStart: input.breakStart ? new Date(input.breakStart) : null,
        breakEnd: input.breakEnd ? new Date(input.breakEnd) : null,
        totalHours,
        overtimeHours,
        lateMinutes,
        earlyMinutes,
        status: (input.status ?? 'CLOCKED_OUT') as any,
        notes: input.notes,
      },
      update: {
        clockIn: input.clockIn ? new Date(input.clockIn) : undefined,
        clockOut: input.clockOut ? new Date(input.clockOut) : undefined,
        breakStart: input.breakStart ? new Date(input.breakStart) : undefined,
        breakEnd: input.breakEnd ? new Date(input.breakEnd) : undefined,
        totalHours,
        overtimeHours,
        lateMinutes,
        earlyMinutes,
        status: input.status ? (input.status as any) : undefined,
        notes: input.notes,
      },
    });

    return this.toPunchDto(record);
  }

  /**
   * Günlük puantaj listesi (tüm personel).
   */
  async listPunchesByDate(tenantId: string, punchDate: string) {
    const date = new Date(punchDate);

    const rows = await this.prisma.client.hrPunchRecord.findMany({
      where: { tenantId, punchDate: date },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
      orderBy: { employee: { lastName: 'asc' } },
    });

    return rows.map((r) => this.toPunchDto(r as any));
  }

  /**
   * Personel puantaj özeti (dönem/gün bazlı).
   */
  async getEmployeePunchSummary(tenantId: string, employeeId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const rows = await this.prisma.client.hrPunchRecord.findMany({
      where: { tenantId, employeeId, punchDate: { gte: start, lte: end } },
      orderBy: { punchDate: 'asc' },
    });

    const totalHours = rows.reduce((s, r) => s + Number(r.totalHours), 0);
    const totalOvertime = rows.reduce((s, r) => s + Number(r.overtimeHours), 0);
    const totalLate = rows.reduce((s, r) => s + r.lateMinutes, 0);
    const totalEarly = rows.reduce((s, r) => s + r.earlyMinutes, 0);
    const absentDays = rows.filter((r) => r.status === 'ABSENT').length;
    const workedDays = rows.filter((r) => r.status !== 'ABSENT').length;

    return {
      employeeId,
      startDate,
      endDate,
      totalHours: Number(totalHours.toFixed(2)),
      totalOvertimeHours: Number(totalOvertime.toFixed(2)),
      totalLateMinutes: totalLate,
      totalEarlyMinutes: totalEarly,
      workedDays,
      absentDays,
      workingDays: rows.length,
      records: rows.map((r) => this.toPunchDto(r as any)),
    };
  }

  /**
   * Puantajı bordro kaydına senkronize et.
   * Belirtilen dönemdeki puantaj verilerini HrPayrollRecord'a aktarır.
   */
  async syncPunchToPayroll(tenantId: string, periodId: string, user: JwtPayload) {
    const period = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id: periodId, tenantId },
    });
    if (!period) throw new NotFoundException('Dönem bulunamadı');

    const punches = await this.prisma.client.hrPunchRecord.findMany({
      where: {
        tenantId,
        punchDate: { gte: period.startDate, lte: period.endDate },
      },
    });

    // Grupla: employeeId → toplam
    const grouped = new Map<string, { hours: number; overtime: number; late: number; early: number; days: number }>();
    for (const p of punches) {
      const key = p.employeeId;
      const cur = grouped.get(key) ?? { hours: 0, overtime: 0, late: 0, early: 0, days: 0 };
      grouped.set(key, {
        hours: cur.hours + Number(p.totalHours),
        overtime: cur.overtime + Number(p.overtimeHours),
        late: cur.late + p.lateMinutes,
        early: cur.early + p.earlyMinutes,
        days: cur.days + 1,
      });
    }

    const results = [];
    for (const [employeeId, data] of grouped) {
      const record = await this.prisma.client.hrPayrollRecord.findUnique({
        where: { tenantId_periodId_employeeId: { tenantId, periodId, employeeId } },
      });

      if (record) {
        results.push(
          await this.prisma.client.hrPayrollRecord.update({
            where: { id: record.id },
            data: {
              workingDays: data.days,
              overtimeHours: data.overtime,
              lateHours: data.late / 60,
            },
          }),
        );
      }
    }

    return { synced: results.length, periodId };
  }

  private toPunchDto(r: any): any {
    return {
      id: r.id,
      tenantId: r.tenantId,
      employeeId: r.employeeId,
      employee: r.employee ? { id: r.employee.id, fullName: `${r.employee.firstName} ${r.employee.lastName}`, employeeNo: r.employee.employeeNo } : undefined,
      punchDate: r.punchDate?.toISOString?.()?.split('T')[0] ?? r.punchDate,
      clockIn: r.clockIn?.toISOString() ?? null,
      clockOut: r.clockOut?.toISOString() ?? null,
      breakStart: r.breakStart?.toISOString() ?? null,
      breakEnd: r.breakEnd?.toISOString() ?? null,
      totalHours: Number(r.totalHours),
      overtimeHours: Number(r.overtimeHours),
      lateMinutes: r.lateMinutes,
      earlyMinutes: r.earlyMinutes,
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

@Injectable()
export class HrAdvanceService {
  private readonly logger = new Logger(HrAdvanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tüm avans taleplerini listele.
   */
  async listRequests(tenantId: string, params: { employeeId?: string; status?: string }) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status) where.status = params.status as any;

    const rows = await this.prisma.client.hrAdvanceRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
        repayments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r: any) => this.toDto(r));
  }

  /**
   * Yeni avans talebi oluştur.
   */
  async createRequest(tenantId: string, input: { employeeId: string; amount: number; reason?: string; notes?: string }, user: JwtPayload) {
    return this.prisma.client.hrAdvanceRequest.create({
      data: {
        tenantId,
        employeeId: input.employeeId,
        amount: input.amount,
        reason: input.reason,
        notes: input.notes,
        requestedBy: user.sub,
        status: 'PENDING',
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
    });
  }

  /**
   * Avans onayla → PAID.
   */
  async approveRequest(tenantId: string, id: string, user: JwtPayload) {
    return this.prisma.client.hrAdvanceRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.sub, approvedAt: new Date() },
    });
  }

  /**
   * Avans ödeme — PAID.
   */
  async markPaid(tenantId: string, id: string, input: { deductionMonth?: string }, user: JwtPayload) {
    return this.prisma.client.hrAdvanceRequest.update({
      where: { id },
      data: { status: 'PAID', paidBy: user.sub, paidAt: new Date(), deductionMonth: input.deductionMonth },
    });
  }

  /**
   * Avans reddet.
   */
  async rejectRequest(tenantId: string, id: string, user: JwtPayload) {
    return this.prisma.client.hrAdvanceRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: user.sub, approvedAt: new Date() },
    });
  }

  /**
   * Avansı bordro dönemine mahsup et (DEDUCTED).
   */
  async deductFromPayroll(tenantId: string, advanceId: string, periodId: string, user: JwtPayload) {
    const advance = await this.prisma.client.hrAdvanceRequest.findFirst({
      where: { id: advanceId, tenantId },
    });
    if (!advance) throw new NotFoundException('Avans bulunamadı');

    // Mahsup kaydı oluştur
    await this.prisma.client.hrAdvanceRepayment.create({
      data: { tenantId, advanceId, periodId, amount: advance.amount },
    });

    return this.prisma.client.hrAdvanceRequest.update({
      where: { id: advanceId },
      data: { status: 'DEDUCTED' },
    });
  }

  /**
   * Personelin aktif (ödenmemiş/mahsup edilmemiş) avans toplamı.
   */
  async getEmployeeActiveTotal(tenantId: string, employeeId: string) {
    const rows = await this.prisma.client.hrAdvanceRequest.findMany({
      where: { tenantId, employeeId, status: { in: ['APPROVED', 'PAID'] } },
      include: { repayments: true },
    });

    let total = 0;
    for (const r of rows) {
      const paid = r.repayments.reduce((s, rp) => s + Number(rp.amount), 0);
      total += Number(r.amount) - paid;
    }
    return { employeeId, activeTotal: total };
  }

  private toDto(r: any): any {
    return {
      id: r.id,
      tenantId: r.tenantId,
      employeeId: r.employeeId,
      employee: r.employee ? { id: r.employee.id, fullName: `${r.employee.firstName} ${r.employee.lastName}`, employeeNo: r.employee.employeeNo } : undefined,
      amount: Number(r.amount),
      reason: r.reason,
      status: r.status,
      requestedBy: r.requestedBy,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt?.toISOString() ?? null,
      paidAt: r.paidAt?.toISOString() ?? null,
      deductionMonth: r.deductionMonth,
      notes: r.notes,
      repayments: r.repayments.map((rp: any) => ({ id: rp.id, amount: Number(rp.amount), periodId: rp.periodId, createdAt: rp.createdAt.toISOString() })),
      createdAt: r.createdAt.toISOString(),
    };
  }
}