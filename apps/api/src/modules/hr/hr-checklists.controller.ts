import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { HrPermissionGuard } from './common/hr-permission.guard.js';
import { RequireHrPermission } from './common/require-permission.decorator.js';
import { HrChecklistsService } from './hr-checklists.service.js';
import type { HrOnboardingItemStatus, JwtPayload } from '@saas/shared';

@ApiTags('hr-checklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, HrPermissionGuard)
@Controller('hr/checklists')
export class HrChecklistsController {
  constructor(private readonly svc: HrChecklistsService) {}

  // ================== ONBOARDING ==================

  @Get('onboardings')
  @RequireHrPermission('ik:personnel:view')
  async listOnboardings(
    @CurrentUser() user: JwtPayload,
    @Body() body: { status?: any; employeeId?: string },
  ) {
    return this.svc.listOnboardings(user.tid, body);
  }

  @Post('onboardings')
  @RequireHrPermission('ik:personnel:create')
  async startOnboarding(
    @CurrentUser() user: JwtPayload,
    @Body() body: { employeeId: string; startDate: string; targetCompletionDate?: string; notes?: string },
  ) {
    return this.svc.startOnboarding(user.tid, body, user);
  }

  @Get('onboardings/:id')
  @RequireHrPermission('ik:personnel:view')
  async getOnboarding(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.getOnboarding(user.tid, id);
  }

  @Patch('onboardings/:checklistId/items/:itemId')
  @RequireHrPermission('ik:personnel:update')
  async updateOnboardingItem(
    @CurrentUser() user: JwtPayload,
    @Param('checklistId') checklistId: string,
    @Param('itemId') itemId: string,
    @Body() body: { status: HrOnboardingItemStatus; notes?: string; documentId?: string },
  ) {
    return this.svc.updateOnboardingItem(user.tid, checklistId, itemId, body, user);
  }

  @Post('onboardings/:id/complete')
  @RequireHrPermission('ik:personnel:update')
  async completeOnboarding(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.completeOnboarding(user.tid, id, user);
  }

  @Post('onboardings/:id/cancel')
  @RequireHrPermission('ik:personnel:update')
  async cancelOnboarding(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.cancelOnboarding(user.tid, id, user);
  }

  // ================== OFFBOARDING ==================

  @Get('offboardings')
  @RequireHrPermission('ik:personnel:view')
  async listOffboardings(
    @CurrentUser() user: JwtPayload,
    @Body() body: { status?: any; employeeId?: string },
  ) {
    return this.svc.listOffboardings(user.tid, body);
  }

  @Post('offboardings')
  @RequireHrPermission('ik:personnel:update')
  async startOffboarding(
    @CurrentUser() user: JwtPayload,
    @Body() body: { employeeId: string; terminationDate: string; reason?: string; notes?: string },
  ) {
    return this.svc.startOffboarding(user.tid, body, user);
  }

  @Get('offboardings/:id')
  @RequireHrPermission('ik:personnel:view')
  async getOffboarding(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.getOffboarding(user.tid, id);
  }

  @Patch('offboardings/:checklistId/items/:itemId')
  @RequireHrPermission('ik:personnel:update')
  async updateOffboardingItem(
    @CurrentUser() user: JwtPayload,
    @Param('checklistId') checklistId: string,
    @Param('itemId') itemId: string,
    @Body() body: { status: HrOnboardingItemStatus; notes?: string; documentId?: string },
  ) {
    return this.svc.updateOffboardingItem(user.tid, checklistId, itemId, body, user);
  }

  @Post('offboardings/:id/complete')
  @RequireHrPermission('ik:personnel:update')
  async completeOffboarding(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.completeOffboarding(user.tid, id, user);
  }

  @Post('offboardings/:id/cancel')
  @RequireHrPermission('ik:personnel:update')
  async cancelOffboarding(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.cancelOffboarding(user.tid, id, user);
  }
}
