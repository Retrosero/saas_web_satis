import { Test } from '@nestjs/testing';
import { SearchService, INDEX_CUSTOMERS, INDEX_PRODUCTS } from './search.service';
import { PrismaService } from '../../prisma/prisma.module';
import { MeiliSearch } from 'meilisearch';

describe('SearchService', () => {
  let service: SearchService;
  let mockClient: any;
  let mockPrisma: any;

  beforeEach(async () => {
    mockClient = { health: jest.fn().mockResolvedValue({}), createIndex: jest.fn().mockResolvedValue({}), index: jest.fn() };
    mockPrisma = { client: { customer: { findMany: jest.fn() }, product: { findMany: jest.fn() }, sale: { findMany: jest.fn() }, quote: { findMany: jest.fn() } } };
    (MeiliSearch as any) = jest.fn().mockImplementation(() => mockClient);
    const module = await Test.createTestingModule({
      providers: [SearchService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(SearchService);
    await service.onModuleInit();
  });

  it('should be healthy after init', () => { expect(service.isHealthy()).toBe(true); });

  it('should return empty for short query', async () => {
    const r = await service.search('t1', 'a');
    expect(r.totalCount).toBe(0);
  });

  it('should build tenant-scoped search filter', async () => {
    const mockIdx = { search: jest.fn().mockResolvedValue({ hits: [] }), updateFilterableAttributes: jest.fn(), updateSearchableAttributes: jest.fn(), updateSortableAttributes: jest.fn(), addDocuments: jest.fn(), deleteDocument: jest.fn(), getStats: jest.fn() };
    // Her index() çağrısı için aynı mockIdx dön
    mockClient.index.mockReturnValue(mockIdx);
    // onModuleInit'te zaten indexes kuruldu, setupIndexes'i atla
    (service as any).indexes = { customers: mockIdx, products: mockIdx, sales: mockIdx, quotes: mockIdx };
    await service.search('t1', 'abc', 5);
    expect(mockIdx.search).toHaveBeenCalledWith('abc', expect.objectContaining({ filter: ['tenantId = "t1"'] }));
  });

  it('should reindex tenant data', async () => {
    const mockIdx = { addDocuments: jest.fn().mockResolvedValue({}), search: jest.fn(), updateFilterableAttributes: jest.fn(), updateSearchableAttributes: jest.fn(), updateSortableAttributes: jest.fn(), deleteDocument: jest.fn(), getStats: jest.fn() };
    mockClient.index.mockReturnValue(mockIdx);
    mockPrisma.client.customer.findMany.mockResolvedValue([{ id: 'c1', tenantId: 't1', name: 'Cust 1', code: 'C001', phone: '555', email: 'a@b.c', taxNumber: '123', isActive: true, createdAt: new Date() }]);
    mockPrisma.client.product.findMany.mockResolvedValue([]);
    mockPrisma.client.sale.findMany.mockResolvedValue([]);
    mockPrisma.client.quote.findMany.mockResolvedValue([]);
    const r = await service.reindexTenant('t1');
    expect(r.ok).toBe(true);
    expect(r.counts.customers).toBe(1);
  });
});
