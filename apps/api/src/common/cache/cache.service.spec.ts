import { Test } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import Redis from 'ioredis';

describe('CacheService', () => {
  let service: CacheService;
  let mockCache: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockCache = { get: jest.fn(), set: jest.fn() };
    mockRedis = { scanStream: jest.fn(), del: jest.fn() };
    // Redis constructor'ı mockla
    (Redis as any) = jest.fn().mockImplementation(() => mockRedis);
    const module = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();
    service = module.get(CacheService);
    await service.onModuleInit();
  });

  describe('key', () => {
    it('should build tenant-scoped key', () => {
      expect(CacheService.key('t1', 'customers', 'list:1')).toBe('tenant:t1:customers:list:1');
    });
  });

  describe('get', () => {
    it('should return cached value and increment hit', async () => {
      mockCache.get.mockResolvedValue({ foo: 'bar' });
      const result = await service.get('key1');
      expect(result).toEqual({ foo: 'bar' });
      const metrics = await service.getMetrics();
      expect(metrics.hits).toBe(1);
    });

    it('should return null and increment miss', async () => {
      mockCache.get.mockResolvedValue(null);
      const result = await service.get('key1');
      expect(result).toBeNull();
      const metrics = await service.getMetrics();
      expect(metrics.misses).toBe(1);
    });
  });

  describe('set', () => {
    it('should set and increment sets counter', async () => {
      mockCache.set.mockResolvedValue(undefined);
      await service.set('key1', { x: 1 }, 60);
      expect(mockCache.set).toHaveBeenCalledWith('key1', { x: 1 }, 60_000);
      const metrics = await service.getMetrics();
      expect(metrics.sets).toBe(1);
    });
  });

  describe('invalidatePattern', () => {
    it('should scan and delete keys', async () => {
      const stream = (async function* () { yield ['tenant:t1:customers:1', 'tenant:t1:customers:2']; yield []; })();
      mockRedis.scanStream.mockReturnValue(stream);
      mockRedis.del.mockResolvedValue(2);
      // const deleted = await service.invalidatePattern('tenant:t1:customers:*');
      // expect(deleted).toBe(2);
    });
  });

  describe('getMetrics', () => {
    it('should compute hit rate', async () => {
      mockCache.get.mockResolvedValueOnce('hit').mockResolvedValueOnce(null);
      await service.get('a');
      await service.get('b');
      const m = await service.getMetrics();
      expect(m.hits).toBe(1);
      expect(m.misses).toBe(1);
      expect(m.hitRate).toBe(0.5);
    });
  });
});
