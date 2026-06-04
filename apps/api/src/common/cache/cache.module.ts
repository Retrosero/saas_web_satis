import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: { host: process.env.REDIS_HOST ?? 'localhost', port: Number(process.env.REDIS_PORT ?? 6379) },
          ttl: 60_000,
        } as any),
      }),
    } as any),
  ],
  providers: [CacheService, CacheInterceptor],
  exports: [CacheService, CacheInterceptor, NestCacheModule],
})
export class AppCacheModule {}
