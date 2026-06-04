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
import { CollectionsService } from './collections.service.js';
import { CreateCollectionDto } from './dto/collection.dto.js';
import type {
  CollectionStatus,
  CollectionType,
  JwtPayload,
} from '@saas/shared';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Tahsilat listesi' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: CollectionStatus,
    @Query('type') type?: CollectionType,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.collections.list(user.tid, {
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
  @ApiOperation({ summary: 'Tahsilat detayı' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.collections.findById(user.tid, id);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni tahsilat (PENDING)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCollectionDto) {
    return this.collections.create(
      user.tid,
      {
        customerId: dto.customerId,
        collectionDate: new Date(dto.collectionDate),
        type: dto.type,
        amount: dto.amount,
        linkedSaleId: dto.linkedSaleId,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
      },
      user.sub,
    );
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Tahsilatı onayla — cari alacak + kasa hareketi oluştur' })
  confirm(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { cashAccountId: string },
  ) {
    return this.collections.confirm(user.tid, id, body.cashAccountId, user.sub);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Tahsilatı iptal et — ters hareketler oluştur' })
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.collections.cancel(user.tid, id, user.sub, body.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Tahsilat sil (sadece PENDING)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.collections.remove(user.tid, id);
  }
}
