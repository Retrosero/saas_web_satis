import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { BulkOperationsService } from './bulk-operations.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BulkOperationType } from '@saas/shared';

@ApiTags('bulk-operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('bulk-operations')
export class BulkOperationsController {
  constructor(private readonly svc: BulkOperationsService) {}
  @Get() list(@Req() req: any, @Query() q: any) { return this.svc.list(req.user.tenantId, q); }
  @Post('preview') preview(@Req() req: any, @Body() body: { type: BulkOperationType; filters: any; update: any }) { return this.svc.preview(req.user.tenantId, body); }
  @Post() create(@Req() req: any, @Body() body: any) { return this.svc.create(req.user.tenantId, body, req.user.id); }
  @Post(':id/execute') execute(@Req() req: any, @Param('id') id: string) { return this.svc.execute(req.user.tenantId, id, req.user.id); }
  @Post(':id/rollback') rollback(@Req() req: any, @Param('id') id: string) { return this.svc.rollback(req.user.tenantId, id, req.user.id); }
}
