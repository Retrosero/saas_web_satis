import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../../prisma/prisma.module';

describe('QuotesService', () => {
  let service: QuotesService;
  let mockPrisma: any;

  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const customerId = 'customer-1';

  const mockQuote = {
    id: 'q-1',
    tenantId, quoteNumber: 'TKL-00000001', customerId, customerName: 'ABC Ltd.',
    quoteDate: new Date('2026-01-01'), validUntil: new Date('2026-12-31'),
    currency: 'TRY', subTotal: 100, discountRate: 0, discountAmount: 0, vatTotal: 20, grandTotal: 120,
    status: 'DRAFT', createdById: userId, createdAt: new Date(), updatedAt: new Date(),
    items: [{ productId: 'p-1', productCode: 'P1', productName: 'Ürün 1', quantity: 10, unitPrice: 10, vatRate: 20, discountRate: 0, lineTotal: 120, sortOrder: 0 }],
  };

  beforeEach(async () => {
    mockPrisma = {
      client: {
        quote: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
        quoteItem: { create: jest.fn() },
        quoteStatusLog: { create: jest.fn() },
        customer: { findFirst: jest.fn() },
        order: { create: jest.fn() },
        orderItem: { createMany: jest.fn() },
        sale: { create: jest.fn() },
        saleItem: { createMany: jest.fn() },
      },
    };
    const module = await Test.createTestingModule({
      providers: [QuotesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(QuotesService);
  });

  describe('list', () => {
    it('should return paginated quotes', async () => {
      mockPrisma.client.quote.findMany.mockResolvedValue([mockQuote]);
      mockPrisma.client.quote.count.mockResolvedValue(1);
      const result = await service.list(tenantId, { page: 1, pageSize: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply status filter', async () => {
      mockPrisma.client.quote.findMany.mockResolvedValue([]);
      mockPrisma.client.quote.count.mockResolvedValue(0);
      await service.list(tenantId, { status: 'DRAFT' as any });
      expect(mockPrisma.client.quote.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'DRAFT' }) }));
    });
  });

  describe('get', () => {
    it('should return quote with items', async () => {
      mockPrisma.client.quote.findFirst.mockResolvedValue(mockQuote);
      const result = await service.get(tenantId, 'q-1');
      expect(result.id).toBe('q-1');
      expect(result.grandTotal).toBe(120);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.client.quote.findFirst.mockResolvedValue(null);
      await expect(service.get(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should throw BadRequest when no items', async () => {
      await expect(service.create(tenantId, { customerId, quoteDate: '2026-01-01', validUntil: '2026-12-31', items: [] } as any, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFound when customer not found', async () => {
      mockPrisma.client.customer.findFirst.mockResolvedValue(null);
      await expect(service.create(tenantId, { customerId: 'missing', quoteDate: '2026-01-01', validUntil: '2026-12-31', items: [{ productId: 'p1', productName: 'X', quantity: 1, unitPrice: 10, vatRate: 20 }] } as any, userId)).rejects.toThrow(NotFoundException);
    });

    it('should create quote with calculated totals', async () => {
      mockPrisma.client.customer.findFirst.mockResolvedValue({ id: customerId, name: 'ABC' });
      mockPrisma.client.quote.create.mockResolvedValue({ ...mockQuote });
      const result = await service.create(tenantId, { customerId, quoteDate: '2026-01-01', validUntil: '2026-12-31', items: [{ productId: 'p1', productName: 'X', quantity: 10, unitPrice: 10, vatRate: 20, discountRate: 0 }] } as any, userId);
      expect(result.customerName).toBe('ABC Ltd.');
      expect(mockPrisma.client.quoteStatusLog.create).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should reject conversion on already-converted quote', async () => {
      mockPrisma.client.quote.findFirst.mockResolvedValue({ ...mockQuote, status: 'CONVERTED_TO_ORDER' });
      await expect(service.updateStatus(tenantId, 'q-1', 'ACCEPTED' as any, userId)).rejects.toThrow(BadRequestException);
    });

    it('should set sentAt on SENT transition', async () => {
      mockPrisma.client.quote.findFirst.mockResolvedValue(mockQuote);
      mockPrisma.client.quote.update.mockResolvedValue({ ...mockQuote, status: 'SENT', sentAt: new Date() });
      const result = await service.updateStatus(tenantId, 'q-1', 'SENT' as any, userId);
      expect(result.status).toBe('SENT');
    });
  });

  describe('convertToOrder', () => {
    it('should reject expired quote', async () => {
      mockPrisma.client.quote.findFirst.mockResolvedValue({ ...mockQuote, validUntil: new Date('2020-01-01'), items: [] });
      await expect(service.convertToOrder(tenantId, 'q-1', userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should soft delete', async () => {
      mockPrisma.client.quote.findFirst.mockResolvedValue(mockQuote);
      mockPrisma.client.quote.update.mockResolvedValue({});
      await service.delete(tenantId, 'q-1');
      expect(mockPrisma.client.quote.update).toHaveBeenCalledWith({ where: { id: 'q-1' }, data: expect.objectContaining({ isDeleted: true }) });
    });

    it('should throw NotFound when missing', async () => {
      mockPrisma.client.quote.findFirst.mockResolvedValue(null);
      await expect(service.delete(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
