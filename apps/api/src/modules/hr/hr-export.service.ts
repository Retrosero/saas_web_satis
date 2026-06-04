import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import * as XLSX from 'xlsx';

@Injectable()
export class HrExportService {
  private readonly logger = new Logger(HrExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Belirtilen bordro dönemi için Excel export üret.
   * 4 sheet içerir:
   *  1. Puantaj Özeti
   *  2. İzin Özeti
   *  3. Avans Durumu
   *  4. Bordro Hazırlık
   */
  async exportPayrollPeriod(tenantId: string, periodId: string): Promise<{ buffer: Buffer; filename: string }> {
    const period = await this.prisma.client.hrPayrollPeriod.findFirst({
      where: { id: periodId, tenantId },
      include: { tenant: { select: { name: true } } },
    });
    if (!period) throw new NotFoundException('Bordro dönemi bulunamadı');

    const [punches, leaves, advances, records] = await Promise.all([
      this.getPunchSummary(tenantId, period.startDate, period.endDate),
      this.getLeaveSummary(tenantId, period.startDate, period.endDate),
      this.getAdvanceSummary(tenantId),
      this.prisma.client.hrPayrollRecord.findMany({
        where: { tenantId, periodId },
        include: {
          employee: { select: { firstName: true, lastName: true, employeeNo: true, identityNumber: true } },
          supplements: true,
        },
        orderBy: { employee: { lastName: 'asc' } },
      }),
    ]);

    const wb = XLSX.utils.book_new();

    // 1) Puantaj Özeti
    const punchSheet = XLSX.utils.json_to_sheet(
      punches.map((p) => ({
        'Personel No': p.employeeNo,
        'Ad Soyad': p.fullName,
        'Çalışma Günü': p.workingDays,
        'Devamsız Gün': p.absentDays,
        'Toplam Saat': p.totalHours,
        'Mesai Saat': p.totalOvertime,
        'Geç Kalma (dk)': p.totalLate,
        'Erken Çıkış (dk)': p.totalEarly,
      })),
    );
    XLSX.utils.book_append_sheet(wb, punchSheet, 'Puantaj');

    // 2) İzin Özeti
    const leaveSheet = XLSX.utils.json_to_sheet(
      leaves.map((l) => ({
        'Personel No': l.employeeNo,
        'Ad Soyad': l.fullName,
        'İzin Türü': l.leaveType,
        'Kullanılan Gün': l.usedDays,
        'Bekleyen Gün': l.pendingDays,
        'Kalan Gün': l.remainingDays,
      })),
    );
    XLSX.utils.book_append_sheet(wb, leaveSheet, 'İzinler');

    // 3) Avans Durumu
    const advanceSheet = XLSX.utils.json_to_sheet(
      advances.map((a) => ({
        'Personel No': a.employeeNo,
        'Ad Soyad': a.fullName,
        'Aktif Avans': a.activeTotal,
        'Ödenen': a.paidTotal,
        'Mahsup Edilen': a.deductedTotal,
      })),
    );
    XLSX.utils.book_append_sheet(wb, advanceSheet, 'Avanslar');

    // 4) Bordro Hazırlık — ana tablo
    const payrollSheet = XLSX.utils.json_to_sheet(
      records.map((r: any) => ({
        'Personel No': r.employee.employeeNo,
        'Ad Soyad': `${r.employee.firstName} ${r.employee.lastName}`,
        'TC Kimlik': r.employee.identityNumber ?? '',
        'Çalışma Günü': r.workingDays,
        'Devamsız Gün': r.absentDays,
        'Mesai Saat': Number(r.overtimeHours),
        'Brüt Ücret': Number(r.baseSalary),
        'Toplam Brüt': Number(r.grossPay),
        'SGK (Çalışan)': Number(r.sgkEmployee),
        'İşsizlik (Çalışan)': Number(r.unemploymentEmployee),
        'Gelir Vergisi': Number(r.incomeTax),
        'Net Ödeme': Number(r.netPay),
        'Durum': r.status,
      })),
    );
    XLSX.utils.book_append_sheet(wb, payrollSheet, 'Bordro');

    // Özet satır
    const totals = records.reduce(
      (acc: any, r: any) => {
        acc.gross += Number(r.grossPay);
        acc.net += Number(r.netPay);
        acc.sgk += Number(r.sgkEmployee);
        acc.tax += Number(r.incomeTax);
        return acc;
      },
      { gross: 0, net: 0, sgk: 0, tax: 0 },
    );

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['BORDRO ÖZETİ'],
      [],
      ['Dönem', `${period.year} - ${period.period}`],
      ['Dönem Tipi', period.periodType],
      ['Durum', period.status],
      ['Personel Sayısı', records.length],
      [],
      ['Toplam Brüt', totals.gross],
      ['Toplam SGK (Çalışan)', totals.sgk],
      ['Toplam Gelir Vergisi', totals.tax],
      ['Toplam Net Ödeme', totals.net],
      [],
      ['Üretim Tarihi', new Date().toLocaleString('tr-TR')],
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Özet');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `bordro-${period.year}-${period.period}-${period.id.slice(0, 8)}.xlsx`;

    return { buffer, filename };
  }

  // ── Yardımcı sorgular ────────────────────────────────────────────────

  private async getPunchSummary(tenantId: string, startDate: Date, endDate: Date) {
    const rows = await this.prisma.client.hrPunchRecord.findMany({
      where: { tenantId, punchDate: { gte: startDate, lte: endDate } },
      include: { employee: { select: { firstName: true, lastName: true, employeeNo: true } } },
    });

    const grouped = new Map<string, any>();
    for (const r of rows) {
      const key = r.employeeId;
      const cur = grouped.get(key) ?? {
        employeeId: r.employeeId,
        employeeNo: r.employee.employeeNo,
        fullName: `${r.employee.firstName} ${r.employee.lastName}`,
        workingDays: 0,
        absentDays: 0,
        totalHours: 0,
        totalOvertime: 0,
        totalLate: 0,
        totalEarly: 0,
      };
      cur.workingDays += 1;
      if (r.status === 'ABSENT') cur.absentDays += 1;
      cur.totalHours += Number(r.totalHours);
      cur.totalOvertime += Number(r.overtimeHours);
      cur.totalLate += r.lateMinutes;
      cur.totalEarly += r.earlyMinutes;
      grouped.set(key, cur);
    }
    return Array.from(grouped.values()).map((v) => ({
      ...v,
      totalHours: Number(v.totalHours.toFixed(2)),
      totalOvertime: Number(v.totalOvertime.toFixed(2)),
    }));
  }

  private async getLeaveSummary(tenantId: string, startDate: Date, endDate: Date) {
    const requests = await this.prisma.client.hrLeaveRequest.findMany({
      where: {
        tenantId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        status: { in: ['APPROVED', 'PENDING'] },
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeNo: true } },
        leaveType: { select: { name: true } },
      },
    });

