import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { HrPermissionGuard } from './common/hr-permission.guard.js';
import { RequireHrPermission } from './common/require-permission.decorator.js';
import { HrPayrollParamService } from './hr-payroll-param.service.js';
import { HrAbsenceService } from './hr-hr6-7.service.js';
import type { JwtPayload } from '@saas/shared';

@ApiTags('hr-hr567')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, HrPermissionGuard)
@Controller('hr')
export class HrHr567Controller {
  constructor(
    private readonly paramSvc: HrPayrollParamService,
    private readonly absenceSvc: HrAbsenceService,
  ) {}

  // ================== HR-5: PAYROLL PARAMS ==================

  @Get('payroll-params')
  @RequireHrPermission('ik:hr:view')
  async listPayrollParams(@CurrentUser() user: JwtPayload, @Query() q: { year?: number }) {
    return this.paramSvc.listParams(user.tid, q.year);
  }

  @Get('payroll-params/map')
  @RequireHrPermission('ik:hr:view')
  async getParamsMap(@CurrentUser() user: JwtPayload, @Query() q: { year: number }) {
    return this.paramSvc.getParamsByYear(user.tid, q.year);
  }

  @Post('payroll-params')
  @RequireHrPermission('ik:personnel:update')
  async upsertPayrollParam(@CurrentUser() user: JwtPayload, @Body() body: { year: number; paramKey: string; paramValue: number; description?: string }) {
    return this.paramSvc.upsertParam(user.tid, body);
  }

  @Post('payroll-params/bulk')
  @RequireHrPermission('ik:personnel:update')
  async bulkUpsertParams(@CurrentUser() user: JwtPayload, @Body() body: { params: Array<{ year: number; paramKey: string; paramValue: number; description?: string }> }) {
    return this.paramSvc.bulkUpsert(user.tid, body.params);
  }

  @Post('payroll-params/seed')
  @RequireHrPermission('ik:personnel:update')
  async seedDefaults(@CurrentUser() user: JwtPayload, @Body() body: { year: number }) {
    return this.paramSvc.seedDefaults(user.tid, body.year);
  }

  // ================== HR-6: ABSENCE ==================

  @Get('absences')
  @RequireHrPermission('ik:hr:view')
  async listAbsences(@CurrentUser() user: JwtPayload, @Query() q: { employeeId?: string; absenceType?: string; startDate?: string; endDate?: string }) {
    return this.absenceSvc.listAbsences(user.tid, q);
  }

  @Post('absences')
  @RequireHrPermission('ik:personnel:create')
  async createAbsence(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.absenceSvc.createAbsence(user.tid, body, user);
  }

  @Patch('absences/:id')
  @RequireHrPermission('ik:personnel:update')
  async updateAbsence(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.absenceSvc.updateAbsence(user.tid, id, body);
  }

  @Delete('absences/:id')
  @RequireHrPermission('ik:personnel:update')
  async deleteAbsence(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.absenceSvc.deleteAbsence(user.tid, id);
  }

  // ================== HR-6: DISCIPLINARY ==================

  @Get('disciplinary')
  @RequireHrPermission('ik:hr:view')
  async listDisciplinaryCases(@CurrentUser() user: JwtPayload, @Query() q: { employeeId?: string; isClosed?: boolean; actionType?: string }) {
    return this.absenceSvc.listDisciplinaryCases(user.tid, q);
  }

  @Post('disciplinary')
  @RequireHrPermission('ik:personnel:create')
  async createDisciplinaryCase(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.absenceSvc.createDisciplinaryCase(user.tid, body, user);
  }

  @Post('disciplinary/:id/close')
  @RequireHrPermission('ik:personnel:update')
  async closeDisciplinaryCase(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { actionType: string; actionDate?: string; actionNotes?: string }) {
    return this.absenceSvc.closeDisciplinaryCase(user.tid, id, body, user);
  }

  // ================== HR-7: CAREER ==================

  @Get('career')
  @RequireHrPermission('ik:hr:view')
  async listCareerRecords(@CurrentUser() user: JwtPayload, @Query() q: { employeeId?: string; recordType?: string }) {
    return this.absenceSvc.listCareerRecords(user.tid, q);
  }

  @Post('career')
  @RequireHrPermission('ik:personnel:create')
  async createCareerRecord(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.absenceSvc.createCareerRecord(user.tid, body, user);
  }

  // ================== HR-7: TRAINING ==================

  @Get('trainings')
  @RequireHrPermission('ik:hr:view')
  async listTrainings(@CurrentUser() user: JwtPayload, @Query() q: { status?: string; startDate?: string }) {
    return this.absenceSvc.listTrainings(user.tid, q);
  }

  @Post('trainings')
  @RequireHrPermission('ik:personnel:create')
  async createTraining(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.absenceSvc.createTraining(user.tid, body, user);
  }

  @Post('trainings/:id/participants')
  @RequireHrPermission('ik:personnel:update')
  async addTrainingParticipant(@Param('id') id: string, @Body() body: { employeeId: string }) {
    return this.absenceSvc.addTrainingParticipant(id, body.employeeId);
  }

  @Patch('training-participants/:id')
  @RequireHrPermission('ik:personnel:update')
  async updateParticipantScore(@Param('id') id: string, @Body() body: any) {
    return this.absenceSvc.updateParticipantScore(id, body);
  }

  // ================== HR-7: PERFORMANCE ==================

  @Get('performance')
  @RequireHrPermission('ik:hr:view')
  async listPerformanceReviews(@CurrentUser() user: JwtPayload, @Query() q: { employeeId?: string; period?: string; status?: string }) {
    return this.absenceSvc.listPerformanceReviews(user.tid, q);
  }

  @Post('performance')
  @RequireHrPermission('ik:personnel:create')
  async upsertPerformanceReview(@CurrentUser() user: JwtPayload, @Body() body: any) {
    return this.absenceSvc.upsertPerformanceReview(user.tid, body, user);
  }

  @Post('performance/:id/complete')
  @RequireHrPermission('ik:personnel:update')
  async completePerformanceReview(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.absenceSvc.completePerformanceReview(user.tid, id, body, user);
  }
}