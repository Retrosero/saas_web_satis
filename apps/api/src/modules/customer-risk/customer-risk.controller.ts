import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CustomerRiskService } from './customer-risk.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerRiskLevel } from '@saas/shared';

@ApiTags('customer-risk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customer-risk')
export class CustomerRiskController {
  constructor(private readonly svc: CustomerRiskService) {}
  @Get('dashboard') dashboard(@Req() req: any) { return this.svc.getDashboard(req.user.tenantId); }
  @Get('refresh') refresh(@Req() req: any) { return this.svc.refreshAll(req.user.tenantId); }
  @Get('at-risk') atRisk(@Req() req: any, @Query() q: any) { return this.svc.listAtRisk(req.user.tenantId, q); }
  @Get('configs') configs(@Req() req: any) { return this.svc.listConfigs(req.user.tenantId); }
  @Post('configs') upsertConfig(@Req() req: any, @Body() body: any) { return this.svc.upsertConfig(req.user.tenantId, body); }
  @Get('customer/:customerId') customerRisk(@Req() req: any, @Body() _b: any, @Query('customerId') customerId: string) { return this.svc.computeForCustomer(req.user.tenantId, customerId); }
}