    return requests.map((r: any) => ({
      employeeNo: r.employee.employeeNo,
      fullName: `${r.employee.firstName} ${r.employee.lastName}`,
      leaveType: r.leaveType.name,
      usedDays: r.status === 'APPROVED' ? Number(r.days) : 0,
      pendingDays: r.status === 'PENDING' ? Number(r.days) : 0,
      remainingDays: 0,
    }));
  }

  private async getAdvanceSummary(tenantId: string) {
    const rows = await this.prisma.client.hrAdvanceRequest.findMany({
      where: { tenantId },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeNo: true } },
        repayments: true,
      },
    });

    const grouped = new Map<string, any>();
    for (const r of rows) {
      const key = r.employeeId;
      const cur = grouped.get(key) ?? {
        employeeId: r.employeeId,
        employeeNo: r.employee.employeeNo,
        fullName: `${r.employee.firstName} ${r.employee.lastName}`,
        activeTotal: 0,
        paidTotal: 0,
        deductedTotal: 0,
      };
      if (r.status === 'APPROVED' || r.status === 'PENDING') cur.activeTotal += Number(r.amount);
      if (r.status === 'PAID') cur.paidTotal += Number(r.amount);
      if (r.status === 'DEDUCTED') cur.deductedTotal += Number(r.amount);
      grouped.set(key, cur);
    }
    return Array.from(grouped.values());
  }
}