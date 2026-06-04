import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { DemoCompanyService } from './demo-company.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DemoDataSize } from '@saas/shared';

@ApiTags('demo-company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('demo-company')
export class DemoCompanyController {
  constructor(private readonly svc: DemoCompanyService) {}

  @Get('templates')
  templates() { return this.svc.listTemplates(); }

  @Get()
  list(@Req() req: any) { return this.svc.listCompanies(req.user.tenantId); }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.getCompany(id); }

  @Post('create')
  create(@Req() req: any, @Body() body: { size: DemoDataSize; templateCode: string }) { return this.svc.createDemoCompany(req.user.tenantId, body, req.user.id); }

  @Post('reset')
  reset(@Req() req: any) { return this.svc.resetDemo(req.user.tenantId, req.user.id); }

  @Post('convert')
  convert(@Req() req: any) { return this.svc.convertToReal(req.user.tenantId, req.user.id); }
}
