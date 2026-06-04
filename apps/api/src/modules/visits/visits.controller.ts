import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { VisitsService } from './visits.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VisitStatus, VisitPlanStatus } from '@saas/shared';

@ApiTags('visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly svc: VisitsService) {}

  @Get('plans')
  listPlans(@Req() req: any, @Query() q: any) { return this.svc.listPlans(req.user.tenantId, q); }

  @Get('plans/:id')
  getPlan(@Req() req: any, @Param('id') id: string) { return this.svc.getPlan(req.user.tenantId, id); }

  @Post('plans')
  createPlan(@Req() req: any, @Body() body: any) { return this.svc.createPlan(req.user.tenantId, body, req.user.id); }

  @Put('plans/:id/status')
  updatePlanStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: any }) { return this.svc.updatePlanStatus(req.user.tenantId, id, body.status); }

  @Delete('plans/:id')
  deletePlan(@Req() req: any, @Param('id') id: string) { return this.svc.deletePlan(req.user.tenantId, id); }

  @Post('plans/:planId/customers/:customerId/status')
  updateCustomerStatus(@Req() req: any, @Param('planId') planId: string, @Param('customerId') customerId: string, @Body() body: any) { return this.svc.updateCustomerStatus(req.user.tenantId, planId, customerId, body, req.user.id); }

  @Post('plans/:planId/checkin')
  checkin(@Req() req: any, @Param('planId') planId: string, @Body() body: any) { return this.svc.checkin(req.user.tenantId, planId, body, req.user.id); }

  @Post('plans/:planId/notes')
  addNote(@Req() req: any, @Param('planId') planId: string, @Body() body: any) { return this.svc.addNote(req.user.tenantId, planId, body, req.user.id); }

  @Get('plans/:planId/notes')
  listNotes(@Req() req: any, @Param('planId') planId: string, @Query('customerId') customerId?: string) { return this.svc.listNotes(req.user.tenantId, planId, customerId); }

  @Get('report/salesperson/:salespersonId')
  salespersonReport(@Req() req: any, @Param('salespersonId') salespersonId: string, @Query('from') from?: string, @Query('to') to?: string) { return this.svc.getSalespersonReport(req.user.tenantId, salespersonId, from, to); }
}
