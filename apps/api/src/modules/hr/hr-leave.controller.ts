import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { HrPermissionGuard } from './common/hr-permission.guard.js';
import { RequireHrPermission } from './common/require-permission.decorator.js';
import { HrLeaveService } from './hr-leave.service.js';
import type { JwtPayload, HrLeaveTypeCode, HrLeaveRequestStatus } from '@saas/shared';

@ApiTags('hr-leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, HrPermissionGuard)
@Controller('hr/leave')
export class HrLeaveController {
  constructor(private readonly svc: HrLeaveService) {}

  // ================== LEAVE TYPES ==================

  @Get('types')
  @RequireHrPermission('ik:hr:view')
  async listLeaveTypes(@CurrentUser() user: JwtPayload) {
    return this.svc.listLeaveTypes(user.tid);
  }

  @Post('types')
  @RequireHrPermission('ik:personnel:create')
  async createLeaveType(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      name: string;
      code: HrLeaveTypeCode;
      color?: string;
      icon?: string;
      accrualMethod?: string;
      defaultDaysPerYear?: number;
      requiresApproval?: boolean;
      requiresDocument?: boolean;
      minDaysNotice?: number;
      maxConsecutiveDays?: number;
      canCarryOver?: boolean;
      carryOverDays?: number;
      isPaid?: boolean;
    },
  ) {
    return this.svc.createLeaveType(user.tid, body);
  }

  @Patch('types/:id')
  @RequireHrPermission('ik:personnel:update')
  async updateLeaveType(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.svc.updateLeaveType(user.tid, id, body);
  }

  // ================== BALANCES ==================

  @Get('balances')
  @RequireHrPermission('ik:hr:view')
  async listBalances(
    @CurrentUser() user: JwtPayload,
    @Query() q: { employeeId?: string; year?: number; leaveTypeId?: string },
  ) {
    return this.svc.listBalances(user.tid, {
      employeeId: q.employeeId,
      year: q.year ? Number(q.year) : undefined,
      leaveTypeId: q.leaveTypeId,
    });
  }

  @Get('balances/:employeeId')
  @RequireHrPermission('ik:hr:view')
  async getEmployeeBalances(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Query() q: { year?: number },
  ) {
    const year = q.year ? Number(q.year) : new Date().getFullYear();
    return this.svc.getEmployeeBalances(user.tid, employeeId, year);
  }

  @Post('balances/initialize')
  @RequireHrPermission('ik:personnel:update')
  async initializeYearBalances(@CurrentUser() user: JwtPayload, @Body() body: { year: number }) {
    return this.svc.initializeYearBalances(user.tid, body.year);
  }

  @Post('balances/adjust')
  @RequireHrPermission('ik:personnel:update')
  async adjustBalance(
    @CurrentUser() user: JwtPayload,
    @Body() body: { employeeId: string; leaveTypeId: string; year: number; adjustment: number; reason: string },
  ) {
    return this.svc.adjustBalance(user.tid, body, user);
  }

  // ================== REQUESTS ==================

  @Get('requests')
  @RequireHrPermission('ik:hr:view')
  async listRequests(
    @CurrentUser() user: JwtPayload,
    @Query() q: { status?: HrLeaveRequestStatus; employeeId?: string; startDate?: string; endDate?: string; approverId?: string },
  ) {
    return this.svc.listRequests(user.tid, q);
  }

  @Post('requests')
  @RequireHrPermission('ik:personnel:create')
  async createRequest(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason?: string;
      documentUrl?: string;
      replacementEmployeeId?: string;
    },
  ) {
    return this.svc.createRequest(user.tid, body, user);
  }

  @Get('requests/:id')
  @RequireHrPermission('ik:hr:view')
  async getRequest(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.getRequest(user.tid, id);
  }

  @Post('requests/:id/approve')
  @RequireHrPermission('ik:personnel:update')
  async approveRequest(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.approveRequest(user.tid, id, user);
  }

  @Post('requests/:id/reject')
  @RequireHrPermission('ik:personnel:update')
  async rejectRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.svc.rejectRequest(user.tid, id, body, user);
  }

  @Post('requests/:id/cancel')
  @RequireHrPermission('ik:personnel:update')
  async cancelRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.svc.cancelRequest(user.tid, id, body, user);
  }
}