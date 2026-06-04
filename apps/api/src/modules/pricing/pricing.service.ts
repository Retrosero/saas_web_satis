import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import type {
  Campaign,
  CampaignStatus,
  CampaignTestResult,
  CampaignType,
  CustomerPriceGroup,
  DiscountType,
  PaginatedResponse,
  PriceList,
  PriceListItem,
  PriceListStatus,
} from '@saas/shared';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // PRICE LISTS
  // ==========================================================================

  async listPriceLists(tenantId: string, params: { search?: string; status?: PriceListStatus; currency?: string; customerGroupId?: string }): Promise<PriceList[]> {
    const where: any = { tenantId, isDeleted: false };
    if (params.status) where.status = params.status;
    if (params.currency) where.currency = params.currency;
    if (params.customerGroupId) where.customerGroupId = params.customerGroupId;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const lists = await this.prisma.client.priceList.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    return lists.map((l) => this.toPriceListDto(l));
  }

  async getPriceList(tenantId: string, id: string): Promise<PriceList & { items: PriceListItem[] }> {
    const l = await this.prisma.client.priceList.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: { items: { include: { product: { select: { code: true, name: true, primaryBarcode: true } } } } },
    });
    if (!l) throw new NotFoundException('Fiyat listesi bulunamadı');
    return { ...this.toPriceListDto(l), items: l.items.map((i) => this.toItemDto(i, i.product)) } as any;
  }

  async createPriceList(tenantId: string, input: { code: string; name: string; currency?: string; validFrom?: string; validTo?: string; customerGroupId?: string; description?: string; status?: PriceListStatus; items?: Array<{ productId: string; oldPrice?: number; newPrice: number; vatRate?: number; minQuantity?: number; maxDiscountRate?: number }> }, userId?: string): Promise<PriceList & { items: PriceListItem[] }> {
    if (!input.code || !input.name) throw new BadRequestException('Kod ve ad zorunlu');
    const existing = await this.prisma.client.priceList.findFirst({ where: { tenantId, code: input.code, isDeleted: false } });
    if (existing) throw new BadRequestException('Bu kod zaten mevcut');

    return this.prisma.client.$transaction(async (tx) => {
      const pl = await tx.priceList.create({
        data: {
          tenantId, code: input.code, name: input.name,
          currency: input.currency ?? 'TRY',
          validFrom: input.validFrom ? new Date(input.validFrom) : null,
          validTo: input.validTo ? new Date(input.validTo) : null,
          customerGroupId: input.customerGroupId,
          description: input.description,
          status: input.status ?? 'DRAFT',
          createdById: userId,
        },
      });
      if (input.items && input.items.length > 0) {
        await tx.priceListItem.createMany({
          data: input.items.map((i) => ({
            priceListId: pl.id, productId: i.productId,
            oldPrice: i.oldPrice ?? 0, newPrice: i.newPrice,
            vatRate: i.vatRate ?? 0,
            minQuantity: i.minQuantity ?? 1, maxDiscountRate: i.maxDiscountRate ?? 0,
          })),
        });
      }
      return { ...this.toPriceListDto(pl), items: [] } as any;
    });
  }

  async updatePriceList(tenantId: string, id: string, input: Partial<{ name: string; validFrom: string; validTo: string; customerGroupId: string; description: string; status: PriceListStatus }>): Promise<PriceList> {
    const l = await this.prisma.client.priceList.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!l) throw new NotFoundException('Fiyat listesi bulunamadı');
    const updated = await this.prisma.client.priceList.update({
      where: { id },
      data: {
        ...input,
        validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
        validTo: input.validTo ? new Date(input.validTo) : undefined,
      },
    });
    return this.toPriceListDto(updated);
  }

  async deletePriceList(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.priceList.updateMany({ where: { id, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async addPriceListItem(tenantId: string, listId: string, item: { productId: string; newPrice: number; vatRate?: number; minQuantity?: number }): Promise<void> {
    const l = await this.prisma.client.priceList.findFirst({ where: { id: listId, tenantId, isDeleted: false } });
    if (!l) throw new NotFoundException('Fiyat listesi bulunamadı');
    await this.prisma.client.priceListItem.create({ data: { priceListId: listId, productId: item.productId, newPrice: item.newPrice, vatRate: item.vatRate ?? 0, minQuantity: item.minQuantity ?? 1, maxDiscountRate: 0 } });
  }

  // ==========================================================================
  // CUSTOMER PRICE GROUPS
  // ==========================================================================

  async listCustomerGroups(tenantId: string): Promise<CustomerPriceGroup[]> {
    const groups = await this.prisma.client.customerPriceGroup.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true } } },
    });
    return groups.map((g) => ({ ...this.toGroupDto(g), memberCount: (g as any)._count?.members ?? 0 }));
  }

  async createCustomerGroup(tenantId: string, input: { code: string; name: string; description?: string; defaultPriceListId?: string; defaultDiscountRate?: number }): Promise<CustomerPriceGroup> {
    const g = await this.prisma.client.customerPriceGroup.create({
      data: { ...input, tenantId, defaultDiscountRate: input.defaultDiscountRate ?? 0 },
    });
    return this.toGroupDto(g);
  }

  async updateCustomerGroup(tenantId: string, id: string, input: Partial<{ name: string; description: string; defaultPriceListId: string; defaultDiscountRate: number; isActive: boolean }>): Promise<CustomerPriceGroup> {
    const g = await this.prisma.client.customerPriceGroup.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!g) throw new NotFoundException('Grup bulunamadı');
    const updated = await this.prisma.client.customerPriceGroup.update({ where: { id }, data: input });
    return this.toGroupDto(updated);
  }

  async addCustomerToGroup(tenantId: string, groupId: string, customerId: string, customDiscountRate?: number): Promise<void> {
    await this.prisma.client.customerPriceGroupMember.upsert({
      where: { groupId_customerId: { groupId, customerId } },
      create: { groupId, customerId, customDiscountRate: customDiscountRate ?? 0 },
      update: { customDiscountRate: customDiscountRate ?? 0 },
    });
  }

  async removeCustomerFromGroup(tenantId: string, groupId: string, customerId: string): Promise<void> {
    const g = await this.prisma.client.customerPriceGroup.findFirst({ where: { id: groupId, tenantId, isDeleted: false } });
    if (!g) throw new NotFoundException('Grup bulunamadı');
    await this.prisma.client.customerPriceGroupMember.deleteMany({ where: { groupId, customerId } });
  }

  // ==========================================================================
  // CAMPAIGNS
  // ==========================================================================

  async listCampaigns(tenantId: string, params: { status?: CampaignStatus; campaignType?: CampaignType; from?: Date; to?: Date }): Promise<Campaign[]> {
    const where: any = { tenantId, isDeleted: false };
    if (params.status) where.status = params.status;
    if (params.campaignType) where.campaignType = params.campaignType;
    if (params.from || params.to) {
      where.OR = [
        { startDate: { lte: params.to ?? new Date('9999-12-31') }, endDate: { gte: params.from ?? new Date('1900-01-01') } },
      ];
    }
    const cs = await this.prisma.client.campaign.findMany({ where, orderBy: { startDate: 'desc' } });
    return cs.map((c) => this.toCampaignDto(c));
  }

  async getCampaign(tenantId: string, id: string): Promise<Campaign> {
    const c = await this.prisma.client.campaign.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı');
    return this.toCampaignDto(c);
  }

  async createCampaign(tenantId: string, input: Partial<Campaign> & { code: string; name: string; campaignType: CampaignType; startDate: string; endDate: string }, userId?: string): Promise<Campaign> {
    if (!input.code || !input.name || !input.campaignType || !input.startDate || !input.endDate) {
      throw new BadRequestException('Kod, ad, tip ve tarihler zorunlu');
    }
    const c = await this.prisma.client.campaign.create({
      data: {
        tenantId, code: input.code, name: input.name, campaignType: input.campaignType,
        startDate: new Date(input.startDate), endDate: new Date(input.endDate),
        customerGroupId: input.customerGroupId ?? null, customerId: input.customerId ?? null, productId: input.productId ?? null,
        minQuantity: input.minQuantity ?? 0, minCartAmount: input.minCartAmount ?? 0,
        discountType: input.discountType ?? 'PERCENT', discountRate: input.discountRate ?? 0, discountAmount: input.discountAmount ?? 0,
        maxUsageCount: input.maxUsageCount ?? 0, perUserLimit: input.perUserLimit ?? 1,
        description: input.description, status: input.status ?? 'DRAFT',
        createdById: userId,
      },
    });
    return this.toCampaignDto(c);
  }

  async updateCampaign(tenantId: string, id: string, input: Partial<Campaign>): Promise<Campaign> {
    const c = await this.prisma.client.campaign.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı');
    const data: any = { ...input };
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);
    delete data.id; delete data.tenantId; delete data.usageCount; delete data.createdAt; delete data.updatedAt;
    const updated = await this.prisma.client.campaign.update({ where: { id }, data });
    return this.toCampaignDto(updated);
  }

  async deleteCampaign(tenantId: string, id: string): Promise<void> {
    await this.prisma.client.campaign.updateMany({ where: { id, tenantId }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  // ==========================================================================
  // CAMPAIGN TEST
  // ==========================================================================

  async testCampaign(tenantId: string, input: { campaignId: string; customerId?: string; productId?: string; quantity: number; unitPrice: number; cartAmount: number }): Promise<CampaignTestResult> {
    const c = await this.prisma.client.campaign.findFirst({ where: { id: input.campaignId, tenantId, isDeleted: false } });
    if (!c) throw new NotFoundException('Kampanya bulunamadı');
    return this.evaluateCampaign(c, input);
  }

  private evaluateCampaign(c: any, input: { customerId?: string; productId?: string; quantity: number; unitPrice: number; cartAmount: number }): CampaignTestResult {
    const originalAmount = input.cartAmount > 0 ? input.cartAmount : input.quantity * input.unitPrice;
    let discountAmount = 0;
    let reason = '';

    if (c.status !== 'ACTIVE') return { appliedCampaign: null, originalAmount, discountAmount: 0, netAmount: originalAmount, reason: `Kampanya durumu: ${c.status}` };

    // Tarih kontrolü
    const now = new Date();
    if (now < c.startDate || now > c.endDate) return { appliedCampaign: null, originalAmount, discountAmount: 0, netAmount: originalAmount, reason: 'Kampanya tarih aralığında değil' };

    // Ürün kontrolü
    if (c.productId && c.productId !== input.productId) return { appliedCampaign: null, originalAmount, discountAmount: 0, netAmount: originalAmount, reason: 'Ürün bu kampanyaya dahil değil' };

    // Adet kontrolü
    if (input.quantity < Number(c.minQuantity)) return { appliedCampaign: null, originalAmount, discountAmount: 0, netAmount: originalAmount, reason: `Minimum ${c.minQuantity} adet gerekli` };

    // Sepet tutarı kontrolü
    if (originalAmount < Number(c.minCartAmount)) return { appliedCampaign: null, originalAmount, discountAmount: 0, netAmount: originalAmount, reason: `Minimum sepet ${c.minCartAmount} gerekli` };

    // Kullanım limiti
    if (c.maxUsageCount > 0 && c.usageCount >= c.maxUsageCount) return { appliedCampaign: null, originalAmount, discountAmount: 0, netAmount: originalAmount, reason: 'Kampanya kullanım limiti doldu' };

    // İndirim hesapla
    if (c.discountType === 'PERCENT') {
      discountAmount = originalAmount * Number(c.discountRate) / 100;
      reason = `%${c.discountRate} iskonto uygulandı`;
    } else if (c.discountType === 'AMOUNT') {
      discountAmount = Number(c.discountAmount);
      reason = `${c.discountAmount} TL iskonto uygulandı`;
    } else if (c.discountType === 'FIXED_PRICE') {
      discountAmount = Math.max(0, originalAmount - Number(c.discountAmount));
      reason = `Sabit fiyat: ${c.discountAmount} TL`;
    }

    return { appliedCampaign: c as any, originalAmount, discountAmount, netAmount: Math.max(0, originalAmount - discountAmount), reason };
  }

  // ==========================================================================
  // DTO MAPPERS
  // ==========================================================================

  private toPriceListDto(l: any): PriceList {
    return {
      id: l.id, tenantId: l.tenantId, code: l.code, name: l.name,
      currency: l.currency, validFrom: l.validFrom?.toISOString() ?? null, validTo: l.validTo?.toISOString() ?? null,
      customerGroupId: l.customerGroupId, description: l.description, status: l.status as PriceListStatus,
      itemCount: l._count?.items ?? 0, isDeleted: l.isDeleted,
      createdById: l.createdById, createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString(),
    };
  }

  private toItemDto(i: any, product: any): PriceListItem {
    return {
      id: i.id, priceListId: i.priceListId, productId: i.productId,
      productCode: product?.code ?? '', productName: product?.name ?? '', barcode: product?.primaryBarcode,
      oldPrice: i.oldPrice ? Number(i.oldPrice) : null,
      newPrice: Number(i.newPrice), vatRate: Number(i.vatRate),
      minQuantity: Number(i.minQuantity), maxDiscountRate: Number(i.maxDiscountRate),
    };
  }

  private toGroupDto(g: any): CustomerPriceGroup {
    return {
      id: g.id, tenantId: g.tenantId, code: g.code, name: g.name, description: g.description,
      defaultPriceListId: g.defaultPriceListId, defaultDiscountRate: Number(g.defaultDiscountRate ?? 0),
      memberCount: g._count?.members ?? 0, isActive: g.isActive,
      createdAt: g.createdAt.toISOString(),
    };
  }

  private toCampaignDto(c: any): Campaign {
    return {
      id: c.id, tenantId: c.tenantId, code: c.code, name: c.name,
      campaignType: c.campaignType as CampaignType,
      startDate: c.startDate.toISOString(), endDate: c.endDate.toISOString(),
      customerGroupId: c.customerGroupId, customerId: c.customerId, productId: c.productId,
      minQuantity: Number(c.minQuantity), minCartAmount: Number(c.minCartAmount),
      discountType: c.discountType as DiscountType,
      discountRate: Number(c.discountRate), discountAmount: Number(c.discountAmount),
      maxUsageCount: c.maxUsageCount, perUserLimit: c.perUserLimit, usageCount: c.usageCount,
      description: c.description, status: c.status as CampaignStatus,
      isDeleted: c.isDeleted, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
    };
  }
}
