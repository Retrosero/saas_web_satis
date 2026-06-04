import { Module } from '@nestjs/common';
import { CacheAdminController } from './cache-admin.controller';
import { AppCacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [AppCacheModule],
  controllers: [CacheAdminController],
})
export class CacheAdminModule {}
