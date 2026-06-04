import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CustomerSegmentsService } from './customer-segments.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SegmentType } from '@saas/shared';

@ApiTags('customer-segments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customer-segments')
export class CustomerSegmentsController {
  constructor(private readonly svc: CustomerSegmentsService) {}
  @Get() list(@Req() req: any) { return this.svc.list(req.user.tenantId); }
  @Get(':id') get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.user.tenantId, id); }
  @Post() create(@Req() req: any, @Body() body: any) { return this.svc.create(req.user.tenantId, body, req.user.id); }
  @Put(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.svc.update(req.user.tenantId, id, body); }
  @Delete(':id') delete(@Req() req: any, @Param('id') id: string) { return this.svc.delete(req.user.tenantId, id); }
  @Post(':id/members') addMember(@Req() req: any, @Param('id') id: string, @Body() body: { customerId: string }) { return this.svc.addMember(req.user.tenantId, id, body.customerId); }
  @Delete(':id/members/:customerId') removeMember(@Req() req: any, @Param('id') id: string, @Param('customerId') customerId: string) { return this.svc.removeMember(req.user.tenantId, id, customerId); }
  @Post(':id/refresh') refresh(@Req() req: any, @Param('id') id: string) { return this.svc.refreshSegment(req.user.tenantId, id); }
}
