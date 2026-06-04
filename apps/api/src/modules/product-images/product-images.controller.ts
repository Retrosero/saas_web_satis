import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { ProductImagesService } from './product-images.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('product-images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('product-images')
export class ProductImagesController {
  constructor(private readonly svc: ProductImagesService) {}
  @Get() list(@Req() req: any, @Query() q: any) { return this.svc.list(req.user.tenantId, q); }
  @Get('dashboard') dashboard(@Req() req: any) { return this.svc.getDashboard(req.user.tenantId); }
  @Post() add(@Req() req: any, @Body() body: any) { return this.svc.add(req.user.tenantId, body, req.user.id); }
  @Post('batch-upload') batch(@Req() req: any, @Body() body: { files: any[]; matchBy: 'filename' | 'barcode' | 'productCode' }) { return this.svc.batchUpload(req.user.tenantId, body, req.user.id); }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) { return this.svc.remove(req.user.tenantId, id); }
}
