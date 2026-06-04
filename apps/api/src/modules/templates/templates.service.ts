import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { DocumentTemplate, DocumentType, PageFormat, TemplateSection } from '@saas/shared';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplates(tenantId: string, params: { documentType?: DocumentType; isActive?: boolean }): Promise<DocumentTemplate[]> {
    const where: any = { isDeleted: false, OR: [{ tenantId }, { tenantId: null }] };
    if (params.documentType) where.documentType = params.documentType;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    const ts = await this.prisma.client.documentTemplate.findMany({ where, orderBy: [{ documentType: 'asc' }, { name: 'asc' }] });
    return ts.map((t) => this.toDto(t));
  }

  async getTemplate(tenantId: string, id: string): Promise<DocumentTemplate> {
    const t = await this.prisma.client.documentTemplate.findFirst({ where: { id, isDeleted: false } });
    if (!t) throw new NotFoundException('Şablon bulunamadı');
    return this.toDto(t);
  }

  async createTemplate(tenantId: string | null, input: { name: string; documentType: DocumentType; language?: string; pageFormat?: PageFormat; customWidth?: number; customHeight?: number; sections: TemplateSection[]; isDefault?: boolean; isActive?: boolean }, userId?: string): Promise<DocumentTemplate> {
    if (!input.sections || !Array.isArray(input.sections)) throw new BadRequestException('Bölümler gerekli');
    if (input.isDefault) {
      await this.prisma.client.documentTemplate.updateMany({ where: { documentType: input.documentType, tenantId, isDefault: true }, data: { isDefault: false } });
    }
    const t = await this.prisma.client.documentTemplate.create({
      data: {
        tenantId, name: input.name, documentType: input.documentType,
        language: input.language ?? 'tr', pageFormat: input.pageFormat ?? 'A4_PORTRAIT',
        customWidth: input.customWidth, customHeight: input.customHeight,
        isDefault: input.isDefault ?? false, isActive: input.isActive ?? true,
        sections: input.sections as any,
        createdById: userId,
      },
    });
    return this.toDto(t);
  }

  async updateTemplate(tenantId: string, id: string, input: Partial<{ name: string; language: string; pageFormat: PageFormat; customWidth: number; customHeight: number; sections: TemplateSection[]; isDefault: boolean; isActive: boolean }>): Promise<DocumentTemplate> {
    const t = await this.prisma.client.documentTemplate.findFirst({ where: { id, isDeleted: false } });
    if (!t) throw new NotFoundException('Şablon bulunamadı');
    if (input.isDefault) {
      await this.prisma.client.documentTemplate.updateMany({ where: { documentType: t.documentType, tenantId, isDefault: true, NOT: { id } }, data: { isDefault: false } });
    }
    const updated = await this.prisma.client.documentTemplate.update({
      where: { id },
      data: { ...input, sections: input.sections as any },
    });
    return this.toDto(updated);
  }

  async deleteTemplate(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.documentTemplate.updateMany({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async setDefault(tenantId: string, id: string): Promise<DocumentTemplate> {
    const t = await this.prisma.client.documentTemplate.findFirst({ where: { id, isDeleted: false } });
    if (!t) throw new NotFoundException('Şablon bulunamadı');
    await this.prisma.client.documentTemplate.updateMany({ where: { documentType: t.documentType, tenantId: t.tenantId, isDefault: true }, data: { isDefault: false } });
    const updated = await this.prisma.client.documentTemplate.update({ where: { id }, data: { isDefault: true } });
    return this.toDto(updated);
  }

  async duplicateTemplate(tenantId: string, id: string, userId?: string): Promise<DocumentTemplate> {
    const t = await this.prisma.client.documentTemplate.findFirst({ where: { id, isDeleted: false } });
    if (!t) throw new NotFoundException('Şablon bulunamadı');
    const newName = `${t.name} (Kopya)`;
    return this.createTemplate(tenantId, {
      name: newName, documentType: t.documentType as DocumentType, language: t.language,
      pageFormat: t.pageFormat as PageFormat, customWidth: t.customWidth ?? undefined, customHeight: t.customHeight ?? undefined,
      sections: t.sections as any, isDefault: false, isActive: t.isActive,
    }, userId);
  }

  private toDto(t: any): DocumentTemplate {
    return {
      id: t.id, tenantId: t.tenantId, name: t.name, documentType: t.documentType as DocumentType,
      language: t.language, pageFormat: t.pageFormat as PageFormat,
      customWidth: t.customWidth, customHeight: t.customHeight,
      isDefault: t.isDefault, isActive: t.isActive,
      sections: (t.sections as any) ?? [],
      isDeleted: t.isDeleted, createdById: t.createdById,
      createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
    };
  }
}
