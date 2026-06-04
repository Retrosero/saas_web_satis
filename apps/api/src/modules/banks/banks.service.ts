import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BankAccount,
  BankAccountStatus,
  BankAccountType,
  BankTransaction,
  BankTransactionType,
  CreateBankAccountInput,
  CreateBankTransactionInput,
  CreatePosCollectionInput,
  CreatePosDeviceInput,
  PaginatedResponse,
  PosCollection,
  PosCollectionStatus,
  PosDevice,
  PosStatus,
} from '@saas/shared';
import { PrismaService } from '../../prisma/prisma.module.js';

@Injectable()
export class BanksService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // BANK ACCOUNTS
  // ==========================================================================

  async listAccounts(tenantId: string, params?: { search?: string; status?: BankAccountStatus; type?: BankAccountType }): Promise<(BankAccount & { balance: number; transactionCount: number })[]> {
    const where: any = { tenantId, isDeleted: false };
    if (params?.status) where.status = params.status;
    if (params?.type) where.type = params.type;
    if (params?.search) {
      where.OR = [
        { bankName: { contains: params.search, mode: 'insensitive' } },
        { accountName: { contains: params.search, mode: 'insensitive' } },
        { iban: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const accounts = await this.prisma.client.bankAccount.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { bankName: 'asc' }],
    });
    // Bakiye hesapla (event-sourced)
    const withBalance = await Promise.all(accounts.map(async (a) => {
      const txns = await this.prisma.client.bankTransaction.aggregate({
        where: { bankAccountId: a.id, isDeleted: false },
        _sum: { amountTry: true },
        _count: { id: true },
      });
      return {
        ...this.toAccountDto(a),
        balance: Number(txns._sum.amountTry ?? 0),
        transactionCount: txns._count.id,
      };
    }));
    return withBalance;
  }

  async getAccount(tenantId: string, id: string): Promise<BankAccount & { balance: number; recentTransactions: BankTransaction[] }> {
    const a = await this.prisma.client.bankAccount.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!a) throw new NotFoundException('Banka hesabı bulunamadı');
    const txns = await this.prisma.client.bankTransaction.aggregate({
      where: { bankAccountId: id, isDeleted: false },
      _sum: { amountTry: true },
    });
    const recent = await this.prisma.client.bankTransaction.findMany({
      where: { bankAccountId: id, isDeleted: false },
      orderBy: { txnDate: 'desc' },
      take: 10,
    });
    return { ...this.toAccountDto(a), balance: Number(txns._sum.amountTry ?? 0), recentTransactions: recent.map((t) => this.toTxnDto(t)) };
  }

  async createAccount(tenantId: string, input: CreateBankAccountInput, userId?: string): Promise<BankAccount> {
    if (input.isDefault) {
      // Diğer default'ları kaldır
      await this.prisma.client.bankAccount.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
    }
    const a = await this.prisma.client.bankAccount.create({
      data: { ...input, tenantId, createdById: userId },
    });
    return this.toAccountDto(a);
  }

  async updateAccount(tenantId: string, id: string, input: Partial<CreateBankAccountInput>, userId?: string): Promise<BankAccount> {
    const a = await this.prisma.client.bankAccount.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!a) throw new NotFoundException('Banka hesabı bulunamadı');
    if (input.isDefault) {
      await this.prisma.client.bankAccount.updateMany({ where: { tenantId, isDefault: true, NOT: { id } }, data: { isDefault: false } });
    }
    const updated = await this.prisma.client.bankAccount.update({
      where: { id },
      data: { ...input, updatedById: userId },
    });
    return this.toAccountDto(updated);
  }

  async deleteAccount(tenantId: string, id: string, userId?: string): Promise<void> {
    const a = await this.prisma.client.bankAccount.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!a) throw new NotFoundException('Banka hesabı bulunamadı');
    const txnCount = await this.prisma.client.bankTransaction.count({ where: { bankAccountId: id, isDeleted: false } });
    if (txnCount > 0) throw new BadRequestException('Hareket içeren banka hesabı silinemez');
    await this.prisma.client.bankAccount.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), updatedById: userId } });
  }

  // ==========================================================================
  // BANK TRANSACTIONS
  // ==========================================================================

  async listTransactions(tenantId: string, params: { page?: number; pageSize?: number; bankAccountId?: string; type?: BankTransactionType; customerId?: string; from?: Date; to?: Date; search?: string }): Promise<PaginatedResponse<BankTransaction>> {
    const { page = 1, pageSize = 25, bankAccountId, type, customerId, from, to, search } = params;
    const where: any = { tenantId, isDeleted: false };
    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (type) where.type = type;
    if (customerId) where.customerId = customerId;
    if (from || to) { where.txnDate = {}; if (from) where.txnDate.gte = from; if (to) where.txnDate.lte = to; }
    if (search) where.description = { contains: search, mode: 'insensitive' };

    const [total, items] = await Promise.all([
      this.prisma.client.bankTransaction.count({ where }),
      this.prisma.client.bankTransaction.findMany({
        where,
        orderBy: { txnDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { bankAccount: { select: { bankName: true, accountName: true } } },
      }),
    ]);
    return {
      data: items.map((t) => ({ ...this.toTxnDto(t), bankAccountName: t.bankAccount ? `${t.bankAccount.bankName} - ${t.bankAccount.accountName}` : '' })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  async createTransaction(tenantId: string, input: CreateBankTransactionInput, userId?: string): Promise<BankTransaction> {
    const account = await this.prisma.client.bankAccount.findFirst({ where: { id: input.bankAccountId, tenantId, isDeleted: false } });
    if (!account) throw new NotFoundException('Banka hesabı bulunamadı');

    const exchangeRate = input.exchangeRate ?? 1;
    const amountTry = input.amount * exchangeRate;

    // TRANSFER: 2 ayrı kayıt
    if (input.type === 'TRANSFER') {
      if (!input.counterBankAccountId) throw new BadRequestException('Virman için karşı hesap zorunlu');
      const counter = await this.prisma.client.bankAccount.findFirst({ where: { id: input.counterBankAccountId, tenantId, isDeleted: false } });
      if (!counter) throw new NotFoundException('Karşı hesap bulunamadı');
      if (counter.id === account.id) throw new BadRequestException('Aynı hesaba virman yapılamaz');

      return this.prisma.client.$transaction(async (tx) => {
        // Çıkış
        const out = await tx.bankTransaction.create({
          data: {
            tenantId, bankAccountId: account.id, txnDate: new Date(input.txnDate),
            type: 'WITHDRAWAL', amount: -Math.abs(input.amount), currency: input.currency, exchangeRate, amountTry: -Math.abs(amountTry),
            counterBankAccountId: counter.id, description: input.description ?? `Virman: ${account.accountName} → ${counter.accountName}`,
            refType: input.refType, refId: input.refId, refNumber: input.refNumber, createdById: userId,
          },
        });
        // Giriş
        await tx.bankTransaction.create({
          data: {
            tenantId, bankAccountId: counter.id, txnDate: new Date(input.txnDate),
            type: 'DEPOSIT', amount: Math.abs(input.amount), currency: input.currency, exchangeRate, amountTry: Math.abs(amountTry),
            counterBankAccountId: account.id, description: input.description ?? `Virman: ${account.accountName} → ${counter.accountName}`,
            refType: input.refType, refId: input.refId, refNumber: input.refNumber, createdById: userId,
          },
        });
        return this.toTxnDto(out);
      });
    }

    // Diğer tipler: signed amount
    let signed = input.amount;
    if (['WITHDRAWAL', 'PAYMENT', 'FEE'].includes(input.type)) signed = -Math.abs(input.amount);
    if (['DEPOSIT', 'COLLECTION', 'POS_COLLECTION', 'INTEREST'].includes(input.type)) signed = Math.abs(input.amount);

    const t = await this.prisma.client.bankTransaction.create({
      data: {
        tenantId, bankAccountId: input.bankAccountId, txnDate: new Date(input.txnDate),
        type: input.type, amount: signed, currency: input.currency, exchangeRate, amountTry: signed * exchangeRate,
        customerId: input.customerId, description: input.description,
        refType: input.refType, refId: input.refId, refNumber: input.refNumber, createdById: userId,
      },
    });
    return this.toTxnDto(t);
  }

  async reconcileTransaction(tenantId: string, id: string, userId?: string): Promise<BankTransaction> {
    const t = await this.prisma.client.bankTransaction.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!t) throw new NotFoundException('İşlem bulunamadı');
    const updated = await this.prisma.client.bankTransaction.update({
      where: { id }, data: { isReconciled: true, reconciledAt: new Date(), updatedById: userId },
    });
    return this.toTxnDto(updated);
  }

  // ==========================================================================
  // POS DEVICES
  // ==========================================================================

  async listPosDevices(tenantId: string): Promise<PosDevice[]> {
    const devices = await this.prisma.client.posDevice.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { name: 'asc' },
      include: { _count: { select: { collections: { where: { isDeleted: false } } } } },
    });
    return devices.map((d) => this.toPosDto(d));
  }

  async createPosDevice(tenantId: string, input: CreatePosDeviceInput, userId?: string): Promise<PosDevice> {
    const d = await this.prisma.client.posDevice.create({
      data: { ...input, tenantId, createdById: userId },
    });
    return this.toPosDto(d);
  }

  async updatePosDevice(tenantId: string, id: string, input: Partial<CreatePosDeviceInput> & { status?: PosStatus }, userId?: string): Promise<PosDevice> {
    const d = await this.prisma.client.posDevice.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!d) throw new NotFoundException('POS cihazı bulunamadı');
    const updated = await this.prisma.client.posDevice.update({ where: { id }, data: { ...input, updatedById: userId } });
    return this.toPosDto(updated);
  }

  // ==========================================================================
  // POS COLLECTIONS
  // ==========================================================================

  async listPosCollections(tenantId: string, params: { page?: number; pageSize?: number; posDeviceId?: string; status?: PosCollectionStatus; from?: Date; to?: Date }): Promise<PaginatedResponse<PosCollection>> {
    const { page = 1, pageSize = 25, posDeviceId, status, from, to } = params;
    const where: any = { tenantId, isDeleted: false };
    if (posDeviceId) where.posDeviceId = posDeviceId;
    if (status) where.status = status;
    if (from || to) { where.collectionDate = {}; if (from) where.collectionDate.gte = from; if (to) where.collectionDate.lte = to; }
    const [total, items] = await Promise.all([
      this.prisma.client.posCollection.count({ where }),
      this.prisma.client.posCollection.findMany({
        where, orderBy: { collectionDate: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
        include: { posDevice: { select: { name: true, posCode: true, commissionRate: true } } },
      }),
    ]);
    return {
      data: items.map((c) => ({ ...this.toPosCollectionDto(c), posDeviceName: c.posDevice?.name, posCode: c.posDevice?.posCode })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasNext: page * pageSize < total, hasPrev: page > 1 },
    };
  }

  async createPosCollection(tenantId: string, input: CreatePosCollectionInput, userId?: string): Promise<PosCollection> {
    const device = await this.prisma.client.posDevice.findFirst({ where: { id: input.posDeviceId, tenantId, isDeleted: false } });
    if (!device) throw new NotFoundException('POS cihazı bulunamadı');
    const commission = (input.amount * Number(device.commissionRate)) / 100;
    const netAmount = input.amount - commission;
    const settlementDate = new Date(input.collectionDate);
    settlementDate.setDate(settlementDate.getDate() + device.blockDays);

    const c = await this.prisma.client.posCollection.create({
      data: {
        tenantId, posDeviceId: device.id, bankAccountId: device.bankAccountId,
        collectionDate: new Date(input.collectionDate),
        customerId: input.customerId, customerName: input.customerName,
        amount: input.amount, commission, netAmount, installment: input.installment ?? 1,
        currency: 'TRY', status: 'PENDING', settlementDate,
        description: input.description, createdById: userId,
      },
    });
    return this.toPosCollectionDto(c);
  }

  async settlePosCollection(tenantId: string, id: string, userId?: string): Promise<PosCollection> {
    const c = await this.prisma.client.posCollection.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!c) throw new NotFoundException('POS tahsilatı bulunamadı');
    if (c.status !== 'PENDING') throw new BadRequestException('Sadece bekleyen tahsilatlar kapatılabilir');
    return this.prisma.client.$transaction(async (tx) => {
      // Banka hareketi oluştur (net tutar bankaya girer)
      await tx.bankTransaction.create({
        data: {
          tenantId, bankAccountId: c.bankAccountId, txnDate: new Date(),
          type: 'POS_COLLECTION', amount: c.netAmount, currency: c.currency, exchangeRate: 1, amountTry: c.netAmount,
          posCollectionId: c.id, refType: 'POS_COLLECTION', refId: c.id,
          description: `POS tahsilatı kapatma: ${c.customerName ?? ''}`.trim(),
          createdById: userId,
        },
      });
      return this.toPosCollectionDto(
        await tx.posCollection.update({ where: { id }, data: { status: 'SETTLED', updatedById: userId } }),
      );
    });
  }

  // ==========================================================================
  // COMMISSION REPORTING
  // ==========================================================================

  async posCommissionReport(tenantId: string, params: { from?: Date; to?: Date; posDeviceId?: string }): Promise<{
    totalGross: number; totalCommission: number; totalNet: number;
    byDevice: Array<{ posDeviceId: string; deviceName: string; count: number; gross: number; commission: number; net: number }>;
  }> {
    const where: any = { tenantId, isDeleted: false };
    if (params.posDeviceId) where.posDeviceId = params.posDeviceId;
    if (params.from || params.to) { where.collectionDate = {}; if (params.from) where.collectionDate.gte = params.from; if (params.to) where.collectionDate.lte = params.to; }
    const items = await this.prisma.client.posCollection.findMany({ where, include: { posDevice: { select: { id: true, name: true } } } });
    const totalGross = items.reduce((s, c) => s + Number(c.amount), 0);
    const totalCommission = items.reduce((s, c) => s + Number(c.commission), 0);
    const totalNet = items.reduce((s, c) => s + Number(c.netAmount), 0);
    const byDeviceMap = new Map<string, { posDeviceId: string; deviceName: string; count: number; gross: number; commission: number; net: number }>();
    for (const c of items) {
      const key = c.posDeviceId;
      const cur = byDeviceMap.get(key) ?? { posDeviceId: key, deviceName: c.posDevice?.name ?? '', count: 0, gross: 0, commission: 0, net: 0 };
      cur.count++;
      cur.gross += Number(c.amount);
      cur.commission += Number(c.commission);
      cur.net += Number(c.netAmount);
      byDeviceMap.set(key, cur);
    }
    return { totalGross, totalCommission, totalNet, byDevice: Array.from(byDeviceMap.values()) };
  }

  // ==========================================================================
  // DTO MAPPERS
  // ==========================================================================

  private toAccountDto(a: any): BankAccount {
    return {
      id: a.id, tenantId: a.tenantId,
      bankName: a.bankName, accountName: a.accountName,
      iban: a.iban, accountNumber: a.accountNumber,
      currency: a.currency, type: a.type, status: a.status,
      branchCode: a.branchCode, branchName: a.branchName, notes: a.notes,
      isDefault: a.isDefault,
       createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
    };
  }

  private toTxnDto(t: any): BankTransaction {
    return {
      id: t.id, tenantId: t.tenantId, bankAccountId: t.bankAccountId,
      txnDate: t.txnDate.toISOString(), type: t.type,
      amount: Number(t.amount), currency: t.currency,
      exchangeRate: Number(t.exchangeRate), amountTry: Number(t.amountTry),
      customerId: t.customerId, counterBankAccountId: t.counterBankAccountId,
      posCollectionId: t.posCollectionId, description: t.description,
      refType: t.refType, refId: t.refId, refNumber: t.refNumber,
      isReconciled: t.isReconciled, reconciledAt: t.reconciledAt?.toISOString() ?? null,
      isDeleted: t.isDeleted, createdById: t.createdById,
      createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
    } as any;
  }

  private toPosDto(d: any): PosDevice {
    return {
      id: d.id, tenantId: d.tenantId, bankAccountId: d.bankAccountId,
      name: d.name, posCode: d.posCode, commissionRate: Number(d.commissionRate),
      blockDays: d.blockDays, status: d.status, notes: d.notes,
      createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString(),
    } as any;
  }

  private toPosCollectionDto(c: any): PosCollection {
    return {
      id: c.id, tenantId: c.tenantId, posDeviceId: c.posDeviceId, bankAccountId: c.bankAccountId,
      collectionDate: c.collectionDate.toISOString(),
      customerId: c.customerId, customerName: c.customerName,
      amount: Number(c.amount), commission: Number(c.commission), netAmount: Number(c.netAmount),
      installment: c.installment, currency: c.currency, status: c.status,
      settlementDate: c.settlementDate?.toISOString() ?? null,
      description: c.description, refType: c.refType, refId: c.refId,
      isDeleted: c.isDeleted, createdById: c.createdById,
      createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
    } as any;
  }
}
