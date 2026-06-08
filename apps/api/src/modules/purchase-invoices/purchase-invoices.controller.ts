import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/guards/require-permission.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PurchaseInvoicesService } from './purchase-invoices.service.js';
import { CreatePurchaseInvoiceDto, ListPurchaseInvoiceQueryDto } from './dto/purchase-invoice.dto.js';
import type { JwtPayload } from '@saas/shared';

@ApiTags('purchase-invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('purchase-invoices')
export class PurchaseInvoicesController {
  constructor(private readonly purchaseInvoices: PurchaseInvoicesService) {}

  @Get()
  @RequirePermission('stok:purchase:view')
  @ApiOperation({ summary: 'Alis faturasi listesi' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListPurchaseInvoiceQueryDto,
  ) {
    return this.purchaseInvoices.list(user.tid, {
      ...query,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
  }

  @Get('suppliers/search')
  @RequirePermission('stok:purchase:view')
  @ApiOperation({ summary: 'Alis faturasi icin tedarikci ara' })
  searchSuppliers(@CurrentUser() user: JwtPayload, @Query('search') search?: string) {
    return this.purchaseInvoices.searchSuppliers(user.tid, search);
  }

  @Get('products/search')
  @RequirePermission('stok:purchase:view')
  @ApiOperation({ summary: 'Alis faturasi icin urun ara' })
  searchProducts(@CurrentUser() user: JwtPayload, @Query('search') search?: string) {
    return this.purchaseInvoices.searchProducts(user.tid, search);
  }

  @Get(':id')
  @RequirePermission('stok:purchase:view')
  @ApiOperation({ summary: 'Alis faturasi detayi (kalemlerle)' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.purchaseInvoices.findById(user.tid, id);
  }

  @Post()
  @RequirePermission('stok:purchase:create')
  @ApiOperation({ summary: 'Yeni alis faturasi (DRAFT veya CONFIRMED)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePurchaseInvoiceDto) {
    return this.purchaseInvoices.create(
      user.tid,
      {
        ...dto,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      user.sub,
    );
  }

  @Post(':id/confirm')
  @RequirePermission('stok:purchase:confirm')
  @ApiOperation({ summary: 'DRAFT -> CONFIRMED (stok + cari hareket olusturur)' })
  confirm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.purchaseInvoices.confirm(user.tid, id, user.sub);
  }

  @Post(':id/cancel')
  @RequirePermission('stok:purchase:cancel')
  @ApiOperation({ summary: 'Faturayi iptal et (ters kayit olusturur)' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.purchaseInvoices.cancel(user.tid, id, user.sub, body?.reason);
  }

  @Delete(':id')
  @RequirePermission('stok:purchase:delete')
  @ApiOperation({ summary: 'Taslak faturayi sil (soft delete)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.purchaseInvoices.remove(user.tid, id);
  }
}
