import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';

@Injectable()
export class HrPayrollParamService {
  private readonly logger = new Logger(HrPayrollParamService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tüm parametreleri listele.
   */
  async listParams(tenantId: string, year?: number) {
    const where: any = { tenantId, isActive: true };
    if (year) where.year = year;
    return this.prisma.client.hrPayrollParam.findMany({
      where,
      orderBy: [{ year: 'desc' }, { paramKey: 'asc' }],
    });
  }

  /**
   * Belirli bir yılın tüm parametrelerini getir (map olarak).
   */
  async getParamsByYear(tenantId: string, year: number) {
    const rows = await this.prisma.client.hrPayrollParam.findMany({
      where: { tenantId, year, isActive: true },
    });
    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.paramKey] = Number(r.paramValue); });
    return map;
  }

  /**
   * Parametre güncelle veya oluştur.
   */
  async upsertParam(tenantId: string, input: { year: number; paramKey: string; paramValue: number; description?: string }) {
    return this.prisma.client.hrPayrollParam.upsert({
      where: { tenantId_year_paramKey: { tenantId, year: input.year, paramKey: input.paramKey } },
      create: { tenantId, ...input },
      update: { paramValue: input.paramValue, description: input.description },
    });
  }

  /**
   * Birden fazla parametreyi toplu güncelle.
   */
  async bulkUpsert(tenantId: string, params: Array<{ year: number; paramKey: string; paramValue: number; description?: string }>) {
    const results = [];
    for (const p of params) {
      results.push(
        await this.prisma.client.hrPayrollParam.upsert({
          where: { tenantId_year_paramKey: { tenantId, year: p.year, paramKey: p.paramKey } },
          create: { tenantId, ...p },
          update: { paramValue: p.paramValue, description: p.description },
        }),
      );
    }
    return results;
  }

  /**
   * Yeni tenant için varsayılan parametreleri seed et.
   */
  async seedDefaults(tenantId: string, year: number) {
    const defaults = [
      { paramKey: 'min_wage', paramValue: 42600, description: 'Asgari ücret (brüt)' },
      { paramKey: 'sgk_employee_rate', paramValue: 0.14, description: 'SGK çalışan primi oranı' },
      { paramKey: 'sgk_employer_rate', paramValue: 0.155, description: 'SGK işveren payı oranı' },
      { paramKey: 'unemployment_employee_rate', paramValue: 0.01, description: 'İşsizlik sigortası çalışan' },
      { paramKey: 'unemployment_employer_rate', paramValue: 0.02, description: 'İşsizlik sigortası işveren' },
      { paramKey: 'agc_rate', paramValue: 0.15, description: 'AGCV kesinti oranı' },
      { paramKey: 'agc_exemption_limit', paramValue: 15000, description: 'AGCV istisna tutarı' },
      { paramKey: 'meal_allowance_daily', paramValue: 272, description: 'Yemek ücreti (günlük)' },
      { paramKey: 'transport_allowance_monthly', paramValue: 10000, description: 'Yol ücreti (aylık)' },
    ];
    return this.bulkUpsert(tenantId, defaults.map((d) => ({ ...d, year })));
  }
}