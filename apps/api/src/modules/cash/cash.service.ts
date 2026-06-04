import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module.js';
import { CreateCashAccountDto, CreateCashMovementDto, UpdateCashAccountDto } from './dto/cash.dto.js';
import type {
  CashAccount,
  CashAccountStatus,
  CashAccountType,
  CashMovement,
  CashMovementType,
  PaginatedResponse,
} from '@saas/shared';

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================
  // CASH ACCOUNTS
  // ========================

  async createAccount(
    tenantId: string,
    input: {
      code: string;
      name: string;
      type: CashAccountType;
      status?: CashAccountStatus;
      currency?: string;
      iban?: string;
      bankName?: string;
      bankBranch?: string;
      accountHolder?: string;
      isDefault?: boolean;
      notes?: string;
    },
    createdById?: string,
  ): Promise<CashAccount> {
    const existing = await (this.prisma.client as any).cashAccount.findFirst({
      where: { tenantId, code: input.code, isDeleted: false },
    });
    if (existing) throw new ConflictException(`Kasa kodu "${input.code}" zaten kullanılıyor`);

    // Sadece 1 tane default olabilir
    if (input.isDefault) {
      await (this.prisma.client as any).cashAccount.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await (this.prisma.client as any).cashAccount.create({
      data: {
        tenantId,
        code: input.code,
        name: input.name,
        type: input.type,
        status: input.status ?? 'ACTIVE',
        currency: input.currency ?? 'TRY',
        iban: input.iban ?? null,
        bankName: input.bankName ?? null,
        bankBranch: input.bankBranch ?? null,
        accountHolder: input.accountHolder ?? null,
        isDefault: input.isDefault ?? false,
        notes: input.notes ?? null,
      },
    });
    return this.accountToDto(account);
  }

  async listAccounts(
    tenantId: string,
    params?: { type?: CashAccountType; status?: CashAccountStatus; search?: string },
  ): Promise<PaginatedResponse<CashAccount>> {
    const where: Record<string, unknown> = { tenantId, isDeleted: false };
    if (params?.type) where.type = params.type;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
        { bankName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const accounts = await (this.prisma.client as any).cashAccount.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });

    // Her hesap için bakiye hesapla (event-sourced)
    const withBalance = await Promise.all(
      accounts.map(async (acc: any) => {
        const in_ = await this.getAccountBalance(acc.id, 'IN');
        const out = await this.getAccountBalance(acc.id, 'OUT');
        const balance = in_ - out;
        return { ...this.accountToDto(acc), balance, movementCount: 0 };
      }),
    );

    return {
      data: withBalance,
      pagination: { page: 1, pageSize: 100, total: withBalance.length, totalPages: 1, hasNext: false, hasPrev: false },
    };
  }

  async findAccount(tenantId: string, id: string): Promise<CashAccount> {
    const account = await (this.prisma.client as any).cashAccount.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!account) throw new NotFoundException('Kasa/banka bulunamadı');

    const in_ = await this.getAccountBalance(id, 'IN');
    const out = await this.getAccountBalance(id, 'OUT');
    const balance = in_ - out;
    const count = await (this.prisma.client as any).cashMovement.count({ where: { cashAccountId: id, isDeleted: false } });
    return { ...this.accountToDto(account), balance, movementCount: count };
  }

  async updateAccount(
    tenantId: string,
    id: string,
    input: Partial<{
      name: string;
      status: CashAccountStatus;
      iban: string;
      bankName: string;
      bankBranch: string;
      accountHolder: string;
      isDefault: boolean;
      notes: string;
    }>,
  ): Promise<CashAccount> {
    const account = await (this.prisma.client as any).cashAccount.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!account) throw new NotFoundException('Kasa/banka bulunamadı');

    if (input.isDefault && !account.isDefault) {
      await (this.prisma.client as any).cashAccount.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await (this.prisma.client as any).cashAccount.update({
      where: { id },
      data: input,
    });
    const in_ = await this.getAccountBalance(id, 'IN');
    const out = await this.getAccountBalance(id, 'OUT');
    return { ...this.accountToDto(updated), balance: in_ - out, movementCount: 0 };
  }

  async deactivateAccount(tenantId: string, id: string): Promise<CashAccount> {
    const account = await (this.prisma.client as any).cashAccount.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!account) throw new NotFoundException('Kasa/banka bulunamadı');

    // Hareketi olan pasif yapılamaz
    const movementCount = await (this.prisma.client as any).cashMovement.count({
      where: { cashAccountId: id, isDeleted: false },
    });
    if (movementCount > 0) {
      throw new ConflictException('Hareketi olan kasa/banka pasif yapılamaz. Önce hareketleri iptal edin.');
    }

    const updated = await (this.prisma.client as any).cashAccount.update({
      where: { id },
      data: { status: 'PASSIVE', isActive: false },
    });
    return this.accountToDto(updated);
  }

  // ========================
  // CASH MOVEMENTS
  // ========================

  async createMovement(
    tenantId: string,
    input: {
      cashAccountId: string;
      type: CashMovementType;
      amount: number;
      currency?: string;
      movementDate?: Date;
      refType?: string;
      refId?: string;
      description?: string;
      transferToAccountId?: string;
      customerId?: string;
    },
    createdById?: string,
  ): Promise<CashMovement> {
    const account = await (this.prisma.client as any).cashAccount.findFirst({
      where: { id: input.cashAccountId, tenantId, isDeleted: false, status: 'ACTIVE' },
    });
    if (!account) throw new NotFoundException('Kasa/banka bulunamadı veya pasif');

    if (input.type === 'TRANSFER') {
      if (!input.transferToAccountId) {
        throw new BadRequestException('Transfer için hedef hesap ID zorunludur');
      }
      const targetAccount = await (this.prisma.client as any).cashAccount.findFirst({
        where: { id: input.transferToAccountId, tenantId, isDeleted: false },
      });
      if (!targetAccount) throw new NotFoundException('Hedef kasa/banka bulunamadı');
    }

    if (input.customerId) {
      const customer = await (this.prisma.client as any).customer.findFirst({
        where: { id: input.customerId, tenantId, isDeleted: false },
      });
      if (!customer) throw new NotFoundException('Cari bulunamadı');
    }

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      const movement = await tx.cashMovement.create({
        data: {
          tenantId,
          cashAccountId: input.cashAccountId,
          type: input.type,
          amount: input.amount,
          currency: input.currency ?? 'TRY',
          exchangeRate: 1,
          amountTry: input.amount,
          movementDate: input.movementDate ?? new Date(),
          refType: input.refType ?? 'ADJUST',
          refId: input.refId ?? null,
          refNumber: `CM-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`,
          description: input.description ?? null,
          status: 'POSTED',
          transferToAccountId: input.transferToAccountId ?? null,
          customerId: input.customerId ?? null,
          createdById: createdById ?? null,
        },
      });

      // TRANSFER için ters kayıt (OUT hedef = IN kaynak)
      if (input.type === 'TRANSFER' && input.transferToAccountId) {
        await tx.cashMovement.create({
          data: {
            tenantId,
            cashAccountId: input.transferToAccountId,
            type: 'IN',
            amount: input.amount,
            currency: input.currency ?? 'TRY',
            exchangeRate: 1,
            amountTry: input.amount,
            movementDate: input.movementDate ?? new Date(),
            refType: 'TRANSFER',
            refId: movement.id,
            refNumber: `TR-${String(Date.now()).slice(-8)}`,
            description: `${account.name} → Transfer`,
            status: 'POSTED',
            reversesId: movement.id,
            createdById: createdById ?? null,
          },
        });
      }

      return this.movementToDto(movement);
    });
  }

  async listMovements(
    tenantId: string,
    params?: {
      cashAccountId?: string;
      type?: CashMovementType;
      from?: Date;
      to?: Date;
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<PaginatedResponse<CashMovement>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 50;
    const where: Record<string, unknown> = { tenantId, isDeleted: false };
    if (params?.cashAccountId) where.cashAccountId = params.cashAccountId;
    if (params?.type) where.type = params.type;
    if (params?.from || params?.to) {
      where.movementDate = {};
      if (params?.from) (where.movementDate as Record<string, unknown>)['gte'] = params.from;
      if (params?.to) (where.movementDate as Record<string, unknown>)['lte'] = params.to;
    }
    if (params?.search) {
      where.OR = [
        { refNumber: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      (this.prisma.client as any).cashMovement.findMany({
        where,
        orderBy: { movementDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma.client as any).cashMovement.count({ where }),
    ]);

    return {
      data: rows.map((r: any) => this.movementToDto(r)),
      pagination: {
        page, pageSize, total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }

  async reverseMovement(tenantId: string, movementId: string, createdById?: string): Promise<CashMovement> {
    const original = await (this.prisma.client as any).cashMovement.findFirst({
      where: { id: movementId, tenantId, isDeleted: false },
    });
    if (!original) throw new NotFoundException('Hareket bulunamadı');
    if (original.reversesId) throw new ConflictException('Bu hareket zaten ters kayıt');
    if (original.status === 'CANCELLED') throw new ConflictException('Hareket zaten iptal edilmiş');

    const reversed = await (this.prisma.client as any).cashMovement.create({
      data: {
        tenantId,
        cashAccountId: original.cashAccountId,
        type: original.type === 'IN' ? 'OUT' : 'IN',
        amount: Number(original.amount),
        currency: original.currency,
        exchangeRate: Number(original.exchangeRate),
        amountTry: Number(original.amountTry),
        movementDate: new Date(),
        refType: original.refType,
        refId: original.refId,
        refNumber: `R-${original.refNumber ?? original.id.slice(0, 8)}`,
        description: `TERS: ${original.description ?? '—'}`,
        status: 'POSTED',
        transferToAccountId: original.transferToAccountId,
        reversesId: original.id,
        createdById: createdById ?? null,
      },
    });

    await (this.prisma.client as any).cashMovement.update({
      where: { id: movementId },
      data: { status: 'CANCELLED' },
    });

    return this.movementToDto(reversed);
  }

  // ========================
  // PRIVATE
  // ========================

  private async getAccountBalance(cashAccountId: string, type: 'IN' | 'OUT'): Promise<number> {
    const result = await (this.prisma.client as any).cashMovement.aggregate({
      where: {
        cashAccountId,
        type,
        isDeleted: false,
        status: { in: ['POSTED', 'DRAFT'] },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private num(v: unknown): number {
    return typeof v === 'number' ? v : 0;
  }

  private accountToDto(a: any): CashAccount {
    return {
      id: a.id,
      tenantId: a.tenantId,
      code: a.code,
      name: a.name,
      type: a.type as CashAccountType,
      status: a.status as CashAccountStatus,
      currency: a.currency ?? 'TRY',
      iban: a.iban,
      bankName: a.bankName,
      bankBranch: a.bankBranch,
      accountHolder: a.accountHolder,
      isDefault: a.isDefault,
      notes: a.notes,
      isActive: a.isActive,
      isDeleted: a.isDeleted,
      createdAt: new Date(a.createdAt).toISOString(),
      updatedAt: new Date(a.updatedAt).toISOString(),
    };
  }

  private movementToDto(m: any): CashMovement {
    return {
      id: m.id,
      tenantId: m.tenantId,
      cashAccountId: m.cashAccountId,
      type: m.type as CashMovementType,
      amount: this.num(m.amount),
      currency: m.currency ?? 'TRY',
      exchangeRate: this.num(m.exchangeRate),
      amountTry: this.num(m.amountTry),
      movementDate: new Date(m.movementDate).toISOString(),
      refType: m.refType ?? 'ADJUST',
      refId: m.refId ?? null,
      refNumber: m.refNumber ?? null,
      description: m.description ?? null,
      status: (m.status as 'DRAFT' | 'POSTED' | 'PENDING' | 'CANCELLED') ?? 'POSTED',
      transferToAccountId: m.transferToAccountId,
      customerId: m.customerId,
      customerMovementId: m.customerMovementId ?? null,
      paymentMethodId: m.paymentMethodId ?? null,
      reversesId: m.reversesId ?? null,
      isDeleted: m.isDeleted,
      createdById: m.createdById ?? null,
      createdAt: new Date(m.createdAt).toISOString(),
      updatedAt: new Date(m.updatedAt).toISOString(),
    };
  }
}