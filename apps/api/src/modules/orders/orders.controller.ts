import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/order.dto.js';
import type {
  JwtPayload,
  OrderStatus,
  OrderType,
} from '@saas/shared';


@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Sipariş listesi' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: OrderStatus,
    @Query('type') type?: OrderType,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.orders.list(user.tid, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
      customerId,
      status,
      type,
      search,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sipariş detayı (kalemlerle)' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.orders.findById(user.tid, id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni sipariş (PENDING)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.orders.create(
      user.tid,
      {
        customerId: dto.customerId,
        orderDate: new Date(dto.orderDate),
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        type: dto.type,
        status: dto.status,
        warehouseId: dto.warehouseId,
        items: dto.items,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
      },
      user.sub,
    );
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Siparişi onayla (PENDING → CONFIRMED)' })
  confirm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.orders.confirm(user.tid, id, user.sub);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Siparişi iptal et' })
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.orders.cancel(user.tid, id, user.sub, body.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Sipariş sil (sadece PENDING + satışa bağlı değil)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.orders.remove(user.tid, id);
  }
}
