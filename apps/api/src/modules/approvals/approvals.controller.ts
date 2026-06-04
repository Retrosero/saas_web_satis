import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { ApprovalsService } from './approvals.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly svc: ApprovalsService) {}

  // ===== KURALLAR =====
  @Get('rules')
  listRules(@Req() req: any, @Query('triggerType') triggerType?: string, @Query('isActive') isActive?: string, @Query('search') search?: string) {
    return this.svc.listRules(req.user.tenantId, { triggerType, isActive: isActive === undefined ? undefined : isActive === 'true', search });
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

  // ===== REQUEST TETİKLE =====
  @Post('requests')
  submitRequest(@Req() req: any, @Body() body: any) {
    return this.svc.submitRequest(req.user.tenantId, { ...body, requesterId: body.requesterId ?? req.user.id, requesterName: body.requesterName ?? req.user.fullName ?? req.user.email });
  }

  // ===== REQUEST LİSTELE =====
  @Get('requests')
  listRequests(@Req() req: any, @Query() q: any) {
    return this.svc.listRequests(req.user.tenantId, q);
  }

  @Get('requests/my-pending')
  myPending(@Req() req: any) {
    return this.svc.myPendingRequests(req.user.tenantId, req.user.id);
  }

  @Get('requests/my')
  myRequests(@Req() req: any) {
    return this.svc.myRequests(req.user.tenantId, req.user.id);
  }

  @Get('requests/:id')
  getRequest(@Req() req: any, @Param('id') id: string) {
    return this.svc.getRequest(req.user.tenantId, id);
  }

  // ===== AKSİYON =====
  @Post('requests/:id/act')
  act(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.act(req.user.tenantId, id, { ...body, actorId: req.user.id, actorName: req.user.fullName ?? req.user.email });
  }

  @Post('requests/:id/cancel')
  cancel(@Req() req: any, @Param('id') id: string, @Body() body: { comment?: string }) {
    return this.svc.cancelRequest(req.user.tenantId, id, req.user.id, body?.comment);
  }

  // ===== İSTATİSTİK =====
  @Get('stats')
  stats(@Req() req: any, @Query() q: any) {
    return this.svc.getStats(req.user.tenantId, q);
  }
}
