import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';

import { NotificationsExtendedService } from './notifications-extended.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('notifications-extended')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('notifications-extended')
export class NotificationsExtendedController {
  constructor(private readonly svc: NotificationsExtendedService) {}

  // ===== KANALLAR =====
  @Get('channels')
  listChannels(@Req() req: any, @Query('type') type?: string, @Query('isActive') isActive?: string, @Query('search') search?: string) {
    return this.svc.listChannels(req.user.tenantId, { type, isActive: isActive === undefined ? undefined : isActive === 'true', search });
  }

  @Get('channels/:id')
  getChannel(@Req() req: any, @Param('id') id: string) {
    return this.svc.getChannel(req.user.tenantId, id);
  }

  @Post('channels')
    createChannel(@Req() req: any, @Body() body: any) {
    return this.svc.createChannel(req.user.tenantId, body, req.user.id);
  }

  @Put('channels/:id')
    updateChannel(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateChannel(req.user.tenantId, id, body);
  }

  @Delete('channels/:id')
    deleteChannel(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteChannel(req.user.tenantId, id);
  }

  @Post('channels/:id/test')
    testChannel(@Req() req: any, @Param('id') id: string) {
    return this.svc.testChannel(req.user.tenantId, id);
  }

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

  @Post('rules/:id/preview')
    previewRule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.previewRule(req.user.tenantId, id, body);
  }

  // ===== TRIGGER =====
  @Post('trigger/:type')
    trigger(@Req() req: any, @Param('type') type: string, @Body() body: any) {
    return this.svc.trigger(req.user.tenantId, type as any, body.payload, body.sample);
  }

  // ===== LOG =====
  @Get('logs')
  listLogs(@Req() req: any, @Query() q: any) {
    return this.svc.listLogs(req.user.tenantId, q);
  }

  // ===== INBOX =====
  @Get('inbox')
  listInbox(@Req() req: any, @Query() q: any) {
    return this.svc.listInbox(req.user.tenantId, req.user.id, q);
  }

  @Post('inbox/read')
  markRead(@Req() req: any, @Body() body: { ids: string[] }) {
    return this.svc.markRead(req.user.tenantId, req.user.id, body.ids);
  }

  @Post('inbox/read-all')
  markAllRead(@Req() req: any) {
    return this.svc.markAllRead(req.user.tenantId, req.user.id);
  }
}
