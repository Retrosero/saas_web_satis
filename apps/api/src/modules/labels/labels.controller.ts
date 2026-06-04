import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { LabelsService } from './labels.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('labels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('labels')
export class LabelsController {
  constructor(private readonly svc: LabelsService) {}
  @Get('templates') list(@Req() req: any) { return this.svc.listTemplates(req.user.tenantId); }
  @Get('templates/:id') get(@Req() req: any, @Param('id') id: string) { return this.svc.getTemplate(req.user.tenantId, id); }
  @Post('templates') create(@Req() req: any, @Body() body: any) { return this.svc.createTemplate(req.user.tenantId, body, req.user.id); }
  @Put('templates/:id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.svc.updateTemplate(req.user.tenantId, id, body); }
  @Delete('templates/:id') delete(@Req() req: any, @Param('id') id: string) { return this.svc.deleteTemplate(req.user.tenantId, id); }
  @Post('print') print(@Req() req: any, @Body() body: { templateId: string; productIds: string[]; copies?: number }) { return this.svc.printLabels(req.user.tenantId, body.templateId, body.productIds, body.copies ?? 1, req.user.id); }
  @Get('jobs') jobs(@Req() req: any, @Query('limit') limit?: string) { return this.svc.listPrintJobs(req.user.tenantId, limit ? Number(limit) : 30); }
}
