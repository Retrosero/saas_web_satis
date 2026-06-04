import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA, CACHE_MODULE_METADATA, CACHE_INVALIDATE_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector, private readonly cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const keyFn = this.reflector.get<((...args: any[]) => string) | undefined>(CACHE_KEY_METADATA, context.getHandler());
    const ttl = this.reflector.get<number | undefined>(CACHE_TTL_METADATA, context.getHandler()) ?? 60;
    const module = this.reflector.get<string | undefined>(CACHE_MODULE_METADATA, context.getHandler());
    const skipIf = this.reflector.get<((...args: any[]) => boolean) | undefined>('cache:skipIf', context.getHandler());
    const invalidate = this.reflector.get<any>(CACHE_INVALIDATE_METADATA, context.getHandler());

    const req = context.switchToHttp().getRequest();
    const tenantId: string = req?.user?.tenantId ?? 'public';
    const args = [req];

    if (skipIf && skipIf(...args)) {
      return this.applyInvalidation(next, invalidate, req);
    }

    if (!keyFn) {
      return this.applyInvalidation(next, invalidate, req);
    }

    const cacheKey = CacheService.key(tenantId, module ?? 'default', keyFn(...args));

    // READ: cache check
    if (req.method === 'GET') {
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) return of(cached);
      return next.handle().pipe(tap(async (data) => {
        if (data !== undefined && data !== null) await this.cacheService.set(cacheKey, data, ttl);
      }));
    }

    // WRITE: invalidate
    return this.applyInvalidation(next, invalidate, req);
  }

  private applyInvalidation(next: CallHandler, invalidate: any, req: any): Observable<any> {
    if (!invalidate) return next.handle();
    return next.handle().pipe(tap(async () => {
      const tenantId = req?.user?.tenantId ?? 'public';
      const patterns = Array.isArray(invalidate.pattern) ? invalidate.pattern : [invalidate.pattern ?? `tenant:${tenantId}:${invalidate.module}:*`];
      for (const p of patterns) {
        const finalPattern = p.replace('{tenantId}', tenantId);
        await this.cacheService.invalidatePattern(finalPattern);
      }
    }));
  }
}
