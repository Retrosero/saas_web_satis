import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { WhiteLabelSettings } from '@saas/shared';
import { DEFAULT_WHITE_LABEL } from '@saas/shared';

@Injectable()
export class WhiteLabelService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string): Promise<WhiteLabelSettings> {
    const t = await this.prisma.client.tenant.findUnique({ where: { id: tenantId } });
    if (!t) return DEFAULT_WHITE_LABEL;
    return { ...DEFAULT_WHITE_LABEL, ...((t.whiteLabel as any) ?? {}) };
  }

  async updateSettings(tenantId: string, patch: Partial<WhiteLabelSettings>): Promise<WhiteLabelSettings> {
    const t = await this.prisma.client.tenant.findUnique({ where: { id: tenantId } });
    if (!t) throw new Error('Tenant bulunamadı');
    const current = (t.whiteLabel as any) ?? {};
    const merged = { ...DEFAULT_WHITE_LABEL, ...current, ...patch };
    await this.prisma.client.tenant.update({ where: { id: tenantId }, data: { whiteLabel: merged as any } });
    return merged;
  }

  async validateDomain(tenantId: string, domain: string): Promise<{ valid: boolean; dnsRecords: Array<{ type: string; host: string; value: string }>; message: string }> {
    // Production'da DNS lookup yapılır
    // Şimdilik static kayıt dön
    return {
      valid: false,
      message: 'Domain doğrulaması için aşağıdaki DNS kayıtlarını ekleyin. Doğrulama 24 saat içinde otomatik yapılacak.',
      dnsRecords: [
        { type: 'CNAME', host: domain, value: 'proxy.saas.local' },
        { type: 'TXT', host: `_saas-verify.${domain}`, value: `saas-verify-${tenantId}` },
      ],
    };
  }
}
