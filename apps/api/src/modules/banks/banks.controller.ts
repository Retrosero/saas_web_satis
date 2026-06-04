import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BanksService } from './banks.service.js';
import type {
  BankAccountStatus,
  BankAccountType,
  BankTransactionType,
  CreateBankAccountInput,
  CreateBankTransactionInput,
  CreatePosCollectionInput,
  CreatePosDeviceInput,
  JwtPayload,
  PosCollectionStatus,
  PosStatus,
} from '@saas/shared';

@ApiTags('banks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('banks')
export class BanksController {
  constructor(private readonly banks: BanksService) {}

  // ===== BANK ACCOUNTS =====
  @Get('accounts')
  @ApiOperation({ summary: 'Banka hesapları listesi (bakiyelerle)' })
  listAccounts(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('status') status?: BankAccountStatus,
    @Query('type') type?: BankAccountType,
  ) {
    return this.banks.listAccounts(user.tid, { search, status, type });
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Banka hesabı detayı' })
  getAccount(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.banks.getAccount(user.tid, id);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Yeni banka hesabı' })
  createAccount(@CurrentUser() user: JwtPayload, @Body() body: CreateBankAccountInput) {
    return this.banks.createAccount(user.tid, body, user.sub);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Banka hesabı güncelle' })
  updateAccount(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: Partial<CreateBankAccountInput>) {
    return this.banks.updateAccount(user.tid, id, body, user.sub);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Banka hesabı sil (soft)' })
  async deleteAccount(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.banks.deleteAccount(user.tid, id, user.sub);
    return { ok: true };
  }

  // ===== BANK TRANSACTIONS =====
  @Get('transactions')
  @ApiOperation({ summary: 'Banka hareketleri' })
  listTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('bankAccountId') bankAccountId?: string,
    @Query('type') type?: BankTransactionType,
    @Query('customerId') customerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.banks.listTransactions(user.tid, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
      bankAccountId, type, customerId, search,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Yeni banka hareketi' })
  createTransaction(@CurrentUser() user: JwtPayload, @Body() body: CreateBankTransactionInput) {
    return this.banks.createTransaction(user.tid, body, user.sub);
  }

  @Post('transactions/:id/reconcile')
  reconcile(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.banks.reconcileTransaction(user.tid, id, user.sub);
  }

  // ===== POS DEVICES =====
  @Get('pos-devices')
  listPos(@CurrentUser() user: JwtPayload) {
    return this.banks.listPosDevices(user.tid);
  }

  @Post('pos-devices')
  createPos(@CurrentUser() user: JwtPayload, @Body() body: CreatePosDeviceInput) {
    return this.banks.createPosDevice(user.tid, body, user.sub);
  }

  @Put('pos-devices/:id')
  updatePos(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: Partial<CreatePosDeviceInput> & { status?: PosStatus }) {
    return this.banks.updatePosDevice(user.tid, id, body, user.sub);
  }

  // ===== POS COLLECTIONS =====
  @Get('pos-collections')
  listPosCollections(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('posDeviceId') posDeviceId?: string,
    @Query('status') status?: PosCollectionStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.banks.listPosCollections(user.tid, {
      page: page ? Number(page) : 1, pageSize: pageSize ? Number(pageSize) : 25,
      posDeviceId, status,
      from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined,
    });
  }

  @Post('pos-collections')
  createPosCollection(@CurrentUser() user: JwtPayload, @Body() body: CreatePosCollectionInput) {
    return this.banks.createPosCollection(user.tid, body, user.sub);
  }

  @Post('pos-collections/:id/settle')
  settlePosCollection(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.banks.settlePosCollection(user.tid, id, user.sub);
  }

  // ===== REPORTS =====
  @Get('reports/pos-commission')
  commissionReport(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('posDeviceId') posDeviceId?: string,
  ) {
    return this.banks.posCommissionReport(user.tid, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      posDeviceId,
    });
  }
}
