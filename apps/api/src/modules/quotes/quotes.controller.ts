import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { QuotesService } from './quotes.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuoteStatus } from '@saas/shared';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly svc: QuotesService) {}

  @Get()
  list(@Req() req: any, @Query() q: any) { return this.svc.list(req.user.tenantId, q); }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) { return this.svc.get(req.user.tenantId, id); }

  @Post()
  create(@Req() req: any, @Body() body: any) { return this.svc.create(req.user.tenantId, body, req.user.id); }

  @Put(':id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: QuoteStatus; note?: string }) { return this.svc.updateStatus(req.user.tenantId, id, body.status, req.user.id, body.note); }

  @Post(':id/convert-to-order')
  convertToOrder(@Req() req: any, @Param('id') id: string) { return this.svc.convertToOrder(req.user.tenantId, id, req.user.id); }

  @Post(':id/convert-to-sale')
  convertToSale(@Req() req: any, @Param('id') id: string) { return this.svc.convertToSale(req.user.tenantId, id, req.user.id); }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) { return this.svc.delete(req.user.tenantId, id); }
}
