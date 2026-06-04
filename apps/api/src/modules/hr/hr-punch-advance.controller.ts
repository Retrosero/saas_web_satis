import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HrPunchService, HrAdvanceService } from './hr-punch-advance.service.js';
import { HrExportService } from './hr-export.service.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { HrPermissionGuard } from './common/hr-permission.guard.js';

@UseGuards(JwtAuthGuard, TenantGuard, HrPermissionGuard)
@Controller('hr')
export class HrPunchAdvanceController {
  constructor(
    private readonly punchService: HrPunchService,
    private readonly advanceService: HrAdvanceService,
    private readonly exportService: HrExportService,
  ) {}

  // ── PUANTAJ ──────────────────────────────────────────────────────────

  @Get('punch')
  async listByDate(
    @Body('tenantId') tenantId: string,
    @Query('date') date: string,
  ) {
    return this.punchService.listPunchesByDate(tenantId, date);
  }

  @Post('punch')
  @HttpCode(200)
  async upsertPunch(
    @Body('tenantId') tenantId: string,
    @Body('employeeId') employeeId: string,
    @Body('punchDate') punchDate: string,
    @Body('clockIn') clockIn?: string,
    @Body('clockOut') clockOut?: string,
    @Body('breakStart') breakStart?: string,
    @Body('breakEnd') breakEnd?: string,
    @Body('status') status?: string,
    @Body('notes') notes?: string,
    @Body('user') user?: any,
  ) {
    return this.punchService.upsertPunch(tenantId, { employeeId, punchDate, clockIn, clockOut, breakStart, breakEnd, status, notes }, user);
  }

  @Get('punch/summary')
  async employeeSummary(
    @Body('tenantId') tenantId: string,
    @Query('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.punchService.getEmployeePunchSummary(tenantId, employeeId, startDate, endDate);
  }

  @Post('punch/sync-to-payroll')
  @HttpCode(200)
  async syncPunchToPayroll(
    @Body('tenantId') tenantId: string,
    @Body('periodId') periodId: string,
    @Body('user') user: any,
  ) {
    return this.punchService.syncPunchToPayroll(tenantId, periodId, user);
  }

  // ── AVANS ────────────────────────────────────────────────────────────

  @Get('advances')
  async listAdvances(
    @Body('tenantId') tenantId: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.advanceService.listRequests(tenantId, { employeeId, status });
  }

  @Post('advances')
  async createAdvance(
    @Body('tenantId') tenantId: string,
    @Body('employeeId') employeeId: string,
    @Body('amount') amount: number,
    @Body('reason') reason?: string,
    @Body('notes') notes?: string,
    @Body('user') user?: any,
  ) {
    return this.advanceService.createRequest(tenantId, { employeeId, amount, reason, notes }, user);
  }

  @Post('advances/:id/approve')
  @HttpCode(200)
  async approveAdvance(
    @Body('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('user') user: any,
  ) {
    return this.advanceService.approveRequest(tenantId, id, user);
  }

  @Post('advances/:id/pay')
  @HttpCode(200)
  async payAdvance(
    @Body('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('deductionMonth') deductionMonth?: string,
    @Body('user') user?: any,
  ) {
    return this.advanceService.markPaid(tenantId, id, { deductionMonth }, user);
  }

  @Post('advances/:id/reject')
  @HttpCode(200)
  async rejectAdvance(
    @Body('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('user') user: any,
  ) {
    return this.advanceService.rejectRequest(tenantId, id, user);
  }

  @Post('advances/:id/deduct')
  @HttpCode(200)
  async deductAdvance(
    @Body('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('periodId') periodId: string,
    @Body('user') user: any,
  ) {
    return this.advanceService.deductFromPayroll(tenantId, id, periodId, user);
  }

  @Get('advances/active-total')
  async activeTotal(
    @Body('tenantId') tenantId: string,
    @Query('employeeId') employeeId: string,
  ) {
    return this.advanceService.getEmployeeActiveTotal(tenantId, employeeId);
  }

  // ── EXCEL EXPORT ─────────────────────────────────────────────────────

  @Post('payroll/:periodId/export-excel')
  @HttpCode(200)
  async exportPayrollExcel(
    @Body('tenantId') tenantId: string,
    @Param('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.exportService.exportPayrollPeriod(tenantId, periodId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }
}