import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import { CreateCollectionDto } from './dto/collection.dto.js';
import type {
  Collection,
  CollectionStatus,
  CollectionType,
  PaginatedResponse,
} from '@saas/shared';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    input: {
      customerId: string;
      collectionDate: Date;
      type?: CollectionType;
      amount: number;
      linkedSaleId?: string;
      notes?: string;
      internalNotes?: string;
    },
    createdById?: string,
  ): Promise<Collection> {
    const customer = await (this.prisma.client as any).customer.findFirst({
      where: { id: input.customerId, tenantId, isDeleted: false },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı');

    if (input.amount <= 0) {
      throw new BadRequestException('Tutar sıfırdan büyük olmalı');
    }

    // Satış referans kontrolü (opsiyonel)
    if (input.linkedSaleId) {
      const sale = await (this.prisma.client as any).sale.findFirst({
        where: {
          id: input.linkedSaleId,
          tenantId,
          isDeleted: false,
          status: { in: ['CONFIRMED'] },
        },
      });
      if (!sale) throw new NotFoundException('Belirtilen satış bulunamadı veya onaylanmamış');
    }

    const collectionNumber = await this.generateNextCollectionNumber(tenantId);

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      const collection = await tx.collection.create({
        data: {
          tenantId,
          customerId: input.customerId,
          collectionNumber,
          collectionDate: input.collectionDate,
          type: input.type ?? 'CASH',
          status: 'PENDING',
          amount: input.amount,
          currency: 'TRY',
          exchangeRate: 1,
          linkedSaleId: input.linkedSaleId ?? null,
          customerName: customer.name,
          customerTaxNumber: customer.taxNumber,
          notes: input.notes ?? null,
          internalNotes: input.internalNotes ?? null,
          createdById: createdById ?? null,
        },
      });
      return this.toDto(collection);
    });
  }

  /**
   * Tahsilatı onayla (PENDING → CONFIRMED).
   * Otomatik: 1 CustomerMovement (CREDIT) + 1 CashMovement (IN)
   */
  async confirm(
    tenantId: string,
    collectionId: string,
    cashAccountId: string,
    confirmedById?: string,
  ): Promise<Collection> {
    if (!cashAccountId?.trim()) {
      throw new BadRequestException('Kasa/banka seçimi zorunlu');
    }

    const collection = await (this.prisma.client as any).collection.findFirst({
      where: { id: collectionId, tenantId, isDeleted: false },
    });
    if (!collection) throw new NotFoundException('Tahsilat bulunamadı');
    if (collection.status !== 'PENDING') {
      throw new ConflictException(`Sadece bekleyen tahsilatlar onaylanabilir (mevcut: ${collection.status})`);
    }

    // Kasa/banka kontrolü
    const cashAccount = await (this.prisma.client as any).cashAccount.findFirst({
      where: { id: cashAccountId, tenantId, isDeleted: false },
    });
    if (!cashAccount) throw new NotFoundException('Kasa/banka bulunamadı');

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      // 1. CustomerMovement (CREDIT) — müşteri alacaklandırılır
      await tx.customerMovement.create({
        data: {
          tenantId,
          customerId: collection.customerId,
          type: 'CREDIT',
          amount: Number(collection.amount),
          currency: collection.currency,
          exchangeRate: Number(collection.exchangeRate),
          amountTry: Number(collection.amount),
          movementDate: collection.collectionDate,
          refType: 'COLLECTION',
          refId: collection.id,
          refNumber: collection.collectionNumber,
          description: `Tahsilat: ${collection.collectionNumber} — ${collection.customerName}`,
          status: 'POSTED',
          createdById: confirmedById ?? null,
        },
      });

      // 2. CashMovement (IN)
      await tx.cashMovement.create({
        data: {
          tenantId,
          cashAccountId,
          type: 'IN',
          amount: Number(collection.amount),
          currency: collection.currency,
          exchangeRate: Number(collection.exchangeRate),
          amountTry: Number(collection.amount),
          movementDate: collection.collectionDate,
          refType: 'COLLECTION',
          refId: collection.id,
          refNumber: collection.collectionNumber,
          description: `Tahsilat: ${collection.collectionNumber} — ${collection.customerName}`,
          status: 'POSTED',
          createdById: confirmedById ?? null,
        },
      });

      const updated = await tx.collection.update({
        where: { id: collectionId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          confirmedById: confirmedById ?? null,
        },
      });
      return this.toDto(updated);
    });
  }

  /**
   * Tahsilat iptal et — ters kayıtla.
   * Onaylanmışsa: CustomerMovement ters + CashMovement ters
   * Bekliyorsa: sadece durum güncellemesi
   */
  async cancel(
    tenantId: string,
    collectionId: string,
    cancelledById?: string,
    reason?: string,
  ): Promise<Collection> {
    const collection = await (this.prisma.client as any).collection.findFirst({
      where: { id: collectionId, tenantId, isDeleted: false },
    });
    if (!collection) throw new NotFoundException('Tahsilat bulunamadı');
    if (collection.status === 'CANCELLED') {
      throw new ConflictException('Bu tahsilat zaten iptal edilmiş');
    }

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      if (collection.status === 'CONFIRMED') {
        // Önceki hareketleri bul
        const customerMovements = await tx.customerMovement.findMany({
          where: { tenantId, refId: collection.id, refType: 'COLLECTION', isDeleted: false },
        });
        const cashMovements = await tx.cashMovement.findMany({
          where: { tenantId, refId: collection.id, refType: 'COLLECTION', isDeleted: false },
        });

        // Ters customer movement
        for (const m of customerMovements) {
          await tx.customerMovement.create({
            data: {
              tenantId,
              customerId: collection.customerId,
              type: 'DEBIT',
              amount: m.amount,
              currency: m.currency,
              exchangeRate: m.exchangeRate,
              amountTry: m.amountTry,
              movementDate: new Date(),
              refType: 'COLLECTION_CANCEL',
              refId: collection.id,
              refNumber: `IPT-${collection.collectionNumber}`,
              description: `Tahsilat iptal: ${collection.collectionNumber}${reason ? ` — ${reason}` : ''}`,
              status: 'POSTED',
              reversesId: m.id,
              createdById: cancelledById ?? null,
            },
          });
        }

        // Ters cash movement
        for (const m of cashMovements) {
          await tx.cashMovement.create({
            data: {
              tenantId,
              cashAccountId: m.cashAccountId,
              type: 'OUT',
              amount: m.amount,
              currency: m.currency,
              exchangeRate: m.exchangeRate,
              amountTry: m.amountTry,
              movementDate: new Date(),
              refType: 'COLLECTION_CANCEL',
              refId: collection.id,
              refNumber: `IPT-${collection.collectionNumber}`,
              description: `Tahsilat iptal: ${collection.collectionNumber}`,
              status: 'POSTED',
              reversesId: m.id,
              createdById: cancelledById ?? null,
            },
          });
        }
      }

      const internalNotes = collection.internalNotes
        ? `${collection.internalNotes}\n[İptal sebebi] ${reason ?? '—'}`
        : `[İptal sebebi] ${reason ?? '—'}`;

      const updated = await tx.collection.update({
        where: { id: collectionId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledById: cancelledById ?? null,
          internalNotes,
        },
      });
      return this.toDto(updated);
    });
  }

  async list(
    tenantId: string,
    params: {
      page?: number;
      pageSize?: number;
      customerId?: string;
      status?: CollectionStatus;
      type?: CollectionType;
      from?: Date;
      to?: Date;
      search?: string;
    },
  ): Promise<PaginatedResponse<Collection>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const where: Record<string, unknown> = { tenantId, isDeleted: false };
    if (params.customerId) where.customerId = params.customerId;
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.from || params.to) {
      where.collectionDate = {};
      if (params.from) (where.collectionDate as Record<string, unknown>)['gte'] = params.from;
      if (params.to) (where.collectionDate as Record<string, unknown>)['lte'] = params.to;
    }
    if (params.search) {
      where.OR = [
        { collectionNumber: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      (this.prisma.client as any).collection.findMany({
        where,
        orderBy: { collectionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma.client as any).collection.count({ where }),
    ]);

    return {
      data: rows.map((r: any) => this.toDto(r)),
      pagination: {
        page, pageSize, total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }

  async findById(tenantId: string, id: string): Promise<Collection> {
    const r = await (this.prisma.client as any).collection.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!r) throw new NotFoundException('Tahsilat bulunamadı');
    return this.toDto(r);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const r = await (this.prisma.client as any).collection.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!r) throw new NotFoundException('Tahsilat bulunamadı');
    if (r.status !== 'PENDING') {
      throw new BadRequestException('Sadece bekleyen tahsilatlar silinebilir');
    }
    await (this.prisma.client as any).collection.update({
      where: { id },
      data: { isDeleted: true, isActive: false, deletedAt: new Date() },
    });
  }

  // ----- Private -----

  private async generateNextCollectionNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const last = await (this.prisma.client as any).collection.findFirst({
      where: { tenantId, collectionNumber: { startsWith: `CL-${year}-` } },
      orderBy: { collectionNumber: 'desc' },
      select: { collectionNumber: true },
    });
    let n = 1;
    if (last) {
      const m = last.collectionNumber.match(/-(\d+)$/);
      if (m) n = Number(m[1]) + 1;
    }
    return `CL-${year}-${String(n).padStart(6, '0')}`;
  }

  private num(v: unknown): number {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const parsed = Number(v);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (v && typeof v === 'object' && 'toString' in v) {
      const parsed = Number(v.toString());
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private toDto(r: any): Collection {
    return {
      id: r.id,
      tenantId: r.tenantId,
      collectionNumber: r.collectionNumber,
      collectionDate: new Date(r.collectionDate).toISOString(),
      customerId: r.customerId,
      customerName: r.customerName,
      customerTaxNumber: r.customerTaxNumber,
      type: r.type as CollectionType,
      status: r.status as CollectionStatus,
      amount: this.num(r.amount),
      currency: r.currency ?? 'TRY',
      exchangeRate: this.num(r.exchangeRate),
      linkedSaleId: r.linkedSaleId,
      notes: r.notes,
      internalNotes: r.internalNotes,
      cancelsCollectionId: r.cancelsCollectionId,
      isActive: r.isActive,
      isDeleted: r.isDeleted,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
      confirmedAt: r.confirmedAt ? new Date(r.confirmedAt).toISOString() : null,
      cancelledAt: r.cancelledAt ? new Date(r.cancelledAt).toISOString() : null,
    };
  }
}
