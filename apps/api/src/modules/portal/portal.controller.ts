import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortalService, type PortalJwtPayload } from './portal.service.js';
import { PortalAuthGuard } from './portal-auth.guard.js';

@ApiTags('portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Post('auth/login')
  @ApiOperation({ summary: 'Müşteri portal girişi (tenantCode + customerCode + PIN)' })
  async login(@Body() body: { tenantCode: string; customerCode: string; password: string }) {
    return this.portal.login(body.tenantCode, body.customerCode, body.password);
  }

  // ====== Authenticated endpoints ======
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  @ApiOperation({ summary: 'Müşteri profil bilgisi' })
  async me(@Req() req: any) {
    const p = req.portal as PortalJwtPayload;
    return this.portal.getProfile(p.tid, p.sub);
  }

  @Get('balance')
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async balance(@Req() req: any) {
    const p = req.portal as PortalJwtPayload;
    return this.portal.getBalance(p.tid, p.sub);
  }

  @Get('statement')
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async statement(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = req.portal as PortalJwtPayload;
    return this.portal.getStatement(p.tid, p.sub, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Get('catalog')
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async catalog(@Req() req: any, @Query('search') search?: string, @Query('categoryId') categoryId?: string, @Query('brandId') brandId?: string, @Query('minPrice') minPrice?: string, @Query('maxPrice') maxPrice?: string, @Query('inStockOnly') inStockOnly?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = req.portal as PortalJwtPayload;
    return this.portal.getCatalog(p.tid, {
      search, categoryId, brandId,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStockOnly: inStockOnly === 'true',
      page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 24,
    });
  }

  @Get('products/:id')
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async productDetail(@Req() req: any, @Query('id') id: string) {
    const p = req.portal as PortalJwtPayload;
    return this.portal.getProductDetail(p.tid, id);
  }

  @Get('orders')
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async orders(@Req() req: any, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = req.portal as PortalJwtPayload;
    return this.portal.getOrders(p.tid, p.sub, { page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 25 });
  }

  @Get('orders/:id')
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async orderDetail(@Req() req: any, @Query('id') id: string) {
    const p = req.portal as PortalJwtPayload;
    return this.portal.getOrderDetail(p.tid, p.sub, id);
  }
}
