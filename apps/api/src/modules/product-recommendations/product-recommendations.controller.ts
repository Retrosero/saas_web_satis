import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { ProductRecommendationsService } from './product-recommendations.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('product-recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('product-recommendations')
export class ProductRecommendationsController {
  constructor(private readonly svc: ProductRecommendationsService) {}
  @Get('for-customer/:customerId')
  forCustomer(@Req() req: any, @Param('customerId') customerId: string) { return this.svc.listForCustomer(req.user.tenantId, customerId); }
  @Get('rules') rules(@Req() req: any) { return this.svc.listRules(req.user.tenantId); }
  @Post('rules') createRule(@Req() req: any, @Body() body: any) { return this.svc.createRule(req.user.tenantId, body, req.user.id); }
  @Delete('rules/:id') deleteRule(@Req() req: any, @Param('id') id: string) { return this.svc.deleteRule(req.user.tenantId, id); }
}
