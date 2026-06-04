import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { GlobalSearchService } from './global-search.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('global-search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('global-search')
export class GlobalSearchController {
  constructor(private readonly svc: GlobalSearchService) {}
  @Get()
  search(@Req() req: any, @Query('q') q: string, @Query('limit') limit?: string) { return this.svc.search(req.user.tenantId, req.user.id, q ?? '', limit ? Number(limit) : 5); }
  @Get('history')
  history(@Req() req: any, @Query('limit') limit?: string) { return this.svc.getHistory(req.user.tenantId, req.user.id, limit ? Number(limit) : 10); }
}
