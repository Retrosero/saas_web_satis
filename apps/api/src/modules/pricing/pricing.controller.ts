import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PricingService } from './pricing.service.js';
import type { CampaignStatus, CampaignType, JwtPayload, PriceListStatus } from '@saas/shared';

@ApiTags('pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly svc: PricingService) {}

  // ===== PRICE LISTS =====
  @Get('price-lists')
  listPL(@CurrentUser() u: JwtPayload, @Query('search') search?: string, @Query('status') status?: PriceListStatus, @Query('currency') currency?: string, @Query('customerGroupId') customerGroupId?: string) {
    return this.svc.listPriceLists(u.tid, { search, status, currency, customerGroupId });
  }

  @Get('price-lists/:id')
  getPL(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getPriceList(u.tid, id);
  }

  @Post('price-lists')
  createPL(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.createPriceList(u.tid, body, u.sub);
  }

  @Put('price-lists/:id')
  updatePL(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.updatePriceList(u.tid, id, body);
  }

  @Delete('price-lists/:id')
  async deletePL(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deletePriceList(u.tid, id);
    return { ok: true };
  }

  @Post('price-lists/:id/items')
  addItem(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.addPriceListItem(u.tid, id, body);
  }

  // ===== CUSTOMER GROUPS =====
  @Get('customer-groups')
  listGroups(@CurrentUser() u: JwtPayload) {
    return this.svc.listCustomerGroups(u.tid);
  }

  @Post('customer-groups')
  createGroup(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.createCustomerGroup(u.tid, body);
  }

  @Put('customer-groups/:id')
  updateGroup(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateCustomerGroup(u.tid, id, body);
  }

  @Post('customer-groups/:id/members')
  addMember(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { customerId: string; customDiscountRate?: number }) {
    return this.svc.addCustomerToGroup(u.tid, id, body.customerId, body.customDiscountRate);
  }

  @Delete('customer-groups/:groupId/members/:customerId')
  removeMember(@CurrentUser() u: JwtPayload, @Param('groupId') groupId: string, @Param('customerId') customerId: string) {
    return this.svc.removeCustomerFromGroup(u.tid, groupId, customerId);
  }

  // ===== CAMPAIGNS =====
  @Get('campaigns')
  listCampaigns(@CurrentUser() u: JwtPayload, @Query('status') status?: CampaignStatus, @Query('campaignType') campaignType?: CampaignType, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.listCampaigns(u.tid, { status, campaignType, from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
  }

  @Get('campaigns/:id')
  getCampaign(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getCampaign(u.tid, id);
  }

  @Post('campaigns')
  createCampaign(@CurrentUser() u: JwtPayload, @Body() body: any) {
    return this.svc.createCampaign(u.tid, body, u.sub);
  }

  @Put('campaigns/:id')
  updateCampaign(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateCampaign(u.tid, id, body);
  }

  @Delete('campaigns/:id')
  async deleteCampaign(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    await this.svc.deleteCampaign(u.tid, id);
    return { ok: true };
  }

  @Post('campaigns/test')
  testCampaign(@CurrentUser() u: JwtPayload, @Body() body: { campaignId: string; customerId?: string; productId?: string; quantity: number; unitPrice: number; cartAmount: number }) {
    return this.svc.testCampaign(u.tid, body);
  }
}
