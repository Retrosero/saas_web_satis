import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/guards/require-permission.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ProductsService } from './products.service';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from './dto/product.dto.js';
import type { JwtPayload } from '@saas/shared';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermission('stok:product:view')
  @ApiOperation({ summary: 'Ürün listesi (arama + filtre + toplam stok)' })
  list(@CurrentUser() user: JwtPayload, @Query() filter: FilterProductDto) {
    return this.products.list(user.tid, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ürün detayı (depo bazında stok dahil)' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.products.findById(user.tid, id);
  }

  @Post()
  @RequirePermission('stok:product:create')
  @ApiOperation({ summary: 'Yeni ürün' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.products.create(user.tid, dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ürün güncelle' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(user.tid, id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermission('stok:product:view')
  @ApiOperation({ summary: 'Ürün sil (soft, hareketi yoksa)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.products.remove(user.tid, id);
  }
}
