import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ApiService } from './api.service.js';
import type {
  ApiScope,
  JwtPayload,
  WebhookDeliveryStatus,
  WebhookEventType,
  WebhookStatus,
} from '@saas/shared';

@ApiTags('api')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api')
export class ApiController {
  constructor(private readonly svc: ApiService) {}

  // ===== API KEYS =====
  @Get('keys')
  listKeys(@CurrentUser() u: JwtPayload) {
    return this.svc.listApiKeys(u.tid);
  }

  @Post('keys')
  createKey(@CurrentUser() u: JwtPayload, @Body() body: { name: string; scopes: ApiScope[]; expiresAt?: string }) {
    return this.svc.createApiKey(u.tid, body, u.sub);
  }

  @Post('keys/:id/revoke')
  revokeKey(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.revokeApiKey(u.tid, id);
  }

  @Delete('keys/:id')
  async deleteKey(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deleteApiKey(u.tid, id);
    return { ok: true };
  }

  @Get('usage-logs')
  usageLogs(
    @CurrentUser() u: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('apiKeyId') apiKeyId?: string,
    @Query('statusCode') statusCode?: string,
  ) {
    return this.svc.listUsageLogs(u.tid, {
      page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50,
      apiKeyId, statusCode: statusCode ? Number(statusCode) : undefined,
    });
  }

  // ===== WEBHOOKS =====
  @Get('webhooks')
  listWebhooks(@CurrentUser() u: JwtPayload) {
    return this.svc.listWebhooks(u.tid);
  }

  @Get('webhooks/:id')
  getWebhook(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getWebhook(u.tid, id);
  }

  @Post('webhooks')
  createWebhook(@CurrentUser() u: JwtPayload, @Body() body: { name: string; url: string; events: WebhookEventType[] }) {
    return this.svc.createWebhook(u.tid, body, u.sub);
  }

  @Put('webhooks/:id/status')
  updateWebhookStatus(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { status: WebhookStatus }) {
    return this.svc.updateWebhookStatus(u.tid, id, body.status);
  }

  @Delete('webhooks/:id')
  async deleteWebhook(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deleteWebhook(u.tid, id);
    return { ok: true };
  }

  @Post('webhooks/:id/test')
  testWebhook(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { payload?: any }) {
    return this.svc.testWebhook(u.tid, id, body?.payload);
  }

  @Get('webhook-deliveries')
  deliveries(
    @CurrentUser() u: JwtPayload,
    @Query('webhookId') webhookId?: string,
    @Query('status') status?: WebhookDeliveryStatus,
    @Query('eventType') eventType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.svc.listDeliveries(u.tid, { webhookId, status, eventType, page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50 });
  }
}
