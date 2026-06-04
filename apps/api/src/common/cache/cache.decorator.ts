import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_MODULE_METADATA = 'cache:module';
export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

export interface CacheKeyOptions {
  /** Modül adı (örn: 'customers'). key: 'tenant:{tenantId}:{module}:...' */
  module: string;
  /** TTL saniye olarak */
  ttl?: number;
  /** Key oluşturma fonksiyonu. İlk argümanı alır (string veya {req}). */
  keyFn?: (...args: any[]) => string;
  /** Bu endpoint'te cache'lenmez. (örn: write endpoint'leri) */
  skipIf?: (...args: any[]) => boolean;
  /** Invalidation pattern (write endpoint'lerde). Örn: 'tenant:{tenantId}:customers:*' */
  invalidate?: string | string[];
}

/** Metodun sonucunu cache'le. İlk parametre olarak req/user objesi almalı. */
export const Cacheable = (options: CacheKeyOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, options.keyFn ?? (() => propertyKey))(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, options.ttl ?? 60)(target, propertyKey, descriptor);
    SetMetadata(CACHE_MODULE_METADATA, options.module)(target, propertyKey, descriptor);
    SetMetadata('cache:skipIf', options.skipIf)(target, propertyKey, descriptor);
  };
};

/** Endpoint'te yazma sonrası invalidation tetikle. */
export const CacheEvict = (options: { module: string; pattern?: string | string[]; keyFn?: (...args: any[]) => string }) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_INVALIDATE_METADATA, options)(target, propertyKey, descriptor);
  };
};
