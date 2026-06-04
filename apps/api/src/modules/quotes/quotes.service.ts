import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { QuoteStatus } from '@saas/shared';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, filters: { status?: QuoteStatus; customerId?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
    const where: any = { tenantId, isDeleted: false };
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.from || filters.to) { where.quoteDate = {}; if (filters.from) where.quoteDate.gte = new Date(filters.from); if (filters.to) where.quoteDate.lte = new Date(filters.to); }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.client.quote.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { items: true } }),
      this.prisma.client.quote.count({ where }),
    ]);
    return { items: items.map((q) => this.toDto(q)), total, page, pageSize };
  }

  async get(tenantId: string, id: string) {
    const q = await this.prisma.client.quote.findFirst({ where: { id, tenantId, isDeleted: false }, include: { items: { orderBy: { sortOrder: 'asc' } }, statusLogs: { orderBy: { createdAt: 'desc' } } } });
    if (!q) throw new NotFoundException('Teklif bulunamadı');
    return this.toDto(q);
  }

  async create(tenantId: string, input: { customerId: string; quoteDate: string; validUntil: string; paymentTerms?: string; deliveryTerms?: string; notes?: string; items: any[]; currency?: string }, userId: string) {
    if (!input.items || input.items.length === 0) throw new BadRequestException('En az 1 ürün gerekli');
    const customer = await this.prisma.client.customer.findFirst({ where: { id: input.customerId, tenantId } });
    if (!customer) throw new NotFoundException('Cari bulunamadı');
    const quoteNumber = `TKL-${Date.now().toString().slice(-8)}`;
    const totals = this.calculateTotals(input.items, 0);
    const q = await this.prisma.client.quote.create({
      data: {
        tenantId, quoteNumber, customerId: customer.id, customerName: customer.name, quoteDate: new Date(input.quoteDate), validUntil: new Date(input.validUntil),
        currency: input.currency ?? 'TRY', ...totals, paymentTerms: input.paymentTerms, deliveryTerms: input.deliveryTerms, notes: input.notes,
        status: QuoteStatus.DRAFT, preparedById: userId, createdById: userId,
        items: { create: input.items.map((it, i) => ({ productId: it.productId, productCode: it.productCode ?? '', productName: it.productName, quantity: it.quantity, unitPrice: it.unitPrice, discountRate: it.discountRate ?? 0, vatRate: it.vatRate ?? 20, lineTotal: it.quantity * it.unitPrice * (1 - (it.discountRate ?? 0) / 100), sortOrder: i })) },
      },
      include: { items: true },
    });
    await this.prisma.client.quoteStatusLog.create({ data: { quoteId: q.id, toStatus: QuoteStatus.DRAFT, actorId: userId, note: 'Teklif oluşturuldu' } });
    return this.toDto(q);
  }

  async updateStatus(tenantId: string, id: string, status: QuoteStatus, userId: string, note?: string) {
    const q = await this.prisma.client.quote.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!q) throw new NotFoundException('Teklif bulunamadı');
    if (q.status === QuoteStatus.CONVERTED_TO_ORDER || q.status === QuoteStatus.CONVERTED_TO_SALE) throw new BadRequestException('Dönüştürülmüş teklif durumu değiştirilemez');
    const data: any = { status };
    if (status === QuoteStatus.SENT && !q.sentAt) data.sentAt = new Date();
    if (status === QuoteStatus.VIEWED && !q.viewedAt) data.viewedAt = new Date();
    if (status === QuoteStatus.ACCEPTED) data.acceptedAt = new Date();
    if (status === QuoteStatus.REJECTED) { data.rejectedAt = new Date(); data.rejectedReason = note; }
    const updated = await this.prisma.client.quote.update({ where: { id }, data });
    await this.prisma.client.quoteStatusLog.create({ data: { quoteId: id, fromStatus: q.status, toStatus: status, actorId: userId, note } });
    return this.toDto(updated);
  }

  async convertToOrder(tenantId: string, id: string, userId: string) {
    return this.convert(tenantId, id, 'ORDER', userId);
  }
  async convertToSale(tenantId: string, id: string, userId: string) {
    return this.convert(tenantId, id, 'SALE', userId);
  }

  private async convert(tenantId: string, id: string, target: 'ORDER' | 'SALE', userId: string) {
    const q = await this.prisma.client.quote.findFirst({ where: { id, tenantId, isDeleted: false }, include: { items: true } });
    if (!q) throw new NotFoundException('Teklif bulunamadı');
    if (q.status === QuoteStatus.CONVERTED_TO_ORDER || q.status === QuoteStatus.CONVERTED_TO_SALE) throw new BadRequestException('Teklif zaten dönüştürülmüş');
    if (q.validUntil < new Date()) throw new BadRequestException('Teklif süresi dolmuş');

    if (target === 'ORDER') {
      const orderNumber = `SIP-${Date.now().toString().slice(-8)}`;
      const order = await this.prisma.client.order.create({ data: { tenantId, orderNumber, customerId: q.customerId, customerName: q.customerName, orderDate: new Date(), currency: q.currency, status: 'CONFIRMED', grandTotal: Number(q.grandTotal), notes: q.notes, createdById: userId } });
      await this.prisma.client.orderItem.createMany({ data: q.items.map((it: any) => { const lineSub = Number(it.quantity) * Number(it.unitPrice) * (1 - Number(it.discountRate ?? 0) / 100); const vat = lineSub * (Number(it.vatRate ?? 20) / 100); return { tenantId, orderId: order.id, productId: it.productId, description: it.productName, quantity: Number(it.quantity) as any, unitPrice: Number(it.unitPrice) as any, vatRate: Number(it.vatRate) as any, discountRate: Number(it.discountRate ?? 0) as any, lineSubTotal: lineSub as any, lineVatAmount: vat as any, lineGrandTotal: (lineSub + vat) as any, sortOrder: it.sortOrder }; }) });
      await this.prisma.client.quote.update({ where: { id }, data: { status: QuoteStatus.CONVERTED_TO_ORDER, convertedAt: new Date(), convertedRefType: 'Order', convertedRefId: order.id } });
      await this.prisma.client.quoteStatusLog.create({ data: { quoteId: id, toStatus: QuoteStatus.CONVERTED_TO_ORDER, actorId: userId, note: `Sipariş oluşturuldu: ${orderNumber}` } });
      return { ok: true, orderId: order.id, orderNumber };
    } else {
      const saleNumber = `SLS-${Date.now().toString().slice(-8)}`;
      const sale = await this.prisma.client.sale.create({ data: { tenantId, saleNumber, customerId: q.customerId, customerName: q.customerName, saleDate: new Date(), currency: q.currency, status: 'DRAFT', grandTotal: Number(q.grandTotal), subTotal: Number(q.subTotal), notes: q.notes, createdById: userId, items: { create: q.items.map((it) => ({ tenantId, productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice, vatRate: it.vatRate, lineSubTotal: Number(it.lineTotal), lineGrandTotal: Number(it.lineTotal), sortOrder: it.sortOrder })) } } });
      await this.prisma.client.quote.update({ where: { id }, data: { status: QuoteStatus.CONVERTED_TO_SALE, convertedAt: new Date(), convertedRefType: 'Sale', convertedRefId: sale.id } });
      await this.prisma.client.quoteStatusLog.create({ data: { quoteId: id, toStatus: QuoteStatus.CONVERTED_TO_SALE, actorId: userId, note: `Satış oluşturuldu: ${saleNumber}` } });
      return { ok: true, saleId: sale.id, saleNumber };
    }
  }

  async delete(tenantId: string, id: string) {
    const q = await this.prisma.client.quote.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!q) throw new NotFoundException('Teklif bulunamadı');
    await this.prisma.client.quote.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  private calculateTotals(items: any[], discountRate: number) {
    let subTotal = 0; let vatTotal = 0;
    for (const it of items) {
      const lineSub = it.quantity * it.unitPrice;
      const lineAfterDiscount = lineSub * (1 - (it.discountRate ?? 0) / 100);
      const lineVat = lineAfterDiscount * ((it.vatRate ?? 20) / 100);
      subTotal += lineAfterDiscount;
      vatTotal += lineVat;
    }
    const grandTotal = subTotal + vatTotal;
    return { subTotal, vatTotal, grandTotal, discountAmount: 0, discountRate };
  }

  private toDto(q: any) {
    return { id: q.id, tenantId: q.tenantId, quoteNumber: q.quoteNumber, customerId: q.customerId, customerName: q.customerName, quoteDate: q.quoteDate.toISOString(), validUntil: q.validUntil.toISOString(), currency: q.currency, subTotal: Number(q.subTotal), discountRate: Number(q.discountRate), discountAmount: Number(q.discountAmount), vatTotal: Number(q.vatTotal), grandTotal: Number(q.grandTotal), paymentTerms: q.paymentTerms, deliveryTerms: q.deliveryTerms, notes: q.notes, status: q.status, sentAt: q.sentAt?.toISOString(), viewedAt: q.viewedAt?.toISOString(), acceptedAt: q.acceptedAt?.toISOString(), rejectedAt: q.rejectedAt?.toISOString(), rejectedReason: q.rejectedReason, convertedAt: q.convertedAt?.toISOString(), convertedRefType: q.convertedRefType, convertedRefId: q.convertedRefId, createdAt: q.createdAt.toISOString(), updatedAt: q.updatedAt.toISOString(), items: q.items };
  }
}
