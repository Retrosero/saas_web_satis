import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis!: Redis;
  private hits = 0;
  private misses = 0;
  private sets = 0;
  private deletes = 0;
  private readonly metricsKey = '__cache__metrics__';

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });
    try {
      await this.redis.connect();
      this.logger.log(`Redis bağlantısı kuruldu: ${redisUrl}`);
    } catch (e: any) {
      this.logger.warn(`Redis bağlantısı kurulamadı (${e.message}), cache pasif`);
    }
  }

  async onModuleDestroy() { try { await this.redis?.quit(); } catch { /* ignore */ } }

  /** Tenant-scoped cache key. Pattern: tenant:{tenantId}:{module}:{key} */
  static key(tenantId: string, module: string, key: string): string { return `tenant:${tenantId}:${module}:${key}`; }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const v = await this.cache.get<T>(key);
      if (v == null) { this.misses++; return null; }
      this.hits++;
      return v;
    } catch { return null; }
  }

  async set<T = any>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    try { await this.cache.set(key, value, ttlSeconds * 1000); this.sets++; } catch { /* ignore */ }
  }

  /** Bir tenant'ın tüm cache'ini sil (modül bazlı invalidation) */
  async invalidateTenant(tenantId: string, module?: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      const pattern = module ? `tenant:${tenantId}:${module}:*` : `tenant:${tenantId}:*`;
      const stream = this.redis.scanStream({ match: pattern, count: 100 });
      let deleted = 0;
      for await (const keys of stream) {
        if ((keys as string[]).length > 0) {
          await this.redis.del(...(keys as string[]));
          deleted += (keys as string[]).length;
        }
      }
      this.deletes += deleted;
      return deleted;
    } catch { return 0; }
  }

  /** Pattern ile sil (örn: tenant:abc:customers:*) */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      const stream = this.redis.scanStream({ match: pattern, count: 100 });
      let deleted = 0;
      for await (const keys of stream) {
        if ((keys as string[]).length > 0) {
          await this.redis.del(...(keys as string[]));
          deleted += (keys as string[]).length;
        }
      }
      this.deletes += deleted;
      return deleted;
    } catch { return 0; }
  }

  async getMetrics() {
    const total = this.hits + this.misses;
    return { hits: this.hits, misses: this.misses, sets: this.sets, deletes: this.deletes, hitRate: total === 0 ? 0 : this.hits / total, total };
  }

  async resetMetrics() { this.hits = 0; this.misses = 0; this.sets = 0; this.deletes = 0; }

  async ping(): Promise<boolean> {
    try { return (await this.redis?.ping()) === 'PONG'; } catch { return false; }
  }
}
