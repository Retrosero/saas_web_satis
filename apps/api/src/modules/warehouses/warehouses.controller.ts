import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto.js';
import type { JwtPayload, WarehouseStatus } from '@saas/shared';

@ApiTags('warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehouses: WarehousesService) {}

  @Get()
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

  @Get(':id')
  @ApiOperation({ summary: 'Depo detayı' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.warehouses.findById(user.tid, id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni depo oluştur' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWarehouseDto) {
    return this.warehouses.create(user.tid, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Depo güncelle' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouses.update(user.tid, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Depo sil (soft)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.warehouses.remove(user.tid, id);
  }
}
