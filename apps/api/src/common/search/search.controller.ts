import { Controller, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { SearchService } from './search.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  @Get()
  search(@Req() req: any, @Query('q') q: string, @Query('limit') limit?: string) {
    return this.svc.search(req.user.tenantId, q ?? '', limit ? Number(limit) : 5);
  }

  @Get('stats')
  stats() { return this.svc.getIndexStats(); }
}

@ApiTags('search-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('search-admin')
export class SearchAdminController {
  constructor(private readonly svc: SearchService) {}
  @Post('reindex') reindex(@Req() req: any) { return this.svc.reindexTenant(req.user.tenantId); }
}
