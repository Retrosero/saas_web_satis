import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module.js';
import type {
  Customer,
  CustomerStatus,
  CustomerType,
  PaginatedResponse,
} from '@saas/shared';

/**
 * Müşteri/tedarikçi (cari hesap) yönetimi.
 *
 * Bakiye: event-sourcing — saklanmaz, hareketlerden hesaplanır.
 * computeBalance() metodu: customer_movements tablosundan anlık hesap.
 * DEBIT (+) - CREDIT (-) formülü (bizim alacağımız - bizim borcumuz).
 */
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Filtreli, sayfalı cari listesi.
   * Sadece mevcut tenant'ın carilerini döner (tenantId her zaman request'ten).
   */
  async list(
    tenantId: string,
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      type?: CustomerType;
      status?: CustomerStatus;
    },
  ): Promise<PaginatedResponse<Customer & { balance: number; movementCount: number }>> {
    this.ensureTenantScope(tenantId);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      isDeleted: false,
      ...(params.type ? { type: params.type } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { code: { contains: params.search, mode: 'insensitive' } },
              { name: { contains: params.search, mode: 'insensitive' } },
              { taxNumber: { contains: params.search, mode: 'insensitive' } },
              { phone: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.customer.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.customer.count({ where }),
    ]);

    // Toplu bakiye + hareket sayısı hesabı (N+1 yok)
    const ids = rows.map((r) => r.id);
    const balances = await this.computeBalances(tenantId, ids);

    return {
      data: rows.map((c) => ({
        ...this.toDto(c),
        balance: balances.get(c.id)?.balance ?? 0,
        movementCount: balances.get(c.id)?.movementCount ?? 0,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Tek cari detayı + anlık bakiye.
   */
  async findById(tenantId: string, id: string): Promise<Customer & { balance: number; movementCount: number }> {
    this.ensureTenantScope(tenantId);
    const c = await this.prisma.client.customer.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!c) throw new NotFoundException('Cari bulunamadı');

    const { balance, movementCount } = await this.computeSingleBalance(tenantId, id);
    return { ...this.toDto(c), balance, movementCount };
  }

  /**
   * Yeni cari. code verilmemişse tenant-scoped sıradaki kodu üretir.
   * Açılış bakiyesi > 0 ise otomatik OPENING_BALANCE hareketi oluşturur.
   */
  async create(
    tenantId: string,
    input: {
      code?: string;
      name: string;
      type?: CustomerType;
      contactName?: string;
      taxNumber?: string;
      taxOffice?: string;
      identityNumber?: string;
      address?: string;
      city?: string;
      district?: string;
      postalCode?: string;
      country?: string;
      phone?: string;
      phone2?: string;
      email?: string;
      website?: string;
      iban?: string;
      openingBalance?: number;
      creditLimit?: number;
      paymentTermDays?: number;
      status?: CustomerStatus;
      notes?: string;
    },
    createdById?: string,
  ): Promise<Customer> {
    this.ensureTenantScope(tenantId);
    const type = input.type ?? 'CUSTOMER';
    const code = input.code ?? (await this.generateNextCode(tenantId, type));

    // Unique kontrol (tenant-scoped)
    const existing = await this.prisma.client.customer.findFirst({
      where: { tenantId, code, isDeleted: false },
    });
    if (existing) {
      throw new ConflictException(`Bu cari kodu zaten kullanılıyor: ${code}`);
    }

    const created = await this.prisma.client.customer.create({
      data: {
        tenantId,
        code,
        name: input.name,
        type,
        contactName: input.contactName ?? null,
        taxNumber: input.taxNumber ?? null,
        taxOffice: input.taxOffice ?? null,
        identityNumber: input.identityNumber ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        district: input.district ?? null,
        postalCode: input.postalCode ?? null,
        country: input.country ?? 'Türkiye',
        phone: input.phone ?? null,
        phone2: input.phone2 ?? null,
        email: input.email ?? null,
        website: input.website ?? null,
        iban: input.iban ?? null,
        creditLimit: new Prisma.Decimal(input.creditLimit ?? 0),
        paymentTermDays: input.paymentTermDays ?? 0,
        status: input.status ?? 'ACTIVE',
        notes: input.notes ?? null,
        createdById: createdById ?? null,
      },
    });

    // Açılış bakiyesi hareketi (varsa)
    if (input.openingBalance && input.openingBalance !== 0) {
      const isDebit = input.openingBalance > 0;
      const amount = Math.abs(input.openingBalance);
      await this.prisma.client.customerMovement.create({
        data: {
          tenantId,
          customerId: created.id,
          type: isDebit ? 'DEBIT' : 'CREDIT',
          amount: new Prisma.Decimal(amount),
          currency: 'TRY',
          exchangeRate: new Prisma.Decimal(1),
          amountTry: new Prisma.Decimal(amount),
          movementDate: new Date(),
          refType: 'OPENING_BALANCE',
          refNumber: `AÇ-${code}`,
          description: 'Açılış bakiyesi',
          status: 'POSTED',
          createdById: createdById ?? null,
        },
      });
    }

    return this.toDto(created);
  }

  /**
   * Cari güncelle. code değiştirilemez (benzersizlik kısıtı).
   */
  async update(
    tenantId: string,
    id: string,
    input: {
      name?: string;
      type?: CustomerType;
      contactName?: string | null;
      taxNumber?: string | null;
      taxOffice?: string | null;
      identityNumber?: string | null;
      address?: string | null;
      city?: string | null;
      district?: string | null;
      postalCode?: string | null;
      country?: string;
      phone?: string | null;
      phone2?: string | null;
      email?: string | null;
      website?: string | null;
      iban?: string | null;
      creditLimit?: number;
      paymentTermDays?: number;
      status?: CustomerStatus;
      notes?: string | null;
    },
    updatedById?: string,
  ): Promise<Customer> {
    this.ensureTenantScope(tenantId);
    const exists = await this.prisma.client.customer.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!exists) throw new NotFoundException('Cari bulunamadı');

    const updated = await this.prisma.client.customer.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
        ...(input.taxNumber !== undefined ? { taxNumber: input.taxNumber } : {}),
        ...(input.taxOffice !== undefined ? { taxOffice: input.taxOffice } : {}),
        ...(input.identityNumber !== undefined ? { identityNumber: input.identityNumber } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.district !== undefined ? { district: input.district } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.phone2 !== undefined ? { phone2: input.phone2 } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.website !== undefined ? { website: input.website } : {}),
        ...(input.iban !== undefined ? { iban: input.iban } : {}),
        ...(input.creditLimit !== undefined ? { creditLimit: new Prisma.Decimal(input.creditLimit) } : {}),
        ...(input.paymentTermDays !== undefined ? { paymentTermDays: input.paymentTermDays } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        updatedById: updatedById ?? null,
      },
    });

    return this.toDto(updated);
  }

  /**
   * Soft delete: isDeleted=true, deletedAt=now.
   * Hareketleri SAKLANIR — silinen carinin hareketleri ekstrede görünür.
   * Hard delete KULLANILMAZ (muhasebe izi için).
   */
  async remove(tenantId: string, id: string, deletedById?: string): Promise<void> {
    this.ensureTenantScope(tenantId);
    const exists = await this.prisma.client.customer.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!exists) throw new NotFoundException('Cari bulunamadı');

    // Hareket var mı kontrolü (varsa uyarı)
    const movementCount = await this.prisma.client.customerMovement.count({
      where: { customerId: id, isDeleted: false },
    });
    if (movementCount > 0) {
      throw new BadRequestException(
        `Bu carinin ${movementCount} adet hareketi var. Önce hareketleri iptal edin veya cariyi PASIF yapın.`,
      );
    }

    await this.prisma.client.customer.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedById: deletedById ?? null,
      },
    });
  }

  /**
   * Pasife al — hareketi olan cariler için güvenli yol.
   * Veri silinmez, sadece status=ACTIVE çıkar.
   */
  async deactivate(tenantId: string, id: string, updatedById?: string): Promise<Customer> {
    this.ensureTenantScope(tenantId);
    return this.update(tenantId, id, { status: 'PASSIVE' }, updatedById);
  }

  /**
   * Cari ekstre — hareket listesi + bakiye özeti.
   * Tarih aralığı ve refType filtresi opsiyonel.
   */
  async getStatement(
    tenantId: string,
    customerId: string,
    params: {
      from?: Date;
      to?: Date;
      refType?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{
    customer: Customer;
    balance: number;
    totalDebit: number;
    totalCredit: number;
    movements: Array<{
      id: string;
      movementDate: Date;
      dueDate?: Date | null;
      type: 'DEBIT' | 'CREDIT';
      amount: number;
      refType: string;
      refId: string | null;
      refNumber?: string | null;
      description?: string | null;
      reversesId?: string | null;
      reversedById?: string | null;
      detailRoute?: string | null;
      editable?: boolean;
      deletable?: boolean;
      printable?: boolean;
    }>;
  }> {
    this.ensureTenantScope(tenantId);
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, tenantId, isDeleted: false },
    });
    if (!customer) throw new NotFoundException('Cari bulunamadı');

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 100;

    const where: Prisma.CustomerMovementWhereInput = {
      customerId,
      isDeleted: false,
      status: 'POSTED',
      ...(params.from || params.to
        ? {
            movementDate: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
      ...(params.refType ? { refType: params.refType as Prisma.EnumCustomerMovementRefTypeFilter['equals'] } : {}),
    };

    const [movements] = await Promise.all([
      this.prisma.client.customerMovement.findMany({
        where,
        include: { reversedBy: true },
        orderBy: [{ movementDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // DEBIT/CREDIT toplam (event-sourcing)
    const totals = await this.prisma.client.customerMovement.groupBy({
      by: ['type'],
      where: { ...where, reversedBy: { is: null } },
      _sum: { amountTry: true },
    });
    const totalDebit = Number(totals.find((t) => t.type === 'DEBIT')?._sum.amountTry ?? 0);
    const totalCredit = Number(totals.find((t) => t.type === 'CREDIT')?._sum.amountTry ?? 0);
    // Bakiye: alacak - borç (müşteri bizden alacaklıysa pozitif)
    const balance = totalDebit - totalCredit;

    return {
      customer: this.toDto(customer),
      balance,
      totalDebit,
      totalCredit,
      movements: movements.map((m) => ({
        id: m.id,
        movementDate: m.movementDate,
        dueDate: m.dueDate,
        type: m.type,
        amount: Number(m.amount),
        refType: m.refType,
        refId: m.refId,
        refNumber: m.refNumber,
        description: m.description,
        reversesId: m.reversesId,
        reversedById: m.reversedBy?.id ?? null,
        detailRoute: this.resolveMovementDetailRoute(customerId, m.id, m.refType, m.refId),
        editable: this.isGenericMovementEditable(m.refType, m.refId, m.reversesId, m.reversedBy?.id ?? null),
        deletable: this.isGenericMovementEditable(m.refType, m.refId, m.reversesId, m.reversedBy?.id ?? null),
        printable: true,
      })),
    };
  }

  async getMovement(tenantId: string, customerId: string, movementId: string) {
    this.ensureTenantScope(tenantId);
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, tenantId, isDeleted: false },
    });
    if (!customer) throw new NotFoundException('Cari bulunamadı');

    const movement = await this.prisma.client.customerMovement.findFirst({
      where: { id: movementId, tenantId, customerId, isDeleted: false },
      include: { reversedBy: true },
    });
    if (!movement) throw new NotFoundException('Cari hareketi bulunamadı');

    return {
      movement: this.toMovementDto(movement),
      customer: this.toDto(customer),
      detailRoute: this.resolveMovementDetailRoute(customerId, movement.id, movement.refType, movement.refId),
      editable: this.isGenericMovementEditable(movement.refType, movement.refId, movement.reversesId, movement.reversedBy?.id ?? null),
      deletable: this.isGenericMovementEditable(movement.refType, movement.refId, movement.reversesId, movement.reversedBy?.id ?? null),
      printable: true,
    };
  }

  async updateMovement(
    tenantId: string,
    customerId: string,
    movementId: string,
    input: { movementDate: Date; dueDate?: Date | null; amount: number; description?: string | null },
  ) {
    this.ensureTenantScope(tenantId);
    const movement = await this.prisma.client.customerMovement.findFirst({
      where: { id: movementId, tenantId, customerId, isDeleted: false },
      include: { reversedBy: true },
    });
    if (!movement) throw new NotFoundException('Cari hareketi bulunamadı');
    if (!this.isGenericMovementEditable(movement.refType, movement.refId, movement.reversesId, movement.reversedBy?.id ?? null)) {
      throw new BadRequestException('Bu hareket belge üzerinden yönetiliyor, doğrudan düzenlenemez');
    }
    if (input.amount <= 0) throw new BadRequestException('Tutar sıfırdan büyük olmalı');

    const updated = await this.prisma.client.customerMovement.update({
      where: { id: movementId },
      data: {
        movementDate: input.movementDate,
        dueDate: input.dueDate ?? null,
        amount: new Prisma.Decimal(input.amount),
        amountTry: new Prisma.Decimal(input.amount * Number(movement.exchangeRate)),
        description: input.description ?? null,
      },
      include: { reversedBy: true },
    });

    return this.toMovementDto(updated);
  }

  async reverseMovement(
    tenantId: string,
    customerId: string,
    movementId: string,
    createdById?: string,
    reason?: string,
  ) {
    this.ensureTenantScope(tenantId);
    const movement = await this.prisma.client.customerMovement.findFirst({
      where: { id: movementId, tenantId, customerId, isDeleted: false },
      include: { reversedBy: true },
    });
    if (!movement) throw new NotFoundException('Cari hareketi bulunamadı');
    if (!this.isGenericMovementEditable(movement.refType, movement.refId, movement.reversesId, movement.reversedBy?.id ?? null)) {
      throw new BadRequestException('Bu hareket belge üzerinden yönetiliyor, doğrudan silinemez');
    }

    const reversed = await this.prisma.client.customerMovement.create({
      data: {
        tenantId,
        customerId,
        type: movement.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
        amount: movement.amount,
        currency: movement.currency,
        exchangeRate: movement.exchangeRate,
        amountTry: movement.amountTry,
        movementDate: new Date(),
        dueDate: movement.dueDate,
        refType: 'ADJUST',
        refId: movement.id,
        refNumber: movement.refNumber ? `IPT-${movement.refNumber}` : null,
        description: reason ? `${movement.description ?? 'Cari hareket iptali'} — ${reason}` : `${movement.description ?? 'Cari hareket iptali'}`,
        status: 'POSTED',
        reversesId: movement.id,
        createdById: createdById ?? null,
      },
      include: { reversedBy: true },
    });

    return this.toMovementDto(reversed);
  }

  // ----- PRIVATE -----

  /**
   * Tenant-scoped sıradaki cari kodu üretir.
   *   Müşteri (CUSTOMER) → "M-0001", "M-0002", ...
   *   Tedarikçi (SUPPLIER) → "T-0001", "T-0002", ...
   *   BOTH → "H-0001" (herkes)
   */
  private async generateNextCode(tenantId: string, type: CustomerType): Promise<string> {
    const prefix = type === 'CUSTOMER' ? 'M' : type === 'SUPPLIER' ? 'T' : 'H';
    const likePattern = `${prefix}-%`;
    const last = await this.prisma.client.customer.findFirst({
      where: { tenantId, code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNumber = 1;
    if (last) {
      const match = last.code.match(/-(\d+)$/);
      if (match) nextNumber = Number(match[1]) + 1;
    }
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Birden fazla cari için bakiye + hareket sayısı (N+1 önleme).
   */
  private async computeBalances(
    tenantId: string,
    customerIds: string[],
  ): Promise<Map<string, { balance: number; movementCount: number }>> {
    const result = new Map<string, { balance: number; movementCount: number }>();
    if (customerIds.length === 0) return result;

    const movements = await this.prisma.client.customerMovement.groupBy({
      by: ['customerId', 'type'],
      where: {
        tenantId,
        customerId: { in: customerIds },
        isDeleted: false,
        status: 'POSTED',
        reversedBy: { is: null },
      },
      _sum: { amountTry: true },
    });

    const countRows = await this.prisma.client.customerMovement.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        customerId: { in: customerIds },
        isDeleted: false,
      },
      _count: { _all: true },
    });

    const countMap = new Map(countRows.map((c) => [c.customerId, c._count._all]));

    for (const id of customerIds) {
      const debit = Number(movements.find((m) => m.customerId === id && m.type === 'DEBIT')?._sum.amountTry ?? 0);
      const credit = Number(movements.find((m) => m.customerId === id && m.type === 'CREDIT')?._sum.amountTry ?? 0);
      result.set(id, {
        balance: debit - credit,
        movementCount: countMap.get(id) ?? 0,
      });
    }
    return result;
  }

  private async computeSingleBalance(tenantId: string, customerId: string): Promise<{ balance: number; movementCount: number }> {
    const map = await this.computeBalances(tenantId, [customerId]);
    return map.get(customerId) ?? { balance: 0, movementCount: 0 };
  }

  private ensureTenantScope(tenantId: string): void {
    if (!tenantId || tenantId === 'SYSTEM') {
      throw new ForbiddenException('Bu işlem için firma seçili bir kullanıcı ile giriş yapmalısınız');
    }
  }

  private resolveMovementDetailRoute(customerId: string, movementId: string, refType: string, refId: string | null): string | null {
    if (refId && refType === 'SALE') return `/sales/${refId}`;
    if (refId && refType === 'COLLECTION') return `/collections/${refId}`;
    if (refId && refType === 'RETURN') return `/returns/${refId}`;
    return `/customers/${customerId}/movements/${movementId}`;
  }

  private isGenericMovementEditable(
    refType: string,
    refId: string | null,
    reversesId: string | null,
    reversedById: string | null,
  ): boolean {
    if (reversesId || reversedById) return false;
    if (refId && ['SALE', 'COLLECTION', 'RETURN'].includes(refType)) return false;
    return ['OPENING_BALANCE', 'ADJUST', 'TRANSFER'].includes(refType) || !refId;
  }

  private toMovementDto(m: {
    id: string;
    tenantId: string;
    customerId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: Prisma.Decimal | number;
    currency: string;
    exchangeRate: Prisma.Decimal | number;
    amountTry: Prisma.Decimal | number;
    movementDate: Date;
    dueDate: Date | null;
    refType: string;
    refId: string | null;
    refNumber: string | null;
    description: string | null;
    status: 'DRAFT' | 'POSTED' | 'PENDING' | 'CANCELLED';
    reversesId: string | null;
    reversedBy?: { id: string } | null;
    paymentMethodId: string | null;
    cashAccountId: string | null;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: m.id,
      tenantId: m.tenantId,
      customerId: m.customerId,
      type: m.type,
      amount: Number(m.amount),
      currency: m.currency,
      exchangeRate: Number(m.exchangeRate),
      amountTry: Number(m.amountTry),
      movementDate: m.movementDate.toISOString(),
      dueDate: m.dueDate?.toISOString() ?? null,
      refType: m.refType,
      refId: m.refId,
      refNumber: m.refNumber,
      description: m.description,
      status: m.status,
      reversesId: m.reversesId,
      reversedById: m.reversedBy?.id ?? null,
      paymentMethodId: m.paymentMethodId,
      cashAccountId: m.cashAccountId,
      isDeleted: m.isDeleted,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }

  private toDto(c: {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    contactName: string | null;
    type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
    status: 'ACTIVE' | 'PASSIVE' | 'BLOCKED';
    taxNumber: string | null;
    taxOffice: string | null;
    identityNumber: string | null;
    address: string | null;
    city: string | null;
    district: string | null;
    postalCode: string | null;
    country: string | null;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    website: string | null;
    iban: string | null;
    creditLimit: Prisma.Decimal | number;
    paymentTermDays: number;
    notes: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return {
      id: c.id,
      tenantId: c.tenantId,
      code: c.code,
      name: c.name,
      contactName: c.contactName,
      type: c.type,
      status: c.status,
      taxNumber: c.taxNumber,
      taxOffice: c.taxOffice,
      identityNumber: c.identityNumber,
      address: c.address,
      city: c.city,
      district: c.district,
      postalCode: c.postalCode,
      country: c.country,
      phone: c.phone,
      phone2: c.phone2,
      email: c.email,
      website: c.website,
      iban: c.iban,
      creditLimit: Number(c.creditLimit),
      paymentTermDays: c.paymentTermDays,
      notes: c.notes,
      isActive: c.isActive,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
