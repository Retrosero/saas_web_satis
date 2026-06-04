import { Controller, Get, Delete, Query, UseGuards, Req, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CacheService } from '../../common/cache/cache.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cache-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('cache-admin')
export class CacheAdminController {
  constructor(private readonly svc: CacheService) {}

  @Get('metrics')
  async metrics() { return this.svc.getMetrics(); }

  @Get('ping')
  async ping() { return { ok: await this.svc.ping() }; }

  @Delete('metrics')
  @HttpCode(204)
  async resetMetrics() { await this.svc.resetMetrics(); }

  @Delete('tenant')
  @HttpCode(200)
  async invalidateTenant(@Req() req: any, @Query('module') module?: string) {
    const deleted = await this.svc.invalidateTenant(req.user.tenantId, module);
    return { ok: true, deleted, module: module ?? 'all' };
  }

  @Delete('all')
  @HttpCode(200)
  async invalidateAll() {
    // TÜM cache'i temizle (super admin)
    const deleted = await this.svc.invalidatePattern('tenant:*');
    return { ok: true, deleted };
  }
}
