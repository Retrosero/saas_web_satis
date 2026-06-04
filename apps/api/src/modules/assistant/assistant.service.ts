import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type {
  AssistantTool,
  AssistantToolStatus,
  HelpArticle,
  HelpContentType,
  PaginatedResponse,
} from '@saas/shared';

@Injectable()
export class AssistantService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // HELP ARTICLES (KB)
  // ==========================================================================

  async listArticles(tenantId: string, params: { search?: string; module?: string; contentType?: HelpContentType; status?: 'ACTIVE' | 'PASSIVE' }): Promise<HelpArticle[]> {
    const where: any = { tenantId, isDeleted: false };
    if (params.module) where.module = params.module;
    if (params.contentType) where.contentType = params.contentType;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.client.helpArticle.findMany({ where, orderBy: [{ module: 'asc' }, { title: 'asc' }] });
    return items.map((a) => this.toArticleDto(a));
  }

  async getArticle(tenantId: string, id: string): Promise<HelpArticle> {
    const a = await this.prisma.client.helpArticle.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!a) throw new NotFoundException('Yardım içeriği bulunamadı');
    // Görüntülenme artır
    await this.prisma.client.helpArticle.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return this.toArticleDto(a);
  }

  async createArticle(tenantId: string, input: { module: string; page?: string; title: string; content: string; contentType: HelpContentType; permissionKey?: string; status?: 'ACTIVE' | 'PASSIVE' }, userId?: string): Promise<HelpArticle> {
    const a = await this.prisma.client.helpArticle.create({
      data: { ...input, tenantId, status: input.status ?? 'ACTIVE', createdById: userId },
    });
    return this.toArticleDto(a);
  }

  async updateArticle(tenantId: string, id: string, input: Partial<{ module: string; page: string; title: string; content: string; contentType: HelpContentType; permissionKey: string; status: 'ACTIVE' | 'PASSIVE' }>): Promise<HelpArticle> {
    const a = await this.prisma.client.helpArticle.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!a) throw new NotFoundException('Yardım içeriği bulunamadı');
    const updated = await this.prisma.client.helpArticle.update({ where: { id }, data: input });
    return this.toArticleDto(updated);
  }

  async deleteArticle(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.helpArticle.updateMany({ where: { id, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  // ==========================================================================
  // ASSISTANT TOOLS
  // ==========================================================================

  async listTools(tenantId: string): Promise<AssistantTool[]> {
    const tools = await this.prisma.client.assistantTool.findMany({ where: { tenantId }, orderBy: { code: 'asc' } });
    return tools.map((t) => this.toToolDto(t));
  }

  async createTool(tenantId: string, input: { code: string; name: string; description: string; module: string; requiredPermission: string; apiEndpoint: string; status?: AssistantToolStatus }): Promise<AssistantTool> {
    const t = await this.prisma.client.assistantTool.create({
      data: { ...input, tenantId, status: input.status ?? 'ACTIVE' },
    });
    return this.toToolDto(t);
  }

  async updateTool(tenantId: string, id: string, input: Partial<{ name: string; description: string; requiredPermission: string; apiEndpoint: string; status: AssistantToolStatus }>): Promise<AssistantTool> {
    const t = await this.prisma.client.assistantTool.findFirst({ where: { id, tenantId } });
    if (!t) throw new NotFoundException('Tool bulunamadı');
    const updated = await this.prisma.client.assistantTool.update({ where: { id }, data: input });
    return this.toToolDto(updated);
  }

  async deleteTool(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.assistantTool.deleteMany({ where: { id, tenantId } });
  }

  // ==========================================================================
  // DTO MAPPERS
  // ==========================================================================

  private toArticleDto(a: any): HelpArticle {
    return {
      id: a.id, tenantId: a.tenantId, module: a.module, page: a.page, title: a.title, content: a.content,
      contentType: a.contentType as HelpContentType, permissionKey: a.permissionKey, status: a.status,
      viewCount: a.viewCount, isDeleted: a.isDeleted, createdById: a.createdById,
      createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
    };
  }

  private toToolDto(t: any): AssistantTool {
    return {
      id: t.id, tenantId: t.tenantId, code: t.code, name: t.name, description: t.description,
      module: t.module, requiredPermission: t.requiredPermission, apiEndpoint: t.apiEndpoint,
      status: t.status as AssistantToolStatus,
      createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
    };
  }
}
