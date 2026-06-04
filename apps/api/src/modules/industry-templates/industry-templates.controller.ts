import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { IndustryTemplatesService } from './industry-templates.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('industry-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('industry-templates')
export class IndustryTemplatesController {
  constructor(private readonly svc: IndustryTemplatesService) {}

  @Get()
  list(@Query() q: any) { return this.svc.listTemplates(q); }

  @Get('applied')
  applied(@Req() req: any) { return this.svc.listApplied(req.user.tenantId); }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.getTemplate(id); }

  @Get(':id/preview')
  preview(@Req() req: any, @Param('id') id: string) { return this.svc.previewApply(req.user.tenantId, id); }

  @Post(':id/apply')
  apply(@Req() req: any, @Param('id') id: string) { return this.svc.applyTemplate(req.user.tenantId, id, req.user.id); }
}
