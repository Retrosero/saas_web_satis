import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CleanupService } from './cleanup.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CleanupType } from '@saas/shared';

@ApiTags('cleanup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('cleanup')
export class CleanupController {
  constructor(private readonly svc: CleanupService) {}
  @Get('dashboard') dashboard(@Req() req: any) { return this.svc.getDashboard(req.user.tenantId); }
  @Get('jobs') jobs(@Req() req: any) { return this.svc.listJobs(req.user.tenantId); }
  @Post('preview') preview(@Req() req: any, @Body() body: { type: CleanupType; filters: any }) { return this.svc.preview(req.user.tenantId, body); }
  @Post('run') run(@Req() req: any, @Body() body: { type: CleanupType; filters: any; archive?: boolean }) { return this.svc.runJob(req.user.tenantId, body, req.user.id); }
}
