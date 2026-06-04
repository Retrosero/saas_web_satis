import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { HrPermissionGuard } from './common/hr-permission.guard.js';
import { RequireHrPermission } from './common/require-permission.decorator.js';
import { HrPayrollService } from './hr-payroll.service.js';
import type { JwtPayload, PayrollPeriodType, PayrollPeriodStatus } from '@saas/shared';

@ApiTags('hr-payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, HrPermissionGuard)
@Controller('hr/payroll')
export class HrPayrollController {
  constructor(private readonly svc: HrPayrollService) {}

  // ================== PERIODS ==================

  @Get('periods')
  @RequireHrPermission('ik:hr:view')
  async listPeriods(
    @CurrentUser() user: JwtPayload,
    @Query() q: { year?: number; status?: PayrollPeriodStatus; periodType?: PayrollPeriodType },
  ) {
    return this.svc.listPeriods(user.tid, q);
  }

  @Post('periods')
  @RequireHrPermission('ik:personnel:create')
  async createPeriod(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      year: number;
      period: number;
      periodType: PayrollPeriodType;
      startDate: string;
      endDate: string;
      notes?: string;
    },
  ) {
    return this.svc.createPeriod(user.tid, body, user);
  }

  @Get('periods/:id')
  @RequireHrPermission('ik:hr:view')
  async getPeriod(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.getPeriod(user.tid, id);
  }

  @Patch('periods/:id')
  @RequireHrPermission('ik:personnel:update')
  async updatePeriod(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.updatePeriod(user.tid, id, body);
  }

  @Post('periods/:id/confirm')
  @RequireHrPermission('ik:personnel:update')
  async confirmPeriod(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.confirmPeriod(user.tid, id, user);
  }

  @Post('periods/:id/export')
  @RequireHrPermission('ik:personnel:update')
  async exportPeriod(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.exportPeriod(user.tid, id, user);
  }

  @Post('periods/:id/close')
  @RequireHrPermission('ik:personnel:update')
  async closePeriod(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.closePeriod(user.tid, id);
  }

  // ================== RECORDS ==================

  @Get('records')
  @RequireHrPermission('ik:hr:view')
  async listRecords(
    @CurrentUser() user: JwtPayload,
    @Query() q: { periodId: string; status?: string },
  ) {
    return this.svc.listRecords(user.tid, q);
  }

  @Post('records')
  @RequireHrPermission('ik:personnel:update')
  async upsertRecord(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      periodId: string;
      employeeId: string;
      workingDays?: number;
      absentDays?: number;
      overtimeHours?: number;
      lateHours?: number;
      baseSalary?: number;
      grossPay?: number;
      sgkEmployee?: number;
      unemploymentEmployee?: number;
      incomeTax?: number;
      netPay?: number;
    },
  ) {
    return this.svc.upsertRecord(user.tid, body, user);
  }

  @Post('periods/:id/initialize')
  @RequireHrPermission('ik:personnel:update')
  async initializePeriodRecords(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.initializePeriodRecords(user.tid, id, user);
  }

  // ================== SUPPLEMENTS ==================

  @Get('supplements')
  @RequireHrPermission('ik:hr:view')
  async listSupplements(
    @CurrentUser() user: JwtPayload,
    @Query() q: { periodId: string; employeeId?: string; type?: string },
  ) {
    return this.svc.listSupplements(user.tid, q);
  }

  @Post('supplements')
  @RequireHrPermission('ik:personnel:update')
  async addSupplement(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      periodId: string;
      employeeId: string;
      recordId?: string;
      type: string;
      name: string;
      amount: number;
      isDeduction?: boolean;
      notes?: string;
    },
  ) {
    return this.svc.addSupplement(user.tid, body, user);
  }

  @Delete('supplements/:id')
  @RequireHrPermission('ik:personnel:update')
  async deleteSupplement(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.deleteSupplement(user.tid, id);
  }
}