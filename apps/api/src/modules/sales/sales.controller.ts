import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/guards/require-permission.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto.js';
import type { JwtPayload, PaymentStatus, SaleStatus, SaleType } from '@saas/shared';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  @RequirePermission('satis:sale:view')
  @ApiOperation({ summary: 'Satış listesi' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: SaleStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('type') type?: SaleType,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.sales.list(user.tid, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
      customerId, status, paymentStatus, type, search,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  @RequirePermission('satis:sale:view')
  @ApiOperation({ summary: 'Satış detayı (kalemlerle)' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.sales.findById(user.tid, id);
  }

  @Post()
  @RequirePermission('satis:sale:create')
  @ApiOperation({ summary: 'Yeni satış (DRAFT veya CONFIRMED)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSaleDto) {
    return this.sales.create(
      user.tid,
      {
        ...dto,
        saleDate: new Date(dto.saleDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      user.sub,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Taslak satış güncelle' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.sales.update(
      user.tid,
      id,
      {
        ...dto,
        saleDate: new Date(dto.saleDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      user.sub,
    );
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'DRAFT → CONFIRMED (stok + cari hareket oluşturur)' })
  confirm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.sales.confirm(user.tid, id, user.sub);
  }

  @Post(':id/cancel')
  @RequirePermission('satis:sale:cancel')
  @ApiOperation({ summary: 'Satış iptal (ters kayıt)' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.sales.cancel(user.tid, id, user.sub, body?.reason);
  }

  @Delete(':id')
  @RequirePermission('satis:sale:view')
  @ApiOperation({ summary: 'Taslak satışı sil (soft)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.sales.remove(user.tid, id);
  }
}
