import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RealtimeService } from './realtime.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('realtime-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('realtime-admin')
export class RealtimeAdminController {
  constructor(private readonly svc: RealtimeService) {}

  @Get('stats')
  stats() { return { connectedClients: this.svc.getConnectedCount() }; }

  @Post('test')
  test(@Req() req: any, @Body() body: { event?: string; message?: string }) {
    this.svc.notifyTenant(req.user.tenantId, body.event ?? 'test.event', { message: body.message ?? 'Test mesajı' });
    return { ok: true };
  }
}
