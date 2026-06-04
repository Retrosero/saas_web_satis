import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { AuditService } from './audit.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  // ===== KURALLAR =====
  @Get('rules')
  listRules(@Req() req: any, @Query('checkType') checkType?: string, @Query('isActive') isActive?: string, @Query('severity') severity?: string, @Query('search') search?: string) {
    return this.svc.listRules(req.user.tenantId, { checkType, isActive: isActive === undefined ? undefined : isActive === 'true', severity, search });
  }

  @Get('rules/:id')
  getRule(@Req() req: any, @Param('id') id: string) {
    return this.svc.getRule(req.user.tenantId, id);
  }

  @Post('rules')
  createRule(@Req() req: any, @Body() body: any) {
    return this.svc.createRule(req.user.tenantId, body, req.user.id);
  }

  @Put('rules/:id')
  updateRule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateRule(req.user.tenantId, id, body);
  }

  @Delete('rules/:id')
  deleteRule(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteRule(req.user.tenantId, id);
  }

  @Post('rules/:id/toggle')
  toggleRule(@Req() req: any, @Param('id') id: string) {
    return this.svc.toggleRule(req.user.tenantId, id);
  }

  @Post('rules/:id/clone')
  cloneRule(@Req() req: any, @Param('id') id: string) {
    return this.svc.cloneRule(req.user.tenantId, id, req.user.id);
  }

  @Post('rules/:id/run')
  runRule(@Req() req: any, @Param('id') id: string) {
    return this.svc.runRule(req.user.tenantId, id, req.user.id);
  }

  @Post('rules/run-all')
  runAll(@Req() req: any) {
    return this.svc.runAll(req.user.tenantId, req.user.id);
  }

  // ===== RUNS =====
  @Get('runs')
  listRuns(@Req() req: any, @Query() q: any) {
    return this.svc.listRuns(req.user.tenantId, q);
  }

  @Get('runs/:id')
  getRun(@Req() req: any, @Param('id') id: string) {
    return this.svc.getRun(req.user.tenantId, id);
  }

  // ===== RESULTS =====
  @Get('results')
  listResults(@Req() req: any, @Query() q: any) {
    return this.svc.listResults(req.user.tenantId, q);
  }

  @Get('results/:id')
  getResult(@Req() req: any, @Param('id') id: string) {
    return this.svc.getResult(req.user.tenantId, id);
  }

  @Post('results/:id/acknowledge')
  acknowledge(@Req() req: any, @Param('id') id: string) {
    return this.svc.acknowledgeResult(req.user.tenantId, id, req.user.id);
  }

  @Post('results/:id/fix')
  fixResult(@Req() req: any, @Param('id') id: string, @Body() body: { note?: string }) {
    return this.svc.fixResult(req.user.tenantId, id, req.user.id, req.user.fullName ?? req.user.email, body?.note);
  }

  @Post('results/:id/ignore')
  ignoreResult(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.svc.ignoreResult(req.user.tenantId, id, req.user.id, body?.reason);
  }

  @Post('results/:id/false-positive')
  falsePositive(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.svc.markFalsePositive(req.user.tenantId, id, req.user.id, body?.reason);
  }

  @Post('results/bulk')
  bulkAction(@Req() req: any, @Body() body: { ids: string[]; action: 'fix' | 'ignore' | 'acknowledge'; note?: string }) {
    return this.svc.bulkAction(req.user.tenantId, body.ids, body.action, req.user.id, req.user.fullName ?? req.user.email, body.note);
  }

  // ===== SCHEDULES =====
  @Get('schedules')
  listSchedules(@Req() req: any) {
    return this.svc.listSchedules(req.user.tenantId);
  }

  @Post('schedules')
  createSchedule(@Req() req: any, @Body() body: any) {
    return this.svc.createSchedule(req.user.tenantId, body, req.user.id);
  }

  @Put('schedules/:id')
  updateSchedule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateSchedule(req.user.tenantId, id, body);
  }

  @Delete('schedules/:id')
  deleteSchedule(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteSchedule(req.user.tenantId, id);
  }

  // ===== STATS & LOGS =====
  @Get('stats')
  stats(@Req() req: any) {
    return this.svc.getStats(req.user.tenantId);
  }

  @Get('logs')
  listLogs(@Req() req: any, @Query() q: any) {
    return this.svc.listActionLogs(req.user.tenantId, q);
  }
}
