import { Body, Controller, Get, Param, Post, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/guards/require-permission.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CashService } from './cash.service.js';
import {
  CreateCashAccountDto,
  CreateCashMovementDto,
  UpdateCashAccountDto,
} from './dto/cash.dto.js';
import type {
  CashAccountType,
  CashAccountStatus,
  CashMovementType,
  JwtPayload,
} from '@saas/shared';

@ApiTags('cash')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@RequirePermission('kasa:cash_account:view')
@Controller('cash')
export class CashController {
  constructor(private readonly cash: CashService) {}

  // ----- Accounts -----

  @Post('accounts')
  @ApiOperation({ summary: 'Yeni kasa/banka hesabı oluştur' })
  createAccount(@CurrentUser() user: JwtPayload, @Body() dto: CreateCashAccountDto) {
    return this.cash.createAccount(user.tid, { ...dto }, user.sub);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Kasa/banka hesapları listesi (bakiyeli)' })
  listAccounts(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: CashAccountType,
    @Query('status') status?: CashAccountStatus,
    @Query('search') search?: string,
  ) {
    return this.cash.listAccounts(user.tid, { type, status, search });
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Kasa/banka detayı (bakiye dahil)' })
  findAccount(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cash.findAccount(user.tid, id);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Kasa/banka güncelle' })
  updateAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCashAccountDto,
  ) {
    return this.cash.updateAccount(user.tid, id, dto);
  }

  @Post('accounts/:id/deactivate')
  @ApiOperation({ summary: 'Kasa/banka pasif yap (hareketi varsa reddeder)' })
  deactivateAccount(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cash.deactivateAccount(user.tid, id);
  }

  // ----- Movements -----

  @Post('movements')
  @ApiOperation({ summary: 'Kasa hareketi oluştur (IN/OUT/TRANSFER)' })
  createMovement(@CurrentUser() user: JwtPayload, @Body() dto: CreateCashMovementDto) {
    return this.cash.createMovement(
      user.tid,
      {
        cashAccountId: dto.cashAccountId,
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency,
        movementDate: dto.movementDate ? new Date(dto.movementDate) : undefined,
        refType: dto.refType,
        refId: dto.refId,
        description: dto.description,
        transferToAccountId: dto.transferToAccountId,
        customerId: dto.customerId,
      },
      user.sub,
    );
  }

  @Get('movements')
  @ApiOperation({ summary: 'Kasa hareketleri listesi' })
  listMovements(
    @CurrentUser() user: JwtPayload,
    @Query('cashAccountId') cashAccountId?: string,
    @Query('type') type?: CashMovementType,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.cash.listMovements(user.tid, {
      cashAccountId,
      type,
      search,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }

  @Post('movements/:id/reverse')
  @ApiOperation({ summary: 'Hareketi tersine çevir (yeni ters kayıt oluşturur)' })
  reverseMovement(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cash.reverseMovement(user.tid, id, user.sub);
  }
}