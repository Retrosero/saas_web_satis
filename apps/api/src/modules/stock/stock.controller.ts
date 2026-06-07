import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/guards/require-permission.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { StockService } from './stock.service';
import {
  CreateStockMovementDto,
  FilterStockMovementDto,
  StockAdjustDto,
  StockTransferDto,
} from './dto/stock-movement.dto.js';
import type { JwtPayload } from '@saas/shared';

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stock: StockService) {}

  /**
   * Tüm stok hareketlerini listele (filtre + sayfalama).
   */
  @Get('movements')
  @RequirePermission('stok:product:view')
  @ApiOperation({ summary: 'Stok hareketleri listesi' })
  list(@CurrentUser() user: JwtPayload, @Query() filter: FilterStockMovementDto) {
    return this.stock.list(user.tid, {
      ...filter,
      from: filter.from ? new Date(filter.from) : undefined,
      to: filter.to ? new Date(filter.to) : undefined,
    });
  }

  /**
   * Anlık stok miktarı: ürün + depo.
   */
  @Get('quantity')
  @ApiOperation({ summary: 'Ürünün belirli depodaki anlık miktarı' })
  async getQuantity(
    @CurrentUser() user: JwtPayload,
    @Query('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
  ) {
    const quantity = await this.stock.getStockQuantity(user.tid, productId, warehouseId);
    return { productId, warehouseId, quantity };
  }

  /**
   * Manuel IN/OUT/ADJUST hareketi.
   */
  @Post('movement')
  @RequirePermission('stok:product:view')
  @ApiOperation({ summary: 'Manuel stok hareketi (IN/OUT/ADJUST)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStockMovementDto) {
    return this.stock.create(
      user.tid,
      {
        ...dto,
        movementDate: new Date(dto.movementDate),
      },
      user.sub,
    );
  }

  /**
   * Depo arası transfer (atomik — 2 hareket).
   */
  @Post('transfer')
  @RequirePermission('stok:product:view')
  @ApiOperation({ summary: 'Depo arası transfer' })
  transfer(@CurrentUser() user: JwtPayload, @Body() dto: StockTransferDto) {
    return this.stock.createTransfer(
      user.tid,
      { ...dto, movementDate: new Date(dto.movementDate) },
      user.sub,
    );
  }

  /**
   * Sayım düzeltmesi (fire, hasar, envanter farkı).
   */
  @Post('adjust')
  @RequirePermission('stok:product:view')
  @ApiOperation({ summary: 'Stok düzeltme (sayım farkı, fire)' })
  adjust(@CurrentUser() user: JwtPayload, @Body() dto: StockAdjustDto) {
    return this.stock.adjust(
      user.tid,
      { ...dto, movementDate: new Date(dto.movementDate) },
      user.sub,
    );
  }

  /**
   * Hareketi ters kayıt ile iptal et.
   */
  @Post('movement/:id/reverse')
  @ApiOperation({ summary: 'Hareketi ters kayıt ile iptal et' })
  reverse(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.stock.reverse(user.tid, id, user.sub);
  }
}
