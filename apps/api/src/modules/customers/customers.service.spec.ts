import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma/prisma.module';

/**
 * CustomersService birim testleri.
 *
 * PrismaService mock'lanır — gerçek DB'ye dokunmadan business logic test edilir.
 * Özellikle kritik fonksiyonlar:
 *   - generateNextCode (sıralı kod üretimi, M-/T-/H-)
 *   - create + açılış bakiyesi hareketi oluşturma
 *   - soft delete (hareketi olan cari silinemez)
 *   - ekstre hesaplama (event-sourcing DEBIT/CREDIT toplam + bakiye)
 */
describe('CustomersService', () => {
  let service: CustomersService;
  let mockPrisma: {
    client: {
      customer: {
        findFirst: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        count: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
      };
      customerMovement: {
        count: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        groupBy: jest.Mock;
        aggregate: jest.Mock;
      };
    };
  };

  beforeEach(async () => {
    mockPrisma = {
      client: {
        customer: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        customerMovement: {
          count: jest.fn(),
          create: jest.fn(),
          findMany: jest.fn(),
          groupBy: jest.fn(),
          aggregate: jest.fn(),
        },
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CustomersService);
  });

  describe('create — cari kodu otomatik üretimi', () => {
    it('Müşteri tipi için "M-0001" kodu üretir', async () => {
      mockPrisma.client.customer.findFirst
        .mockResolvedValueOnce(null) // last code lookup (önce, generateNextCode)
        .mockResolvedValueOnce(null); // unique check (sonra)
      mockPrisma.client.customer.create.mockResolvedValue({
        id: 'c1',
        tenantId: 't1',
        code: 'M-0001',
        name: 'Test Müşteri',
        contactName: null,
        type: 'CUSTOMER',
        status: 'ACTIVE',
        taxNumber: null,
        taxOffice: null,
        identityNumber: null,
        address: null,
        city: null,
        district: null,
        postalCode: null,
        country: 'Türkiye',
        phone: null,
        phone2: null,
        email: null,
        website: null,
        iban: null,
        creditLimit: new Prisma.Decimal(0),
        paymentTermDays: 0,
        notes: null,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('t1', { name: 'Test Müşteri', type: 'CUSTOMER' });
      expect(result.code).toBe('M-0001');
    });

    it('Tedarikçi tipi için "T-0001" kodu üretir', async () => {
      mockPrisma.client.customer.findFirst
        .mockResolvedValueOnce(null) // last code lookup
        .mockResolvedValueOnce(null); // unique check
      mockPrisma.client.customer.create.mockResolvedValue({
        id: 'c2',
        tenantId: 't1',
        code: 'T-0001',
        name: 'Toptan Ltd.',
        contactName: null,
        type: 'SUPPLIER',
        status: 'ACTIVE',
        taxNumber: null,
        taxOffice: null,
        identityNumber: null,
        address: null,
        city: null,
        district: null,
        postalCode: null,
        country: 'Türkiye',
        phone: null,
        phone2: null,
        email: null,
        website: null,
        iban: null,
        creditLimit: new Prisma.Decimal(0),
        paymentTermDays: 0,
        notes: null,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('t1', { name: 'Toptan Ltd.', type: 'SUPPLIER' });
      expect(result.code).toBe('T-0001');
    });

    it('Son kod M-0003 ise sıradaki M-0004 olur', async () => {
      mockPrisma.client.customer.findFirst
        .mockResolvedValueOnce({ code: 'M-0003' }) // last code (generateNextCode ÖNCE)
        .mockResolvedValueOnce(null); // unique check (SONRA)
      mockPrisma.client.customer.create.mockResolvedValue({
        id: 'c4',
        tenantId: 't1',
        code: 'M-0004',
        name: 'Yeni',
        contactName: null,
        type: 'CUSTOMER',
        status: 'ACTIVE',
        taxNumber: null, taxOffice: null, identityNumber: null,
        address: null, city: null, district: null, postalCode: null,
        country: 'Türkiye', phone: null, phone2: null, email: null,
        website: null, iban: null,
        creditLimit: new Prisma.Decimal(0), paymentTermDays: 0, notes: null,
        isActive: true, isDeleted: false,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.create('t1', { name: 'Yeni', type: 'CUSTOMER' });
      expect(result.code).toBe('M-0004');
    });

    it('Aynı kod mevcutsa ConflictException fırlatır', async () => {
      mockPrisma.client.customer.findFirst.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        service.create('t1', { name: 'Test', type: 'CUSTOMER', code: 'M-0001' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('create — açılış bakiyesi', () => {
    it('Pozitif açılış bakiyesi → DEBIT hareket oluşturur (alacak)', async () => {
      mockPrisma.client.customer.findFirst
        .mockResolvedValueOnce(null) // last code
        .mockResolvedValueOnce(null); // unique check
      mockPrisma.client.customer.create.mockResolvedValue({
        id: 'c1', tenantId: 't1', code: 'M-0001', name: 'X',
        contactName: null, type: 'CUSTOMER', status: 'ACTIVE',
        taxNumber: null, taxOffice: null, identityNumber: null,
        address: null, city: null, district: null, postalCode: null,
        country: 'Türkiye', phone: null, phone2: null, email: null,
        website: null, iban: null,
        creditLimit: new Prisma.Decimal(0), paymentTermDays: 0, notes: null,
        isActive: true, isDeleted: false,
        createdAt: new Date(), updatedAt: new Date(),
      });
      mockPrisma.client.customerMovement.create.mockResolvedValue({});

      await service.create('t1', { name: 'X', type: 'CUSTOMER', openingBalance: 500 });

      expect(mockPrisma.client.customerMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'DEBIT',
            amount: new Prisma.Decimal(500),
            refType: 'OPENING_BALANCE',
            status: 'POSTED',
          }),
        }),
      );
    });

    it('Negatif açılış bakiyesi → CREDIT hareket oluşturur (borç)', async () => {
      mockPrisma.client.customer.findFirst
        .mockResolvedValueOnce(null) // last code
        .mockResolvedValueOnce(null); // unique check
      mockPrisma.client.customer.create.mockResolvedValue({
        id: 'c1', tenantId: 't1', code: 'M-0001', name: 'X',
        contactName: null, type: 'CUSTOMER', status: 'ACTIVE',
        taxNumber: null, taxOffice: null, identityNumber: null,
        address: null, city: null, district: null, postalCode: null,
        country: 'Türkiye', phone: null, phone2: null, email: null,
        website: null, iban: null,
        creditLimit: new Prisma.Decimal(0), paymentTermDays: 0, notes: null,
        isActive: true, isDeleted: false,
        createdAt: new Date(), updatedAt: new Date(),
      });
      mockPrisma.client.customerMovement.create.mockResolvedValue({});

      await service.create('t1', { name: 'X', type: 'CUSTOMER', openingBalance: -250 });

      expect(mockPrisma.client.customerMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'CREDIT',
            amount: new Prisma.Decimal(250),
          }),
        }),
      );
    });

    it('Sıfır açılış bakiyesi → hareket oluşturmaz', async () => {
      mockPrisma.client.customer.findFirst
        .mockResolvedValueOnce(null) // last code
        .mockResolvedValueOnce(null); // unique check
      mockPrisma.client.customer.create.mockResolvedValue({
        id: 'c1', tenantId: 't1', code: 'M-0001', name: 'X',
        contactName: null, type: 'CUSTOMER', status: 'ACTIVE',
        taxNumber: null, taxOffice: null, identityNumber: null,
        address: null, city: null, district: null, postalCode: null,
        country: 'Türkiye', phone: null, phone2: null, email: null,
        website: null, iban: null,
        creditLimit: new Prisma.Decimal(0), paymentTermDays: 0, notes: null,
        isActive: true, isDeleted: false,
        createdAt: new Date(), updatedAt: new Date(),
      });

      await service.create('t1', { name: 'X', type: 'CUSTOMER', openingBalance: 0 });

      expect(mockPrisma.client.customerMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('remove — soft delete güvenliği', () => {
    it('Cari bulunamazsa NotFoundException fırlatır', async () => {
      mockPrisma.client.customer.findFirst.mockResolvedValueOnce(null);

      await expect(service.remove('t1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('Hareketi olan cari silinemez (BadRequestException)', async () => {
      mockPrisma.client.customer.findFirst.mockResolvedValueOnce({ id: 'c1' });
      mockPrisma.client.customerMovement.count.mockResolvedValueOnce(5);

      await expect(service.remove('t1', 'c1')).rejects.toThrow(BadRequestException);
    });

    it('Hareketi olmayan cari silinebilir (soft delete)', async () => {
      mockPrisma.client.customer.findFirst.mockResolvedValueOnce({ id: 'c1' });
      mockPrisma.client.customerMovement.count.mockResolvedValueOnce(0);
      mockPrisma.client.customer.update.mockResolvedValueOnce({});

      await expect(service.remove('t1', 'c1')).resolves.toBeUndefined();
      expect(mockPrisma.client.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1' },
          data: expect.objectContaining({ isDeleted: true, isActive: false }),
        }),
      );
    });
  });

  describe('findById — tenant izolasyonu', () => {
    it('Mevcut cariyi döner', async () => {
      const c = {
        id: 'c1', tenantId: 't1', code: 'M-0001', name: 'X',
        contactName: null, type: 'CUSTOMER' as const, status: 'ACTIVE' as const,
        taxNumber: null, taxOffice: null, identityNumber: null,
        address: null, city: null, district: null, postalCode: null,
        country: 'Türkiye', phone: null, phone2: null, email: null,
        website: null, iban: null,
        creditLimit: new Prisma.Decimal(0), paymentTermDays: 0, notes: null,
        isActive: true, isDeleted: false,
        createdAt: new Date(), updatedAt: new Date(),
      };
      mockPrisma.client.customer.findFirst.mockResolvedValueOnce(c);
      // Bakiye hesabı için groupBy
      mockPrisma.client.customerMovement.groupBy
        .mockResolvedValueOnce([]) // balance groupBy
        .mockResolvedValueOnce([]); // count groupBy

      const result = await service.findById('t1', 'c1');
      expect(result.code).toBe('M-0001');
      expect(result.balance).toBe(0);
      expect(result.movementCount).toBe(0);
    });

    it('Olmayan cari için NotFoundException', async () => {
      mockPrisma.client.customer.findFirst.mockResolvedValueOnce(null);

      await expect(service.findById('t1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatement — event-sourcing bakiye hesabı', () => {
    it('DEBIT toplam > CREDIT toplam → pozitif bakiye (alacak)', async () => {
      const c = {
        id: 'c1', tenantId: 't1', code: 'M-0001', name: 'X',
        contactName: null, type: 'CUSTOMER' as const, status: 'ACTIVE' as const,
        taxNumber: null, taxOffice: null, identityNumber: null,
        address: null, city: null, district: null, postalCode: null,
        country: 'Türkiye', phone: null, phone2: null, email: null,
        website: null, iban: null,
        creditLimit: new Prisma.Decimal(0), paymentTermDays: 0, notes: null,
        isActive: true, isDeleted: false,
        createdAt: new Date(), updatedAt: new Date(),
      };
      mockPrisma.client.customer.findFirst.mockResolvedValueOnce(c);
      mockPrisma.client.customerMovement.findMany.mockResolvedValueOnce([
        {
          id: 'm1',
          customerId: 'c1',
          type: 'DEBIT' as const,
          amount: new Prisma.Decimal(1000),
          refType: 'SALE' as const,
          refNumber: 'S-001',
          description: null,
          movementDate: new Date(),
          reversesId: null,
        },
      ]);
      // groupBy: type'a göre toplam
      mockPrisma.client.customerMovement.groupBy.mockResolvedValueOnce([
        { type: 'DEBIT' as const, _sum: { amountTry: new Prisma.Decimal(1000) } },
        { type: 'CREDIT' as const, _sum: { amountTry: new Prisma.Decimal(300) } },
      ]);

      const result = await service.getStatement('t1', 'c1', {});
      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(300);
      expect(result.balance).toBe(700); // 1000 - 300
    });
  });
});
