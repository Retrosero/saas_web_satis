import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.module.js';
import type { PaginatedResponse } from '@saas/shared';

export interface PortalJwtPayload {
  sub: string;        // customer.id
  cid: string;        // company/tenant.code (string identifier)
  tid: string;        // tenant.id
  type: 'customer-portal';
}

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Bayi/müşteri portalı login.
   * Customer tablosunda user-facing password yok; bu nedenle
   * customer'ın bağlı olduğu tenant.code + customer.code + customer.taxNumber
   * veya basit bir "portalPin" alanı ile giriş yapılır.
   */
  async login(tenantCode: string, customerCode: string, password: string): Promise<{ token: string; customer: { id: string; name: string; code: string } }> {
    const tenant = await this.prisma.client.tenant.findFirst({ where: { code: tenantCode, isDeleted: false } });
    if (!tenant) throw new UnauthorizedException('Firma bulunamadı');

    const customer = await this.prisma.client.customer.findFirst({
      where: { tenantId: tenant.id, code: customerCode, isDeleted: false },
    });
    if (!customer) throw new UnauthorizedException('Müşteri bulunamadı');

    // Basit PIN kontrolü: customer.taxNumber son 4 hanesi veya notes içinde portalPin
    // Production'da müşteriye ayrı bir portal_user tablosu eklenir
    const expectedPin = customer.notes?.match(/portalPin:(\d{4,8})/)?.[1] ?? (customer.taxNumber ? customer.taxNumber.slice(-4) : '');
    if (!expectedPin) throw new UnauthorizedException('Portal girişi aktif değil. Lütfen firma yöneticinizle iletişime geçin.');
    if (password !== expectedPin) throw new UnauthorizedException('Geçersiz şifre');

    const payload: PortalJwtPayload = { sub: customer.id, cid: tenantCode, tid: tenant.id, type: 'customer-portal' };
    const token = await this.jwt.signAsync(payload, { expiresIn: '7d' });

    return {
      token,
      customer: { id: customer.id, name: customer.name, code: customer.code },
    };
  }

  async getProfile(tenantId: string, customerId: string) {
    const c = await this.prisma.client.customer.findFirst({
      where: { id: customerId, tenantId, isDeleted: false },
    });
    if (!c) throw new UnauthorizedException();
    return {
      id: c.id, code: c.code, name: c.name, taxNumber: c.taxNumber,
      address: c.address, city: c.city, district: c.district,
      phone: c.phone, email: c.email,
      type: c.type, status: c.status, creditLimit: Number(c.creditLimit ?? 0),
    };
  }

  // Bakiye (event-sourced — customer_movements)
  async getBalance(tenantId: string, customerId: string) {
    const movements = await this.prisma.client.customerMovement.aggregate({
      where: { customerId, tenantId, isDeleted: false },
      _sum: { amountTry: true },
    });
    const totalDebit = await this.prisma.client.customerMovement.aggregate({
      where: { customerId, tenantId, type: 'DEBIT', isDeleted: false },
      _sum: { amountTry: true },
    });
    const totalCredit = await this.prisma.client.customerMovement.aggregate({
      where: { customerId, tenantId, type: 'CREDIT', isDeleted: false },
      _sum: { amountTry: true },
    });
    return {
      balance: Number(movements._sum.amountTry ?? 0), // pozitif = bizim alacağımız
      totalDebit: Number(totalDebit._sum.amountTry ?? 0),
      totalCredit: Number(totalCredit._sum.amountTry ?? 0),
    };
  }

  // Ekstre
  async getStatement(tenantId: string, customerId: string, params: { from?: Date; to?: Date; page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> {
    const { from, to, page = 1, pageSize = 50 } = params;
    const where: any = { customerId, tenantId, isDeleted: false };
    if (from || to) { where.movementDate = {}; if (from) where.movementDate.gte = from; if (to) where.movementDate.lte = to; }

    const [total, items] = await Promise.all([
      this.prisma.client.customerMovement.count({ where }),
      this.prisma.client.customerMovement.findMany({
        where, orderBy: { movementDate: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
        select: { id: true, movementDate: true, type: true, amount: true, currency: true, amountTry: true, description: true, refType: true, refNumber: true },
      }),
    ]);
    return {
      data: items.map((m) => ({ ...m, amount: Number(m.amount), amountTry: Number(m.amountTry), movementDate: m.movementDate.toISOString() })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  // Ürün kataloğu
  async getCatalog(tenantId: string, params: { search?: string; categoryId?: string; brandId?: string; minPrice?: number; maxPrice?: number; inStockOnly?: boolean; page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> {
    const { search, categoryId, brandId, minPrice, maxPrice, inStockOnly, page = 1, pageSize = 24 } = params;
    const where: any = { tenantId, isDeleted: false, status: 'ACTIVE' };
    if (search) where.OR = [{ code: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }];
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.defaultSalePrice = {};
      if (minPrice !== undefined) where.defaultSalePrice.gte = minPrice;
      if (maxPrice !== undefined) where.defaultSalePrice.lte = maxPrice;
    }

    const [total, items] = await Promise.all([
      this.prisma.client.product.count({ where }),
      this.prisma.client.product.findMany({
        where, orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize, take: pageSize,
        include: { category: { select: { id: true, name: true } }, brand: { select: { id: true, name: true } } },
      }),
    ]);

    // Stok kontrolü
    const productIds = items.map((p) => p.id);
    const stocks = productIds.length > 0 ? await this.prisma.client.stockMovement.groupBy({
      by: ['productId'],
      where: { tenantId, productId: { in: productIds } },
      _sum: { quantity: true },
    }) : [];
    const stockMap = new Map(stocks.map((s) => [s.productId, Number(s._sum.quantity ?? 0)]));

    const data = items
      .map((p: any) => ({ ...p, defaultSalePrice: Number(p.defaultSalePrice), totalStock: stockMap.get(p.id) ?? 0 }))
      .filter((p: any) => !inStockOnly || p.totalStock > 0);

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  async getProductDetail(tenantId: string, productId: string) {
    const p = await this.prisma.client.product.findFirst({
      where: { id: productId, tenantId, isDeleted: false, status: 'ACTIVE' },
      include: { category: true, brand: true },
    });
    if (!p) throw new UnauthorizedException('Ürün bulunamadı');
    const stock = await this.prisma.client.stockMovement.aggregate({ where: { tenantId, productId }, _sum: { quantity: true } });
    return { ...p, defaultSalePrice: Number((p as any).defaultSalePrice), totalStock: Number(stock._sum.quantity ?? 0) };
  }

  // Müşterinin siparişleri
  async getOrders(tenantId: string, customerId: string, params: { page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 25 } = params;
    const where = { tenantId, customerId, isDeleted: false };
    const [total, items] = await Promise.all([
      this.prisma.client.order.count({ where }),
      this.prisma.client.order.findMany({
        where, orderBy: { orderDate: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
        include: { items: true, warehouse: { select: { name: true } } },
      }),
    ]);
    return {
      data: items.map((o) => ({
        id: o.id, orderNumber: o.orderNumber, orderDate: o.orderDate.toISOString(), deliveryDate: o.deliveryDate?.toISOString() ?? null,
        status: o.status, type: o.type, grandTotal: Number(o.grandTotal), warehouse: o.warehouse?.name, itemCount: o.items.length,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  async getOrderDetail(tenantId: string, customerId: string, orderId: string) {
    const o = await this.prisma.client.order.findFirst({
      where: { id: orderId, tenantId, customerId, isDeleted: false },
      include: { items: { include: { product: { select: { code: true, name: true, primaryBarcode: true } } } }, warehouse: { select: { name: true } } },
    });
    if (!o) throw new UnauthorizedException('Sipariş bulunamadı');
    return {
      id: o.id, orderNumber: o.orderNumber, orderDate: o.orderDate.toISOString(),
      deliveryDate: o.deliveryDate?.toISOString() ?? null, status: o.status, type: o.type,
      subTotal: Number(o.subTotal), vatTotal: Number(o.vatTotal), grandTotal: Number(o.grandTotal),
      notes: o.notes, warehouse: o.warehouse?.name,
      items: o.items.map((it) => ({
        productCode: it.product?.code, productName: it.product?.name, barcode: it.product?.primaryBarcode,
        quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), vatRate: Number(it.vatRate),
        lineGrandTotal: Number(it.lineGrandTotal), description: it.description,
      })),
    };
  }
}
