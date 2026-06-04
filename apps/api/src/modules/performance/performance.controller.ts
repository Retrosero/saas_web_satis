import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PerformanceService } from './performance.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TargetType, TargetStatus, CommissionType } from '@saas/shared';

@ApiTags('performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly svc: PerformanceService) {}

  // ===== Targets =====
  @Get('targets')
  listTargets(@Req() req: any, @Query() q: any) { return this.svc.listTargets(req.user.tenantId, q); }

  @Get('targets/:id')
  getTarget(@Req() req: any, @Param('id') id: string) { return this.svc.getTarget(req.user.tenantId, id); }

  @Post('targets')
  createTarget(@Req() req: any, @Body() body: any) { return this.svc.createTarget(req.user.tenantId, body, req.user.id); }

  @Put('targets/:id')
  updateTarget(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.svc.updateTarget(req.user.tenantId, id, body); }

  @Delete('targets/:id')
  deleteTarget(@Req() req: any, @Param('id') id: string) { return this.svc.deleteTarget(req.user.tenantId, id); }

  @Post('targets/snapshot-all')
  snapshotAll(@Req() req: any) { return this.svc.snapshotAllActive(req.user.tenantId); }

  // ===== Performance =====
  @Get('dashboard')
  dashboard(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) { return this.svc.getPerformanceDashboard(req.user.tenantId, from, to); }

  @Get('user/:userId')
  userPerformance(@Req() req: any, @Param('userId') userId: string, @Query('days') days?: string) { return this.svc.getUserPerformance(req.user.tenantId, userId, days ? Number(days) : 30); }

  // ===== Commission Rules =====
  @Get('commission/rules')
  listRules(@Req() req: any) { return this.svc.listCommissionRules(req.user.tenantId); }

  @Get('commission/rules/:id')
  getRule(@Req() req: any, @Param('id') id: string) { return this.svc.getCommissionRule(req.user.tenantId, id); }

  @Post('commission/rules')
  createRule(@Req() req: any, @Body() body: any) { return this.svc.createCommissionRule(req.user.tenantId, body, req.user.id); }

  @Put('commission/rules/:id')
  updateRule(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.svc.updateCommissionRule(req.user.tenantId, id, body); }

  @Delete('commission/rules/:id')
  deleteRule(@Req() req: any, @Param('id') id: string) { return this.svc.deleteCommissionRule(req.user.tenantId, id); }

  @Post('commission/calculate')
  calculate(@Req() req: any, @Body() body: { userId: string; userName?: string; ruleId: string; period: string; targetId?: string }) { return this.svc.calculateCommission(req.user.tenantId, body, req.user.id); }

  @Get('commission/logs')
  logs(@Req() req: any, @Query() q: any) { return this.svc.listCommissionLogs(req.user.tenantId, q); }

  @Post('commission/logs/:id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: 'APPROVED' | 'PAID' | 'REJECTED'; notes?: string }) { return this.svc.updateCommissionStatus(req.user.tenantId, id, body.status, req.user.id, body.notes); }
}
