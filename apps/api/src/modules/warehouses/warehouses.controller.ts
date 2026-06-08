import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/guards/require-permission.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto.js';
import type { JwtPayload, WarehouseStatus } from '@saas/shared';

@ApiTags('warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehouses: WarehousesService) {}

  @Get()
  @RequirePermission('depo:warehouse:view')
  @ApiOperation({ summary: 'Depo listesi' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'PASSIVE'] })
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: WarehouseStatus,
  ) {
    return this.warehouses.list(user.tid, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
      search,
      status,
    });
  }

  @Get('unassigned-products/list')
  @RequirePermission('depo:warehouse:view')
  @ApiOperation({ summary: 'Varsayilan deposu olmayan urunler' })
  listUnassignedProducts(@CurrentUser() user: JwtPayload, @Query('search') search?: string) {
    return this.warehouses.listUnassignedProducts(user.tid, search);
  }

  @Get('transfers')
  @RequirePermission('depo:warehouse:view')
  @ApiOperation({ summary: 'Depolar arasi transfer listesi' })
  listTransfers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('fromWarehouseId') fromWarehouseId?: string,
    @Query('toWarehouseId') toWarehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.warehouses.listTransfers(user.tid, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
      fromWarehouseId,
      toWarehouseId,
      status,
    });
  }

  @Get(':id/stock')
  @RequirePermission('depo:warehouse:view')
  @ApiOperation({ summary: 'Depo stok ozeti' })
  getStock(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.warehouses.getStock(user.tid, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Depo detayi' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.warehouses.findById(user.tid, id);
  }

  @Post()
  @RequirePermission('depo:warehouse:create')
  @ApiOperation({ summary: 'Yeni depo olustur' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWarehouseDto) {
    return this.warehouses.create(user.tid, dto);
  }

  @Post('transfers')
  @RequirePermission('depo:warehouse:update')
  @ApiOperation({ summary: 'Depolar arasi transfer olustur' })
  createTransfer(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      fromWarehouseId: string;
      toWarehouseId: string;
      transferDate: string;
      description?: string;
      items: Array<{ productId: string; quantity: number; description?: string }>;
    },
  ) {
    return this.warehouses.createTransfer(
      user.tid,
      {
        ...body,
        transferDate: new Date(body.transferDate),
      },
      user.sub,
    );
  }

  @Patch(':id')
  @RequirePermission('depo:warehouse:update')
  @ApiOperation({ summary: 'Depo guncelle' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouses.update(user.tid, id, dto);
  }

  @Post(':id/deactivate')
  @RequirePermission('depo:warehouse:update')
  @ApiOperation({ summary: 'Depoyu pasife al' })
  deactivate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.warehouses.deactivate(user.tid, id);
  }

  @Post(':id/assign-products')
  @RequirePermission('depo:warehouse:update')
  @ApiOperation({ summary: 'Depoya varsayilan urunu ata' })
  assignProducts(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { productIds: string[] },
  ) {
    return this.warehouses.assignProducts(user.tid, id, body.productIds);
  }

  @Post('transfers/:id/confirm')
  @RequirePermission('depo:warehouse:update')
  @ApiOperation({ summary: 'Transferi onayla' })
  confirmTransfer(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.warehouses.confirmTransfer(user.tid, id, user.sub);
  }

  @Delete(':id')
  @RequirePermission('depo:warehouse:view')
  @ApiOperation({ summary: 'Depo sil (soft)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.warehouses.remove(user.tid, id);
  }
}
