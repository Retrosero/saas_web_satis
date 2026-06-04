import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { JwtPayload, PayrollPeriodType, PayrollPeriodStatus } from '@saas/shared';

@Injectable()
export class HrPayrollService {
  private readonly logger = new Logger(HrPayrollService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // PAYROLL PERIODS
  // ==========================================================================

  /**
   * Bordro dönemlerini listele.
   */
  async listPeriods(tenantId: string, params: { year?: number; status?: PayrollPeriodStatus; periodType?: PayrollPeriodType }) {
    const where: any = { tenantId, isDeleted: false };
    if (params.year) where.year = params.year;
    if (params.status) where.status = params.status as any;
    if (params.periodType) where.periodType = params.periodType as any;

    const rows = await this.prisma.client.hrPayrollPeriod.findMany({
      where,
      orderBy: [{ year: 'desc' }, { period: 'desc' }],
      include: {
        _count: { select: { records: true } },
      },
    });

    return rows.map((r) => this.toPeriodDto(r as any));
  }

  /**
   * Yeni bordro dönemi oluştur.
   */
  async createPeriod(tenantId: string, input: {
    year: number;
    period: number;
    periodType: PayrollPeriodType;
    startDate: string;
    endDate: string;
    notes?: string;
  }, user: JwtPayload) {
    // Benzer dönem kontrolü
    const exists = await this.prisma.client.hrPayrollPeriod.findUnique({
      where: {
        tenantId_year_period_periodType: {
          tenantId,
          year: input.year,
          period: input.period,
          periodType: input.periodType as any,
        },
      },
    });
    if (exists) throw new ConflictException('Bu dönem zaten tanımlı');

    return this.prisma.client.hrPayrollPeriod.create({
      data: {
        tenantId,
        year: input.year,
        period: input.period,
        periodType: input.periodType as any,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        notes: input.notes,
        
      },
    });
  }

  /**
   * Dönem detayı.
   */
  async getPeriod(tenantId: string, id: string) {
    const row = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        _count: { select: { records: true, supplements: true } },
      },
    });
    if (!row) throw new NotFoundException('Dönem bulunamadı');
    return this.toPeriodDto(row as any);
  }

  /**
   * Dönem güncelle.
   */
  async updatePeriod(tenantId: string, id: string, input: any) {
    const row = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!row) throw new NotFoundException('Dönem bulunamadı');
    return this.prisma.client.hrPayrollPeriod.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Dönemi onayla (REVİEW → CONFIRMED).
   */
  async confirmPeriod(tenantId: string, id: string, user: JwtPayload) {
    const row = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id, tenantId, isDeleted: false, status: { in: ['DRAFT', 'REVIEW'] } },
    });
    if (!row) throw new NotFoundException('Onaylanabilir dönem bulunamadı');
    return this.prisma.client.hrPayrollPeriod.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedBy: user.sub, confirmedAt: new Date() },
    });
  }

  /**
   * Dönemi dışa aktarıldı olarak işaretle (CONFIRMED → EXPORTED).
   */
  async exportPeriod(tenantId: string, id: string, user: JwtPayload) {
    const row = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id, tenantId, isDeleted: false, status: { in: ['DRAFT', 'REVIEW', 'CONFIRMED'] } },
    });
    if (!row) throw new NotFoundException('Dönem bulunamadı veya kapatılmış');

    // Toplamları hesapla
    const records = await this.prisma.client.hrPayrollRecord.findMany({
      where: { tenantId, periodId: id },
    });

    const totalGross = records.reduce((sum, r) => sum + Number(r.grossPay), 0);
    const totalNet = records.reduce((sum, r) => sum + Number(r.netPay), 0);

    return this.prisma.client.hrPayrollPeriod.update({
      where: { id },
      data: {
        status: 'EXPORTED',
        exportedBy: user.sub,
        exportedAt: new Date(),
        totalGross,
        totalNet,
        employeeCount: records.length,
      },
    });
  }

  /**
   * Dönemi kapat (EXPORTED → CLOSED).
   */
  async closePeriod(tenantId: string, id: string) {
    const row = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id, tenantId, isDeleted: false, status: { in: ['EXPORTED'] } },
    });
    if (!row) throw new NotFoundException('Kapatılabilir dönem bulunamadı');
    return this.prisma.client.hrPayrollPeriod.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  // ==========================================================================
  // PAYROLL RECORDS
  // ==========================================================================

  /**
   * Dönemin personel bordro satırlarını listele.
   */
  async listRecords(tenantId: string, params: { periodId: string; status?: string }) {
    const where: any = { tenantId, periodId: params.periodId };
    if (params.status) where.status = params.status as any;

    const rows = await this.prisma.client.hrPayrollRecord.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNo: true },
        },
        supplements: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((r) => this.toRecordDto(r as any));
  }

  /**
   * Bordro satırı oluştur veya güncelle (upsert).
   */
  async upsertRecord(tenantId: string, input: {
    periodId: string;
    employeeId: string;
    workingDays?: number;
    absentDays?: number;
    overtimeHours?: number;
    lateHours?: number;
    baseSalary?: number;
    grossPay?: number;
    sgkEmployee?: number;
    unemploymentEmployee?: number;
    incomeTax?: number;
    netPay?: number;
  }, user: JwtPayload) {
    // Dönem kontrolü
    const period = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id: input.periodId, tenantId, isDeleted: false, status: { in: ['DRAFT', 'REVIEW'] } },
    });
    if (!period) throw new BadRequestException('Bu dönemde veri girişi yapılamaz');

    const record = await this.prisma.client.hrPayrollRecord.upsert({
      where: {
        tenantId_periodId_employeeId: {
          tenantId,
          periodId: input.periodId,
          employeeId: input.employeeId,
        },
      },
      create: {
        tenantId,
        periodId: input.periodId,
        employeeId: input.employeeId,
        workingDays: input.workingDays ?? 0,
        absentDays: input.absentDays ?? 0,
        overtimeHours: input.overtimeHours ?? 0,
        lateHours: input.lateHours ?? 0,
        baseSalary: input.baseSalary ?? 0,
        grossPay: input.grossPay ?? 0,
        sgkEmployee: input.sgkEmployee ?? 0,
        unemploymentEmployee: input.unemploymentEmployee ?? 0,
        incomeTax: input.incomeTax ?? 0,
        netPay: input.netPay ?? 0,
        
      },
      update: {
        workingDays: input.workingDays ?? 0,
        absentDays: input.absentDays ?? 0,
        overtimeHours: input.overtimeHours ?? 0,
        lateHours: input.lateHours ?? 0,
        baseSalary: input.baseSalary ?? 0,
        grossPay: input.grossPay ?? 0,
        sgkEmployee: input.sgkEmployee ?? 0,
        unemploymentEmployee: input.unemploymentEmployee ?? 0,
        incomeTax: input.incomeTax ?? 0,
        netPay: input.netPay ?? 0,
        updatedBy: user.sub,
      },
      include: { employee: true },
    });

    return this.toRecordDto({ ...record, supplements: [] } as any);
  }

  /**
   * Bir dönemde tüm personeller için bordro satırı oluştur (otomatik veri girişi).
   * Aktif personelleri alır, mevcut ücretlerini baz alır.
   */
  async initializePeriodRecords(tenantId: string, periodId: string, user: JwtPayload) {
    const period = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id: periodId, tenantId, isDeleted: false },
    });
    if (!period) throw new NotFoundException('Dönem bulunamadı');

    const employees = await this.prisma.client.hrEmployee.findMany({
      where: { tenantId, status: 'ACTIVE', isDeleted: false },
      include: { employment: true },
    });

    const results = [];
    for (const emp of employees) {
      // Ücret bilgisi personnel tablosundan alınacak — şimdilik 0
      const baseSalary = 0;

      // Çalışma günü: dönemdeki iş günü sayısı (standart 30 - devamsızlık)
      const totalDays = Math.round(
        (new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
      const workingDays = totalDays; // başlangıçta tam çalışma

      const record = await this.prisma.client.hrPayrollRecord.upsert({
        where: {
          tenantId_periodId_employeeId: { tenantId, periodId, employeeId: emp.id },
        },
        create: {
          tenantId,
          periodId,
          employeeId: emp.id,
          workingDays,
          baseSalary,
          grossPay: baseSalary,
          netPay: baseSalary,
          
        },
        update: {},
      });
      results.push(record);
    }

    return { created: results.length };
  }

  // ==========================================================================
  // PAYROLL SUPPLEMENTS (EK KALEMLER)
  // ==========================================================================

  /**
   * Dönemdeki tüm ek kalemleri listele.
   */
  async listSupplements(tenantId: string, params: { periodId: string; employeeId?: string; type?: string }) {
    const where: any = { tenantId, periodId: params.periodId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.type) where.type = params.type as any;

    return this.prisma.client.hrPayrollSupplement.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Ek kalem ekle.
   */
  async addSupplement(tenantId: string, input: {
    periodId: string;
    employeeId: string;
    recordId?: string;
    type: string;
    name: string;
    amount: number;
    isDeduction?: boolean;
    notes?: string;
  }, user: JwtPayload) {
    return this.prisma.client.hrPayrollSupplement.create({
      data: {
        tenantId,
        periodId: input.periodId,
        employeeId: input.employeeId,
        recordId: input.recordId,
        type: input.type as any,
        name: input.name,
        amount: input.amount,
        isDeduction: input.isDeduction ?? false,
        notes: input.notes,
      },
    });
  }

  /**
   * Ek kalem sil.
   */
  async deleteSupplement(tenantId: string, id: string) {
    const row = await this.prisma.client.hrPayrollSupplement.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Kalem bulunamadı');
    return this.prisma.client.hrPayrollSupplement.delete({ where: { id } });
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private toPeriodDto(row: any): any {
    return {
      id: row.id,
      tenantId: row.tenantId,
      year: row.year,
      period: row.period,
      periodType: row.periodType,
      startDate: row.startDate?.toISOString?.() ?? row.startDate,
      endDate: row.endDate?.toISOString?.() ?? row.endDate,
      status: row.status,
      totalGross: row.totalGross ? Number(row.totalGross) : null,
      totalNet: row.totalNet ? Number(row.totalNet) : null,
      employeeCount: row._count?.records ?? row.employeeCount,
      confirmedBy: row.confirmedBy,
      confirmedAt: row.confirmedAt?.toISOString?.() ?? null,
      exportedBy: row.exportedBy,
      exportedAt: row.exportedAt?.toISOString?.() ?? null,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toRecordDto(row: any): any {
    return {
      id: row.id,
      tenantId: row.tenantId,
      periodId: row.periodId,
      employeeId: row.employeeId,
      employee: row.employee ? {
        id: row.employee.id,
        fullName: `${row.employee.firstName} ${row.employee.lastName}`,
        employeeNo: row.employee.employeeNo,
      } : undefined,
      workingDays: Number(row.workingDays),
      absentDays: Number(row.absentDays),
      overtimeHours: Number(row.overtimeHours),
      lateHours: Number(row.lateHours),
      baseSalary: Number(row.baseSalary),
      grossPay: Number(row.grossPay),
      sgkEmployee: Number(row.sgkEmployee),
      unemploymentEmployee: Number(row.unemploymentEmployee),
      incomeTax: Number(row.incomeTax),
      netPay: Number(row.netPay),
      status: row.status,
      exportedAt: row.exportedAt?.toISOString?.() ?? null,
      supplements: (row.supplements ?? []).map((s: any) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        amount: Number(s.amount),
        isDeduction: s.isDeduction,
        notes: s.notes,
      })),
      createdAt: row.createdAt.toISOString(),
    };
  }
}